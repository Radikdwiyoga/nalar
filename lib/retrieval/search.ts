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

export async function hybridSearch({
  notebookId,
  queryText,
  queryEmbedding,
  enabledSourceIds,
  limit = 12,
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

  try {
    // 1. Vector Hybrid Search (pgvector + tsvector via RPC)
    if (queryEmbedding && queryEmbedding.length > 0) {
      const { data, error } = await admin.rpc('hybrid_search_chunks', {
        query_embedding: queryEmbedding,
        query_text: queryText,
        target_notebook_id: notebookId,
        enabled_source_ids: enabledSourceIds,
        final_k: limit,
      });

      if (!error && data && data.length > 0) {
        return data as RetrievedChunk[];
      }
    }

    // 2. Full-text search fallback (websearch format)
    const { data: ftsData, error: ftsError } = await admin
      .from('source_chunks')
      .select('id, source_id, content, page_number, sheet_name, heading_path, char_start, char_end')
      .eq('notebook_id', notebookId)
      .in('source_id', enabledSourceIds)
      .textSearch('tsv', queryText, { type: 'websearch', config: 'simple' })
      .limit(limit);

    if (!ftsError && ftsData && ftsData.length > 0) {
      return ftsData.map((d: any, idx: number) => ({
        ...d,
        rrf_score: 1 / (60 + idx),
      }));
    }

    // 3. Keyword-level search (strip punctuation & conversational words, join with OR)
    const keywords = queryText
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['yang', 'dari', 'untuk', 'pada', 'apa', 'ini', 'itu', 'adalah', 'seperti', 'buatkan', 'tolong'].includes(w.toLowerCase()));

    if (keywords.length > 0) {
      const orQuery = keywords.slice(0, 5).join(' | ');
      const { data: kwData } = await admin
        .from('source_chunks')
        .select('id, source_id, content, page_number, sheet_name, heading_path, char_start, char_end')
        .eq('notebook_id', notebookId)
        .in('source_id', enabledSourceIds)
        .textSearch('tsv', orQuery, { config: 'simple' })
        .limit(limit);

      if (kwData && kwData.length > 0) {
        return kwData.map((d: any, idx: number) => ({
          ...d,
          rrf_score: 1 / (80 + idx),
        }));
      }
    }

    // 4. Default overview / introductory chunks fallback
    // When the query is an overview/summary request or broad greeting, supply the document's introductory chunks
    const { data: introChunks } = await admin
      .from('source_chunks')
      .select('id, source_id, content, page_number, sheet_name, heading_path, char_start, char_end')
      .eq('notebook_id', notebookId)
      .in('source_id', enabledSourceIds)
      .order('chunk_index', { ascending: true })
      .limit(limit);

    return (introChunks || []).map((d: any, idx: number) => ({
      ...d,
      rrf_score: 1 / (100 + idx),
    }));
  } catch (err) {
    console.error('Retrieval error:', err);
    return [];
  }
}

