import dns from 'dns/promises';
import net from 'net';

/**
 * URL and Google Drive Content Fetcher (with SSRF & Memory Bounds Protection)
 */

const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
const FETCH_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;

export interface FetchedUrlResource {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  sourceType: 'gdrive_file' | 'gdocs' | 'gsheets' | 'webpage';
  originalUrl: string;
}

function isPrivateOrReservedIp(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^::ffff:/, '');
  if (net.isIPv4(normalized)) {
    const parts = normalized.split('.').map(Number);
    const [a, b] = parts;
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // Link-local / Cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224 // Multicast & reserved
    ) {
      return true;
    }
    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (
      lower === '::' ||
      lower === '::1' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe8') ||
      lower.startsWith('fe9') ||
      lower.startsWith('fea') ||
      lower.startsWith('feb')
    ) {
      return true;
    }
  }

  return false;
}

async function assertSafeExternalUrl(urlStr: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error('Format URL tidak valid');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Hanya protokol HTTP dan HTTPS yang diizinkan');
  }

  if (parsed.username || parsed.password) {
    throw new Error('URL dengan kredensial tertanam tidak diizinkan');
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal'
  ) {
    throw new Error('Akses ke jaringan lokal atau internal tidak diizinkan');
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error('Akses ke alamat IP privat atau internal tidak diizinkan');
    }
    return parsed;
  }

  const records = await dns.lookup(hostname, { all: true });
  if (!records || records.length === 0) {
    throw new Error('Domain tidak ditemukan');
  }
  for (const rec of records) {
    if (isPrivateOrReservedIp(rec.address)) {
      throw new Error('Domain mengarah ke jaringan internal yang diblokir');
    }
  }

  return parsed;
}

async function safeFetch(urlStr: string, headers: Record<string, string>): Promise<Response> {
  let currentUrl = urlStr;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeExternalUrl(currentUrl);

    const res = await fetch(currentUrl, {
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        throw new Error('Redirect tidak memiliki tujuan lokasi');
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_DOWNLOAD_BYTES) {
      throw new Error('Ukuran file dari URL melebihi batas maksimum 25 MB');
    }

    return res;
  }

  throw new Error('Terlalu banyak pengalihan (redirect) pada URL');
}

async function readBoundedBuffer(res: Response): Promise<Buffer> {
  if (!res.body) {
    return Buffer.alloc(0);
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > MAX_DOWNLOAD_BYTES) {
        await reader.cancel();
        throw new Error('Ukuran konten melebihi batas maksimum 25 MB');
      }
      chunks.push(value);
    }
  }

  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

export function detectUrlType(urlStr: string): {
  type: 'gdrive_file' | 'gdocs' | 'gsheets' | 'webpage';
  id?: string;
} {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Protokol URL harus http atau https');
    }

    // Google Docs
    const docsMatch = urlStr.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (docsMatch) {
      return { type: 'gdocs', id: docsMatch[1] };
    }

    // Google Sheets
    const sheetsMatch = urlStr.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (sheetsMatch) {
      return { type: 'gsheets', id: sheetsMatch[1] };
    }

    // Google Drive File
    const driveFileMatch = urlStr.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
    if (driveFileMatch) {
      return { type: 'gdrive_file', id: driveFileMatch[1] };
    }

    return { type: 'webpage' };
  } catch (err: any) {
    throw new Error(err?.message || 'Format URL tidak valid');
  }
}

export async function fetchUrlResource(
  urlStr: string,
  customTitle?: string
): Promise<FetchedUrlResource> {
  await assertSafeExternalUrl(urlStr);
  const { type, id } = detectUrlType(urlStr);

  const defaultHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: '*/*',
  };

  // 1. Google Docs Export (export format docx or txt)
  if (type === 'gdocs' && id) {
    const exportUrl = `https://docs.google.com/document/d/${id}/export?format=docx`;
    const res = await safeFetch(exportUrl, defaultHeaders);

    if (!res.ok) {
      throw new Error(
        'Gagal mengunduh Google Docs. Pastikan akses dokumen diatur ke "Siapa saja yang memiliki link" (Anyone with the link).'
      );
    }

    const buffer = await readBoundedBuffer(res);
    const fileName = `${(customTitle || 'Google Docs').replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'google-docs'}.docx`;

    return {
      fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer,
      sourceType: 'gdocs',
      originalUrl: urlStr,
    };
  }

  // 2. Google Sheets Export (export format csv)
  if (type === 'gsheets' && id) {
    const exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
    const res = await safeFetch(exportUrl, defaultHeaders);

    if (!res.ok) {
      throw new Error(
        'Gagal mengunduh Google Sheets. Pastikan akses sheet diatur ke "Siapa saja yang memiliki link".'
      );
    }

    const buffer = await readBoundedBuffer(res);
    const fileName = `${(customTitle || 'Google Sheets').replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'google-sheets'}.csv`;

    return {
      fileName,
      mimeType: 'text/csv',
      buffer,
      sourceType: 'gsheets',
      originalUrl: urlStr,
    };
  }

  // 3. Google Drive File Download
  if (type === 'gdrive_file' && id) {
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;
    const res = await safeFetch(downloadUrl, defaultHeaders);

    if (!res.ok) {
      throw new Error(
        'Gagal mengunduh file Google Drive. Pastikan file dibagikan secara publik (Siapa saja yang memiliki link).'
      );
    }

    const contentType = res.headers.get('content-type') || '';
    const buffer = await readBoundedBuffer(res);

    // If Google returned an HTML page instead of the file, it means access is restricted or file is too large without direct confirm
    if (contentType.includes('text/html')) {
      const htmlText = buffer.toString('utf-8');
      if (htmlText.includes('Access denied') || htmlText.includes('Sign in') || htmlText.includes('permission')) {
        throw new Error(
          'Akses Google Drive ditolak. Silakan ubah izin file menjadi "Siapa saja dengan link dapat melihat" (Anyone with the link can view).'
        );
      }
    }

    // Try extracting filename from Content-Disposition header
    let fileName = customTitle ? `${customTitle.trim()}` : '';
    const disposition = res.headers.get('content-disposition');
    if (!fileName && disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
      if (match && match[1]) {
        fileName = decodeURIComponent(match[1]);
      }
    }

    if (!fileName) {
      if (contentType.includes('pdf')) fileName = 'gdrive-dokumen.pdf';
      else if (contentType.includes('word') || contentType.includes('docx')) fileName = 'gdrive-dokumen.docx';
      else if (contentType.includes('sheet') || contentType.includes('excel')) fileName = 'gdrive-dokumen.xlsx';
      else fileName = 'gdrive-dokumen.bin';
    }

    let finalContentType = contentType || 'application/octet-stream';

    // Inspect magic bytes to guarantee proper file extension & MIME type
    const magicHex = buffer.slice(0, 4).toString('hex');
    if (magicHex === '25504446') {
      if (!fileName.toLowerCase().endsWith('.pdf')) fileName += '.pdf';
      finalContentType = 'application/pdf';
    } else if (magicHex === '504b0304') {
      if (!fileName.toLowerCase().endsWith('.docx') && !fileName.toLowerCase().endsWith('.xlsx')) {
        fileName += '.docx';
      }
      finalContentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    return {
      fileName,
      mimeType: finalContentType,
      buffer,
      sourceType: 'gdrive_file',
      originalUrl: urlStr,
    };
  }

  // 4. General Web Article / Webpage (HTML)
  const res = await safeFetch(urlStr, defaultHeaders);
  if (!res.ok) {
    throw new Error(`Gagal membuka halaman web (${res.status} ${res.statusText})`);
  }

  const rawBuf = await readBoundedBuffer(res);
  const html = rawBuf.toString('utf-8');

  // Extract page title
  let pageTitle = customTitle || '';
  if (!pageTitle) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      pageTitle = titleMatch[1].trim();
    }
  }
  if (!pageTitle) {
    try {
      pageTitle = new URL(urlStr).hostname;
    } catch {
      pageTitle = 'web-article';
    }
  }

  // Strip scripts, styles, nav, footers, etc.
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // Convert line breaks and headers
  cleaned = cleaned
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/(p|div|tr|h1|h2|h3|h4|h5|h6|li|blockquote)>/gi, '\n\n')
    .replace(/<(h[1-6])[^>]*>(.*?)<\/\1>/gi, '\n\n### $2\n\n');

  // Strip remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize whitespace
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim().replace(/\s+/g, ' '))
    .filter((l) => l.length > 0);

  const articleText = `# ${pageTitle}\nSumber URL: ${urlStr}\n\n` + lines.join('\n\n');

  if (articleText.trim().length < 50) {
    throw new Error('Konten teks pada halaman web terlalu sedikit atau dilindungi login/JavaScript render.');
  }

  const safeFileName = `${pageTitle.replace(/[^a-zA-Z0-9_\- ]/g, '').slice(0, 40).trim() || 'web-article'}.txt`;

  return {
    fileName: safeFileName,
    mimeType: 'text/plain',
    buffer: Buffer.from(articleText, 'utf-8'),
    sourceType: 'webpage',
    originalUrl: urlStr,
  };
}

