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

    // 2. Semantic & Keyword Hybrid Search
    let semanticChunks: RetrievedChunk[] = [];

    // 2a. Vector Hybrid Search (pgvector + tsvector via RPC)
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
        semanticChunks = rpcData as RetrievedChunk[];
      }
    }

    // 2b. Full-text search fallback if RPC yielded nothing
    if (semanticChunks.length === 0) {
      const { data: ftsData } = await admin
        .from('source_chunks')
        .select('id, source_id, content, page_number, sheet_name, heading_path, char_start, char_end')
        .eq('notebook_id', notebookId)
        .in('source_id', enabledSourceIds)
        .textSearch('tsv', queryText, { type: 'websearch', config: 'simple' })
        .limit(targetLimit);

      if (ftsData && ftsData.length > 0) {
        semanticChunks = ftsData.map((d: any, idx: number) => ({
          ...d,
          rrf_score: 1 / (60 + idx),
        }));
      }
    }

    // 2c. Keyword search fallback if still empty
    if (semanticChunks.length === 0) {
      const keywords = queryText
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(
          (w) =>
            w.length > 2 &&
            !['yang', 'dari', 'untuk', 'pada', 'apa', 'ini', 'itu', 'adalah', 'seperti', 'buatkan', 'tolong'].includes(
              w.toLowerCase()
            )
        );

      if (keywords.length > 0) {
        const orQuery = keywords.slice(0, 5).join(' | ');
        const { data: kwData } = await admin
          .from('source_chunks')
          .select('id, source_id, content, page_number, sheet_name, heading_path, char_start, char_end')
          .eq('notebook_id', notebookId)
          .in('source_id', enabledSourceIds)
          .textSearch('tsv', orQuery, { config: 'simple' })
          .limit(targetLimit);

        if (kwData && kwData.length > 0) {
          semanticChunks = kwData.map((d: any, idx: number) => ({
            ...d,
            rrf_score: 1 / (80 + idx),
          }));
        }
      }
    }

    // 3. Smart Merge & Balance Chunks
    const mergedMap = new Map<string, RetrievedChunk>();

    if (isBroad) {
      // For broad multi-document questions:
      // Guarantee all documents' introductory & scope chunks first
      for (const p of perSourceChunks) {
        mergedMap.set(p.id, { ...p, rrf_score: 1.0 });
      }
      // Then fill with additional top semantic chunks
      for (const s of semanticChunks) {
        if (!mergedMap.has(s.id)) {
          mergedMap.set(s.id, s);
        }
      }
    } else {
      // For specific queries:
      // Put highest-scoring semantic chunks first
      for (const s of semanticChunks) {
        mergedMap.set(s.id, s);
      }
      // Ensure all enabled sources have at least chunk 0 included if space allows
      const coveredSources = new Set(semanticChunks.map((s) => s.source_id));
      for (const p of perSourceChunks) {
        if (!coveredSources.has(p.source_id) && !mergedMap.has(p.id)) {
          mergedMap.set(p.id, { ...p, rrf_score: 0.1 });
          coveredSources.add(p.source_id);
        }
      }
    }

    let finalChunks = Array.from(mergedMap.values());

    // If still empty (e.g. initial greeting or empty query), fallback to introductory chunks
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

    // Truncate to targetLimit
    return finalChunks.slice(0, targetLimit);
  } catch (err) {
    console.error('Retrieval error:', err);
    return [];
  }
}

