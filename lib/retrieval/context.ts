import { RetrievedChunk } from './search';
import { Citation } from '@/lib/types';

export function buildContextAndCitations(
  chunks: RetrievedChunk[],
  sourcesMap: Map<string, { fileName: string }>
): {
  contextText: string;
  citationsList: Citation[];
} {
  const citationsList: Citation[] = [];
  const blocks: string[] = [];

  const docNames = Array.from(sourcesMap.values())
    .map((s) => s.fileName)
    .join(', ');

  const header = `Dokumen Aktif dalam Notebook: ${docNames || 'Tidak ada'}\n\n`;

  chunks.forEach((chunk, index) => {
    const marker = `S${index + 1}`;
    const sourceInfo = sourcesMap.get(chunk.source_id);
    const sourceName = sourceInfo?.fileName || 'Dokumen';

    citationsList.push({
      marker,
      chunkId: chunk.id,
      sourceId: chunk.source_id,
      sourceName,
      page: chunk.page_number,
      sheet: chunk.sheet_name,
      snippet: chunk.content.slice(0, 150) + '...',
    });

    const pageAttr = chunk.page_number ? ` page="${chunk.page_number}"` : '';
    const sheetAttr = chunk.sheet_name ? ` sheet="${chunk.sheet_name}"` : '';

    blocks.push(
      `<${marker} source="${sourceName}"${pageAttr}${sheetAttr}>\n${chunk.content.trim()}\n</${marker}>`
    );
  });

  return {
    contextText: blocks.length > 0 ? `${header}${blocks.join('\n\n')}` : `${header}Belum ada potongan teks yang sesuai query.`,
    citationsList,
  };
}

