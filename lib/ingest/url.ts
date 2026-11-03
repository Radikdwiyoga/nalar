/**
 * URL and Google Drive Content Fetcher
 */

export interface FetchedUrlResource {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  sourceType: 'gdrive_file' | 'gdocs' | 'gsheets' | 'webpage';
  originalUrl: string;
}

export function detectUrlType(urlStr: string): {
  type: 'gdrive_file' | 'gdocs' | 'gsheets' | 'webpage';
  id?: string;
} {
  try {
    const url = new URL(urlStr);

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
  } catch (err) {
    throw new Error('Format URL tidak valid');
  }
}

export async function fetchUrlResource(
  urlStr: string,
  customTitle?: string
): Promise<FetchedUrlResource> {
  const { type, id } = detectUrlType(urlStr);

  const defaultHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: '*/*',
  };

  // 1. Google Docs Export (export format docx or txt)
  if (type === 'gdocs' && id) {
    const exportUrl = `https://docs.google.com/document/d/${id}/export?format=docx`;
    const res = await fetch(exportUrl, { headers: defaultHeaders, redirect: 'follow' });

    if (!res.ok) {
      throw new Error(
        'Gagal mengunduh Google Docs. Pastikan akses dokumen diatur ke "Siapa saja yang memiliki link" (Anyone with the link).'
      );
    }

    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
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
    const res = await fetch(exportUrl, { headers: defaultHeaders, redirect: 'follow' });

    if (!res.ok) {
      throw new Error(
        'Gagal mengunduh Google Sheets. Pastikan akses sheet diatur ke "Siapa saja yang memiliki link".'
      );
    }

    const text = await res.text();
    const buffer = Buffer.from(text, 'utf-8');
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
    const res = await fetch(downloadUrl, { headers: defaultHeaders, redirect: 'follow' });

    if (!res.ok) {
      throw new Error(
        'Gagal mengunduh file Google Drive. Pastikan file dibagikan secara publik (Siapa saja yang memiliki link).'
      );
    }

    const contentType = res.headers.get('content-type') || '';

    // If Google returned an HTML page instead of the file, it means access is restricted or file is too large without direct confirm
    if (contentType.includes('text/html')) {
      const htmlText = await res.text();
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
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

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
  const res = await fetch(urlStr, { headers: defaultHeaders, redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Gagal membuka halaman web (${res.status} ${res.statusText})`);
  }

  const html = await res.text();

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

