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
    // If we have an embedding, call the RPC function hybrid_search_chunks
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

    // Fallback: Full-text search directly if embedding failed or returned empty
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

    // Last resort fallback: simple ILIKE search
    const { data: fallbackData } = await admin
      .from('source_chunks')
      .select('id, source_id, content, page_number, sheet_name, heading_path, char_start, char_end')
      .eq('notebook_id', notebookId)
      .in('source_id', enabledSourceIds)
      .ilike('content', `%${queryText.slice(0, 50)}%`)
      .limit(limit);

    return (fallbackData || []).map((d: any, idx: number) => ({
      ...d,
      rrf_score: 1 / (60 + idx),
    }));
  } catch (err) {
    console.error('Retrieval error:', err);
    return [];
  }
}
