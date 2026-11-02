import Papa from 'papaparse';

export function extractPlainText(raw: string): {
  content: string;
  charCount: number;
} {
  const content = raw.trim();
  return {
    content,
    charCount: content.length,
  };
}

export function extractCsv(raw: string): {
  content: string;
  charCount: number;
} {
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  const lines: string[] = [];
  for (const row of parsed.data) {
    const line = Object.entries(row)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
    if (line.trim()) {
      lines.push(line);
    }
  }

  const content = lines.join('\n');
  return {
    content,
    charCount: content.length,
  };
}

