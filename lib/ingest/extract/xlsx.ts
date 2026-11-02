import * as XLSX from 'xlsx';

export interface ExtractedSheet {
  sheetName: string;
  content: string;
}

export function extractXlsx(buffer: Buffer): {
  sheets: ExtractedSheet[];
  charCount: number;
} {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheets: ExtractedSheet[] = [];
  let totalChars = 0;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert sheet to json array of objects
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (jsonData.length === 0) continue;

    const rows: string[] = [];
    for (const row of jsonData) {
      const line = Object.entries(row)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
      if (line.trim()) {
        rows.push(line);
      }
    }

    const sheetContent = rows.join('\n');
    totalChars += sheetContent.length;

    sheets.push({
      sheetName,
      content: sheetContent,
    });
  }

  return {
    sheets,
    charCount: totalChars,
  };
}

