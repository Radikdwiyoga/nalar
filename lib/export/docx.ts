import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';

function parseInlineRuns(text: string, options?: { forceBold?: boolean; color?: string }): TextRun[] {
  // Regex to match **bold** or *italic*
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  const runs: TextRun[] = [];

  for (const token of tokens) {
    if (!token) continue;
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      runs.push(
        new TextRun({
          text: token.slice(2, -2),
          bold: true,
          color: options?.color,
        })
      );
    } else if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      runs.push(
        new TextRun({
          text: token.slice(1, -1),
          italics: true,
          bold: options?.forceBold,
          color: options?.color,
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: token,
          bold: options?.forceBold,
          color: options?.color,
        })
      );
    }
  }

  return runs.length > 0
    ? runs
    : [new TextRun({ text, bold: options?.forceBold, color: options?.color })];
}

function isTableLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2;
}

function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  return /^\|[\s|:\-]+\|$/.test(trimmed) && trimmed.includes('-');
}

function parseTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function buildDocxTable(tableLines: string[]): Table | null {
  const contentRows = tableLines
    .filter((l) => !isTableSeparatorLine(l))
    .map(parseTableCells)
    .filter((cells) => cells.length > 0);

  if (contentRows.length === 0) return null;

  const colCount = Math.max(...contentRows.map((r) => r.length));
  const colWidthPct = Math.floor(100 / Math.max(1, colCount));

  const borderDef = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: 'D6CFC2',
  };

  const rows = contentRows.map((cells, rowIdx) => {
    const isHeader = rowIdx === 0;
    const paddedCells = Array.from({ length: colCount }, (_, idx) => cells[idx] ?? '');

    return new TableRow({
      tableHeader: isHeader,
      children: paddedCells.map(
        (cellText) =>
          new TableCell({
            width: { size: colWidthPct, type: WidthType.PERCENTAGE },
            shading: isHeader
              ? { type: ShadingType.CLEAR, fill: 'F3EAE2', color: 'auto' }
              : rowIdx % 2 === 1
              ? { type: ShadingType.CLEAR, fill: 'FAF8F5', color: 'auto' }
              : undefined,
            margins: {
              top: 100,
              bottom: 100,
              left: 140,
              right: 140,
            },
            borders: {
              top: borderDef,
              bottom: borderDef,
              left: borderDef,
              right: borderDef,
            },
            children: [
              new Paragraph({
                children: parseInlineRuns(cellText, {
                  forceBold: isHeader,
                  color: isHeader ? '8C3210' : '1C1B18',
                }),
                spacing: { after: 40 },
              }),
            ],
          })
      ),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

export async function markdownToDocxBlob(title: string, markdown: string): Promise<Blob> {
  const children: Array<Paragraph | Table> = [];

  // Extract main title if first line is '# ...'
  let docTitle = title;
  const lines = markdown.split('\n');
  if (lines.length > 0 && lines[0].startsWith('# ')) {
    docTitle = lines[0].replace(/^#\s+/, '').trim();
    lines.shift();
  }

  // Document Title
  children.push(
    new Paragraph({
      text: docTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  );

  // Subtitle / attribution
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Dihasilkan oleh Nalar AI • ${new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}`,
          italics: true,
          size: 20, // 10pt
          color: '666666',
        }),
      ],
      spacing: { after: 400 },
    })
  );

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i].trim();

    if (!rawLine) {
      children.push(new Paragraph({ spacing: { after: 120 } }));
      i++;
      continue;
    }

    // Markdown Table Block
    if (isTableLine(rawLine)) {
      const tableBlock: string[] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        tableBlock.push(lines[i]);
        i++;
      }
      const docxTable = buildDocxTable(tableBlock);
      if (docxTable) {
        children.push(docxTable);
        children.push(new Paragraph({ spacing: { after: 160 } }));
      }
      continue;
    }

    // Horizontal Rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(rawLine)) {
      children.push(new Paragraph({ spacing: { after: 160 } }));
      i++;
      continue;
    }

    // Heading 1
    if (rawLine.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: rawLine.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
    }
    // Heading 2
    else if (rawLine.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: rawLine.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
    }
    // Heading 3 / Heading 4
    else if (rawLine.startsWith('### ') || rawLine.startsWith('#### ')) {
      children.push(
        new Paragraph({
          text: rawLine.replace(/^#{3,4}\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
        })
      );
    }
    // Blockquote
    else if (rawLine.startsWith('> ')) {
      children.push(
        new Paragraph({
          children: parseInlineRuns(rawLine.replace(/^>\s+/, ''), { color: '55524D' }),
          indent: { left: 360 },
          spacing: { after: 120 },
        })
      );
    }
    // Numbered item: e.g. "1. " or "2. "
    else if (/^\d+\.\s+/.test(rawLine)) {
      const itemText = rawLine.replace(/^\d+\.\s+/, '');
      children.push(
        new Paragraph({
          children: parseInlineRuns(itemText),
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    }
    // Bullet item: "- " or "* "
    else if (rawLine.startsWith('- ') || rawLine.startsWith('* ')) {
      const bulletText = rawLine.replace(/^[-*]\s+/, '');
      children.push(
        new Paragraph({
          children: parseInlineRuns(bulletText),
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    }
    // Regular paragraph
    else {
      children.push(
        new Paragraph({
          children: parseInlineRuns(rawLine),
          spacing: { after: 140 },
        })
      );
    }

    i++;
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

