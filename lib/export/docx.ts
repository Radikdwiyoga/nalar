import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

export async function markdownToDocxBlob(title: string, markdown: string): Promise<Blob> {
  const paragraphs: Paragraph[] = [];

  // Document Title
  paragraphs.push(
    new Paragraph({
      text: title,
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

  const lines = markdown.split('\n');

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
    // Bullet item
    else if (rawLine.startsWith('- ') || rawLine.startsWith('* ')) {
      const bulletText = rawLine.replace(/^[-*]\s+/, '');
      paragraphs.push(
        new Paragraph({
          text: bulletText.replace(/\*\*(.*?)\*\*/g, '$1'),
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    }
    // Regular paragraph
    else {
      paragraphs.push(
        new Paragraph({
          text: rawLine.replace(/\*\*(.*?)\*\*/g, '$1'),
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

