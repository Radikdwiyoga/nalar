import { extractText } from 'unpdf';

export interface ExtractedPage {
  pageNumber: number;
  content: string;
}

export async function extractPdf(buffer: Uint8Array): Promise<{
  pages: ExtractedPage[];
  pageCount: number;
  charCount: number;
}> {
  // Always use a fresh copy of the buffer to prevent ArrayBuffer detachment
  const freshBuffer = new Uint8Array(buffer);
  const { totalPages, text } = await extractText(freshBuffer, { mergePages: false });

  const pages: ExtractedPage[] = [];
  let totalChars = 0;

  if (Array.isArray(text)) {
    for (let i = 0; i < text.length; i++) {
      const pageText = text[i] || '';
      pages.push({
        pageNumber: i + 1,
        content: pageText.trim(),
      });
      totalChars += pageText.length;
    }
  } else {
    pages.push({
      pageNumber: 1,
      content: String(text).trim(),
    });
    totalChars += String(text).length;
  }

  return {
    pages,
    pageCount: totalPages || pages.length,
    charCount: totalChars,
  };
}
