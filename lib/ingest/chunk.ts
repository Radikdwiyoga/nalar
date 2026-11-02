export interface ChunkInputItem {
  text: string;
  pageNumber?: number | null;
  sheetName?: string | null;
  headingPath?: string | null;
}

export interface GeneratedChunk {
  chunkIndex: number;
  content: string;
  pageNumber: number | null;
  sheetName: string | null;
  headingPath: string | null;
  charStart: number;
  charEnd: number;
}

// 600 tokens ~ 2400 chars, 80 tokens overlap ~ 320 chars
const TARGET_CHUNK_CHARS = 2400;
const OVERLAP_CHARS = 320;

export function createChunks(items: ChunkInputItem[]): GeneratedChunk[] {
  const chunks: GeneratedChunk[] = [];
  let globalIndex = 0;

  for (const item of items) {
    const text = item.text.trim();
    if (!text) continue;

    if (text.length <= TARGET_CHUNK_CHARS) {
      chunks.push({
        chunkIndex: globalIndex++,
        content: text,
        pageNumber: item.pageNumber ?? null,
        sheetName: item.sheetName ?? null,
        headingPath: item.headingPath ?? null,
        charStart: 0,
        charEnd: text.length,
      });
      continue;
    }

    // Sliding window
    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + TARGET_CHUNK_CHARS, text.length);

      // Try to break at a newline or period if possible
      if (end < text.length) {
        const lastNewline = text.lastIndexOf('\n', end);
        const lastPeriod = text.lastIndexOf('. ', end);
        const boundary = Math.max(lastNewline, lastPeriod);
        if (boundary > start + TARGET_CHUNK_CHARS * 0.5) {
          end = boundary + 1;
        }
      }

      const slice = text.slice(start, end).trim();
      if (slice) {
        chunks.push({
          chunkIndex: globalIndex++,
          content: slice,
          pageNumber: item.pageNumber ?? null,
          sheetName: item.sheetName ?? null,
          headingPath: item.headingPath ?? null,
          charStart: start,
          charEnd: end,
        });
      }

      if (end >= text.length) break;
      start = Math.max(start + 1, end - OVERLAP_CHARS);
    }
  }

  return chunks;
}

