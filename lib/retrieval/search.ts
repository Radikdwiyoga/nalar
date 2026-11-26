import { createAdminClient } from '@/lib/supabase/admin';

export interface RetrievedChunk {
  id: string;
  source_id: string;
  source_name?: string;
  content: string;
  page_number: number | null;
  sheet_name: string | null;
  heading_path: string | null;
  char_start: number | null;
  char_end: number | null;
  rrf_score: number;
}

const STOPWORDS = new Set([
  'apa', 'apakah', 'siapa', 'dimana', 'kapan', 'mengapa', 'kenapa', 'bagaimana', 'berapa',
  'jelaskan', 'sebutkan', 'berikan', 'buatkan', 'tolong', 'ada', 'tidak', 'bukan', 'adalah',
  'yaitu', 'pada', 'yang', 'untuk', 'dengan', 'dari', 'ke', 'di', 'ini', 'itu', 'tersebut',
  'tentang', 'mengenai', 'dalam', 'atas', 'oleh', 'secara', 'harus', 'dapat', 'bisa', 'akan',
  'telah', 'sudah', 'seperti', 'dan', 'atau', 'serta', 'juga', 'hal', 'semua', 'seluruh',
  'what', 'how', 'when', 'where', 'why', 'who', 'which', 'is', 'are', 'was', 'were', 'the',
  'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
]);

/**
 * Extracts exact entity identifiers (alphanumeric codes, contract IDs, numbers, monetary values)
 * and substantive keywords from the query.
 */
export function extractKeywordsAndEntities(query: string): {
  exactEntities: string[];
  keywords: string[];
} {
  // 1. Exact alphanumeric codes, contract numbers, and IDs (e.g. 4300005149, SPK_4300005149, TOR-2024, Rp15,7)
  const entityMatches = query.match(/\b([A-Za-z0-9_\-\/]{4,}|[0-9]{3,}|\bRp\s?[\d\.,]+)\b/g) || [];
  const exactEntities = Array.from(
    new Set(
      entityMatches
        .map((e) => e.trim())
        .filter((e) => e.length > 2 && !STOPWORDS.has(e.toLowerCase()))
    )
  );

  // 2. Substantive keywords (words with length > 2 that are not stopwords or standalone short numbers)
  const cleaned = query.replace(/[^\w\s\-]/g, ' ');
  const words = cleaned.split(/\s+/).filter((w) => {
    const lower = w.toLowerCase().trim();
    return lower.length > 2 && !STOPWORDS.has(lower) && !/^\d+$/.test(lower);
  });
  const keywords = Array.from(new Set(words));

  return { exactEntities, keywords };
}

/**
 * Detects if a query is asking for broad synthesis, summary of all documents,
 * comparison, or overview across the notebook.
 */
export function isBroadOrMultiDocumentQuery(query: string): boolean {
  const normalized = query.toLowerCase();
  const broadPatterns = [
    /\b(semua|seluruh|keseluruhan|semuanya|seluruhnya)\b/,
    /\b(rangkum|ringkas|ringkasan|rangkuman|ikhtisar)\b/,
    /\b(apa saja|daftar|list|koleksi|tiap|masing-masing|setiap)\b/,
    /\b(bandingkan|perbandingan|komparasi|perbedaan|persamaan)\b/,
    /\b(laporan|overview|sintesis|kesimpulan)\b/,
    /\b(dokumen apa|ada apa saja|isi dokumen|dokumen ini|dokumen yang diunggah)\b/,
    /\b(all|every|summarize|summary|overview|compare|list|entire|each)\b/,
  ];
  return broadPatterns.some((pattern) => pattern.test(normalized));
}

export async function hybridSearch({
  notebookId,
  queryText,
  queryEmbedding,
  enabledSourceIds,
  limit = 48,
}: {
  notebookId: string;
  queryText: string;
  queryEmbedding?: number[] | null;
  enabledSourceIds: string[];
  limit?: number;
}): Promise<RetrievedChunk[]> {
  const admin = createAdminClient();

  if (enabledSourceIds.length === 0) {
    return [];
  }

  // Adjust total limit adaptively based on number of active documents
  const targetLimit = Math.min(64, Math.max(limit, enabledSourceIds.length * 3));
  const isBroad = isBroadOrMultiDocumentQuery(queryText);
  const { exactEntities, keywords } = extractKeywordsAndEntities(queryText);

  try {
    // 1. Multi-Source Coverage Guarantee:
    // When multiple documents are active, fetch introductory / summary chunks (chunk_index 0, 1)
    // for EVERY active document so no document is left unrepresented.
    let perSourceChunks: any[] = [];
    if (enabledSourceIds.length > 1) {
      const chunksPerDoc = isBroad ? [0, 1, 2] : [0, 1];
      const { data: baselineData } = await admin
        .from('source_chunks')
        .select('id, source_id, content, page_number, sheet_name, heading_path, char_start, char_end, chunk_index')
        .eq('notebook_id', notebookId)
        .in('source_id', enabledSourceIds)
        .in('chunk_index', chunksPerDoc)
        .order('source_id')
        .order('chunk_index', { ascending: true });

      if (baselineData && baselineData.length > 0) {
        perSourceChunks = baselineData;
      }
    }

    // 2. Semantic Vector Search
    let vectorChunks: RetrievedChunk[] = [];
    if (queryEmbedding && queryEmbedding.length > 0) {
      const { data: rpcData, error: rpcError } = await admin.rpc('hybrid_search_chunks', {
        query_embedding: queryEmbedding,
        query_text: queryText,
        target_notebook_id: notebookId,
        enabled_source_ids: enabledSourceIds,
        vector_k: Math.max(60, enabledSourceIds.length * 4),
        fts_k: Math.max(60, enabledSourceIds.length * 4),
        final_k: targetLimit,
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        vectorChunks = rpcData as RetrievedChunk[];
      }
    }

    // 3. Explicit Entity & Keyword Exact Search (BM25 & String Matching)
    // Runs in parallel with vector search to guarantee exact codes, numbers, and clauses are never missed.
    let exactEntityChunks: any[] = [];
    if (exactEntities.length > 0) {
      // Search chunks that contain any of the exact alphanumeric codes (escape ILIKE wildcards)
      for (const entity of exactEntities.slice(0, 4)) {
        const escapedEntity = entity.replace(/[\\%_]/g, (m) => `\\${m}`);
        const { data: entityData } = await admin
          .from('source_chunks')
          .select('id, source_id, content, page_number, sheet_name, heading_path, char_start, char_end')
          .eq('notebook_id', notebookId)
          .in('source_id', enabledSourceIds)
          .ilike('content', `%${escapedEntity}%`)
          .limit(10);

        if (entityData && entityData.length > 0) {
          exactEntityChunks.push(...entityData);
        }
      }
    }

    let keywordFtsChunks: any[] = [];
    if (keywords.length > 0) {
      const orQuery = keywords.slice(0, 6).join(' | ');
      const { data: ftsData } = await admin
        .from('source_chunks')
        .select('id, source_id, content, page_number, sheet_name, heading_path, char_start, char_end')
        .eq('notebook_id', notebookId)
        .in('source_id', enabledSourceIds)
        .textSearch('tsv', orQuery, { config: 'simple' })
        .limit(20);

      if (ftsData && ftsData.length > 0) {
        keywordFtsChunks = ftsData;
      }
    }

    // 4. Reciprocal Rank Fusion (RRF) between Vector, Exact Entities, and Keywords
    const scoreMap = new Map<string, { chunk: RetrievedChunk; score: number }>();
    const RRF_K = 60;

    // 4a. Add Exact Entity Chunks (High Priority Grounding)
    exactEntityChunks.forEach((c, idx) => {
      const existing = scoreMap.get(c.id);
      const boost = 1.0 + (1.0 / (RRF_K + idx));
      if (existing) {
        existing.score += boost;
      } else {
        scoreMap.set(c.id, { chunk: { ...c, rrf_score: boost }, score: boost });
      }
    });

    // 4b. Add Vector Chunks
    vectorChunks.forEach((c, idx) => {
      const rrf = 1.0 / (RRF_K + idx);
      const existing = scoreMap.get(c.id);
      if (existing) {
        existing.score += rrf;
        existing.chunk.rrf_score = existing.score;
      } else {
        scoreMap.set(c.id, { chunk: { ...c, rrf_score: rrf }, score: rrf });
      }
    });

    // 4c. Add Keyword FTS Chunks
    keywordFtsChunks.forEach((c, idx) => {
      const rrf = 1.0 / (RRF_K + idx);
      const existing = scoreMap.get(c.id);
      if (existing) {
        existing.score += rrf;
        existing.chunk.rrf_score = existing.score;
      } else {
        scoreMap.set(c.id, { chunk: { ...c, rrf_score: rrf }, score: rrf });
      }
    });

    // 5. Smart Merge & Multi-Source Balancing
    const mergedMap = new Map<string, RetrievedChunk>();

    if (isBroad) {
      // Broad synthesis: guarantee all documents have initial chunks first
      for (const p of perSourceChunks) {
        mergedMap.set(p.id, { ...p, rrf_score: 1.0 });
      }
    }

    // Sort fused candidates by score descending
    const sortedFused = Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .map((item) => item.chunk);

    for (const c of sortedFused) {
      if (!mergedMap.has(c.id)) {
        mergedMap.set(c.id, c);
      }
    }

    // For specific queries: ensure active sources have at least chunk 0 represented if space remains
    if (!isBroad) {
      const coveredSources = new Set(Array.from(mergedMap.values()).map((s) => s.source_id));
      for (const p of perSourceChunks) {
        if (!coveredSources.has(p.source_id) && !mergedMap.has(p.id)) {
          mergedMap.set(p.id, { ...p, rrf_score: 0.05 });
          coveredSources.add(p.source_id);
        }
      }
    }

    let finalChunks = Array.from(mergedMap.values());

    // If still empty (e.g. no matches at all), fallback to introductory chunks
    if (finalChunks.length === 0) {
      const { data: introChunks } = await admin
        .from('source_chunks')
        .select('id, source_id, content, page_number, sheet_name, heading_path, char_start, char_end')
        .eq('notebook_id', notebookId)
        .in('source_id', enabledSourceIds)
        .order('chunk_index', { ascending: true })
        .limit(targetLimit);

      finalChunks = (introChunks || []).map((d: any, idx: number) => ({
        ...d,
        rrf_score: 1 / (100 + idx),
      }));
    }

    return finalChunks.slice(0, targetLimit);
  } catch (err) {
    console.error('Retrieval error:', err);
    return [];
  }
}

