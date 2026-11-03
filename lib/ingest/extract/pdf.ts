import { extractText } from 'unpdf';
import { GoogleGenAI } from '@google/genai';

export interface ExtractedPage {
  pageNumber: number;
  content: string;
}

export async function extractPdf(buffer: Uint8Array): Promise<{
  pages: ExtractedPage[];
  pageCount: number;
  charCount: number;
  isOcr?: boolean;
}> {
  // Always use a fresh copy of the buffer to prevent ArrayBuffer detachment
  const freshBuffer = new Uint8Array(buffer);
  const { totalPages, text } = await extractText(freshBuffer, { mergePages: false });

  const pages: ExtractedPage[] = [];
  let totalChars = 0;

  if (Array.isArray(text)) {
    for (let i = 0; i < text.length; i++) {
      const pageText = (text[i] || '').trim();
      pages.push({
        pageNumber: i + 1,
        content: pageText,
      });
      totalChars += pageText.length;
    }
  } else {
    const pageText = String(text || '').trim();
    pages.push({
      pageNumber: 1,
      content: pageText,
    });
    totalChars += pageText.length;
  }

  // If digital text extraction succeeded with substantial characters, return it
  if (totalChars >= 50) {
    return {
      pages,
      pageCount: totalPages || pages.length,
      charCount: totalChars,
      isOcr: false,
    };
  }

  // If text is empty or very short (< 50 chars), it's a scanned PDF / image-only!
  // Fallback to Gemini OCR Vision
  console.log(`PDF has only ${totalChars} chars across ${totalPages} pages. Triggering Gemini OCR vision...`);
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

    const ai = new GoogleGenAI({ apiKey });
    const base64Data = Buffer.from(buffer).toString('base64');

    const ocrResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data,
              },
            },
            {
              text: 'Tolong transkripsikan dan ekstrak teks dari dokumen ini secara lengkap per halaman dengan format persis:\n--- HALAMAN 1 ---\n[teks]\n--- HALAMAN 2 ---\n[teks]',
            },
          ],
        },
      ],
    });

    const ocrText = ocrResponse.text || '';
    if (ocrText.trim().length > 50) {
      const pageRegex = /---\s*HALAMAN\s*(\d+)\s*---/gi;
      const ocrPages: ExtractedPage[] = [];
      const parts = ocrText.split(pageRegex);

      if (parts.length > 1) {
        for (let i = 1; i < parts.length; i += 2) {
          const pageNum = parseInt(parts[i], 10) || Math.floor(i / 2) + 1;
          const pageContent = (parts[i + 1] || '').trim();
          ocrPages.push({
            pageNumber: pageNum,
            content: pageContent,
          });
        }
      }

      if (ocrPages.length === 0) {
        ocrPages.push({
          pageNumber: 1,
          content: ocrText.trim(),
        });
      }

      const ocrTotalChars = ocrPages.reduce((acc, p) => acc + p.content.length, 0);

      return {
        pages: ocrPages,
        pageCount: ocrPages.length,
        charCount: ocrTotalChars,
        isOcr: true,
      };
    }
  } catch (ocrErr) {
    console.warn('Gemini OCR fallback failed:', ocrErr);
  }

  return {
    pages,
    pageCount: totalPages || pages.length,
    charCount: totalChars,
    isOcr: false,
  };
}
