import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

function parseInlineRuns(text: string): TextRun[] {
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
        })
      );
    } else if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      runs.push(
        new TextRun({
          text: token.slice(1, -1),
          italics: true,
        })
      );
    } else {
      runs.push(new TextRun({ text: token }));
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text })];
}

export async function markdownToDocxBlob(title: string, markdown: string): Promise<Blob> {
  const paragraphs: Paragraph[] = [];

  // Extract main title if first line is '# ...'
  let docTitle = title;
  const lines = markdown.split('\n');
  if (lines.length > 0 && lines[0].startsWith('# ')) {
    docTitle = lines[0].replace(/^#\s+/, '').trim();
    lines.shift();
  }

  // Document Title
  paragraphs.push(
    new Paragraph({
      text: docTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  );

  // Subtitle / attribution
  paragraphs.push(
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

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) {
      paragraphs.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }

    // Heading 1
    if (rawLine.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: rawLine.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
    }
    // Heading 2
    else if (rawLine.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: rawLine.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
    }
    // Heading 3
    else if (rawLine.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: rawLine.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
        })
      );
    }
    // Numbered item: e.g. "1. " or "2. "
    else if (/^\d+\.\s+/.test(rawLine)) {
      const itemText = rawLine.replace(/^\d+\.\s+/, '');
      paragraphs.push(
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
      paragraphs.push(
        new Paragraph({
          children: parseInlineRuns(bulletText),
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    }
    // Regular paragraph
    else {
      paragraphs.push(
        new Paragraph({
          children: parseInlineRuns(rawLine),
          spacing: { after: 140 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

