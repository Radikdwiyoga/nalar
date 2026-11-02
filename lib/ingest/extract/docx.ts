import mammoth from 'mammoth';

export async function extractDocx(buffer: Buffer): Promise<{
  content: string;
  charCount: number;
}> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  return {
    content: text,
    charCount: text.length,
  };
}

