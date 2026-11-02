export type SourceStatus = 'queued' | 'processing' | 'ready' | 'failed';
export type IngestStage = 'pending' | 'extract' | 'chunk' | 'embed' | 'index' | 'done';
export type JobStatus = 'queued' | 'running' | 'done' | 'failed';
export type ArtifactKind = 'summary' | 'faq' | 'study_guide' | 'timeline' | 'briefing';
export type ProviderName = 'gemini' | 'groq' | 'local';

export interface Profile {
  id: string;
  display_name: string | null;
  locale: string;
  daily_chat_limit: number;
  daily_artifact_limit: number;
  daily_upload_limit: number;
  daily_token_limit: number;
  preferred_provider: ProviderName | null;
  created_at: string;
}

export interface Notebook {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  sources_count?: number;
}

export interface Source {
  id: string;
  notebook_id: string;
  user_id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  file_hash: string;
  status: SourceStatus;
  stage: IngestStage;
  progress: number;
  error_code: string | null;
  error_message: string | null;
  low_confidence: boolean;
  page_count: number | null;
  char_count: number | null;
  chunk_count: number;
  embedding_model: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SourceChunk {
  id: string;
  source_id: string;
  notebook_id: string;
  user_id: string;
  chunk_index: number;
  content: string;
  page_number: number | null;
  sheet_name: string | null;
  heading_path: string | null;
  char_start: number | null;
  char_end: number | null;
  embedding?: number[] | null;
  embedding_local?: number[] | null;
  created_at: string;
}

export interface Citation {
  marker: string; // e.g. "S1", "S2"
  chunkId: string;
  sourceId: string;
  sourceName?: string;
  page?: number | null;
  sheet?: string | null;
  snippet?: string;
}

export interface ChatThread {
  id: string;
  notebook_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  provider?: ProviderName | null;
  model?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  latency_ms?: number | null;
  finish_reason?: string | null;
  citation_coverage?: number | null;
  created_at: string;
}

export interface Artifact {
  id: string;
  notebook_id: string;
  user_id: string;
  kind: ArtifactKind;
  title: string;
  content_md: string;
  citations: Citation[];
  source_ids: string[];
  provider?: ProviderName | null;
  model?: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  source_id: string;
  user_id: string;
  stage: IngestStage;
  status: JobStatus;
  attempts: number;
  cursor: number;
  payload: Record<string, unknown>;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface DailyUsage {
  chats: number;
  artifacts: number;
  uploads: number;
  tokens: number;
}

