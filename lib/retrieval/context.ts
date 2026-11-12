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

  const docEntries = Array.from(sourcesMap.values());
  const docList = docEntries.map((s, idx) => `${idx + 1}. ${s.fileName}`).join('\n');

  const header = `=== DAFTAR SELURUH DOKUMEN SUMBER AKTIF (Total: ${docEntries.length} Dokumen) ===\nDokumen yang tersedia dalam notebook ini:\n${docList || 'Tidak ada dokumen aktif'}\n\n=== KUTIPAN KONTEN DOKUMEN SUMBER TERKAIT (Total: ${chunks.length} Bagian) ===\n\n`;

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

