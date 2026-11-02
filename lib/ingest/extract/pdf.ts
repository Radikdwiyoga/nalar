import { extractText, getDocumentProxy } from 'unpdf';

export interface ExtractedPage {
  pageNumber: number;
  content: string;
}

export async function extractPdf(buffer: Uint8Array): Promise<{
  pages: ExtractedPage[];
  pageCount: number;
  charCount: number;
}> {
  const doc = await getDocumentProxy(buffer);
  const pageCount = doc.numPages;
  const pages: ExtractedPage[] = [];
  let totalChars = 0;

  const { text } = await extractText(buffer, { mergePages: false });

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
    pageCount,
    charCount: totalChars,
  };
}
