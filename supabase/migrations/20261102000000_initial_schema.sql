-- ============================================================
-- Nalar — Initial Database Schema
-- Extensions, Enums, Tables, RLS, Indexes, Triggers, RPC
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Types & Enums
CREATE TYPE source_status  AS ENUM ('queued', 'processing', 'ready', 'failed');
CREATE TYPE ingest_stage   AS ENUM ('pending', 'extract', 'chunk', 'embed', 'index', 'done');
CREATE TYPE job_status     AS ENUM ('queued', 'running', 'done', 'failed');
CREATE TYPE artifact_kind  AS ENUM ('summary', 'faq', 'study_guide', 'timeline', 'briefing');
CREATE TYPE provider_name  AS ENUM ('gemini', 'groq', 'local');

-- 3. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          text,
  locale                text NOT NULL DEFAULT 'id',
  daily_chat_limit      int NOT NULL DEFAULT 100,
  daily_artifact_limit  int NOT NULL DEFAULT 20,
  daily_upload_limit    int NOT NULL DEFAULT 50,
  daily_token_limit     int NOT NULL DEFAULT 300000,
  preferred_provider    provider_name,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- Trigger for auto-creating profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Notebooks
CREATE TABLE IF NOT EXISTS notebooks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notebooks_user_idx ON notebooks (user_id, updated_at DESC);

-- 5. Sources
CREATE TABLE IF NOT EXISTS sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id     uuid NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  file_name       text NOT NULL,
  mime_type       text NOT NULL,
  file_size       bigint NOT NULL,
  storage_path    text NOT NULL,
  file_hash       text NOT NULL,

  status          source_status NOT NULL DEFAULT 'queued',
  stage           ingest_stage  NOT NULL DEFAULT 'pending',
  progress        smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  error_code      text,
  error_message   text,
  low_confidence  boolean NOT NULL DEFAULT false,

  page_count      int,
  char_count      int,
  chunk_count     int NOT NULL DEFAULT 0,

  embedding_model text,
  enabled         boolean NOT NULL DEFAULT true,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (notebook_id, file_hash)
);

CREATE INDEX IF NOT EXISTS sources_notebook_idx ON sources (notebook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sources_user_idx     ON sources (user_id);

-- 6. Source Chunks
CREATE TABLE IF NOT EXISTS source_chunks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  notebook_id      uuid NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  chunk_index      int  NOT NULL,
  content          text NOT NULL,

  page_number      int,
  sheet_name       text,
  heading_path     text,
  char_start       int,
  char_end         int,

  embedding        vector(1536),
  embedding_local  vector(384),
  tsv              tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,

  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS source_chunks_embedding_idx
  ON source_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS source_chunks_tsv_idx ON source_chunks USING gin (tsv);
CREATE INDEX IF NOT EXISTS source_chunks_notebook_idx ON source_chunks (notebook_id);
CREATE INDEX IF NOT EXISTS source_chunks_source_idx   ON source_chunks (source_id, chunk_index);

-- 7. Chat Threads & Messages
CREATE TABLE IF NOT EXISTS chat_threads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id uuid NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'Percakapan baru',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id          uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  role               text NOT NULL CHECK (role IN ('user','assistant')),
  content            text NOT NULL,
  citations          jsonb NOT NULL DEFAULT '[]'::jsonb,

  provider           provider_name,
  model              text,
  input_tokens       int,
  output_tokens      int,
  latency_ms         int,
  finish_reason      text,
  citation_coverage  real,

  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON chat_messages (thread_id, created_at);

-- 8. Artifacts
CREATE TABLE IF NOT EXISTS artifacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id uuid NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  kind        artifact_kind NOT NULL,
  title       text NOT NULL,
  content_md  text NOT NULL,
  citations   jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_ids  uuid[] NOT NULL DEFAULT '{}',

  provider    provider_name,
  model       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artifacts_notebook_idx ON artifacts (notebook_id, created_at DESC);

-- 9. Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id   uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  stage       ingest_stage NOT NULL,
  status      job_status   NOT NULL DEFAULT 'queued',
  attempts    int NOT NULL DEFAULT 0,
  cursor      int NOT NULL DEFAULT 0,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  error       text,

  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status, created_at);

-- 10. Usage Events
CREATE TABLE IF NOT EXISTS usage_events (
  id            bigserial PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind          text NOT NULL,
  provider      provider_name,
  model         text,
  input_tokens  int NOT NULL DEFAULT 0,
  output_tokens int NOT NULL DEFAULT 0,
  latency_ms    int,
  outcome       text NOT NULL,
  error_code    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_user_day_idx ON usage_events (user_id, created_at DESC);

-- 11. AI Routes & Provider State
CREATE TABLE IF NOT EXISTS ai_routes (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task     text NOT NULL CHECK (task IN ('chat','embed','vision')),
  position int  NOT NULL,
  provider provider_name NOT NULL,
  model    text NOT NULL,
  enabled  boolean NOT NULL DEFAULT true,
  UNIQUE (task, position)
);

CREATE TABLE IF NOT EXISTS ai_provider_state (
  provider      provider_name NOT NULL,
  model         text NOT NULL,
  state         text NOT NULL DEFAULT 'closed' CHECK (state IN ('closed','open','half_open')),
  failures      int NOT NULL DEFAULT 0,
  opened_at     timestamptz,
  open_ms       int NOT NULL DEFAULT 60000,
  last_error    text,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, model)
);

-- Seed ai_routes
INSERT INTO ai_routes (task, position, provider, model) VALUES
  ('chat',   1, 'gemini', 'gemini-2.5-flash'),
  ('chat',   2, 'groq',   'llama-3.3-70b-versatile'),
  ('chat',   3, 'groq',   'gpt-oss-120b'),
  ('chat',   4, 'groq',   'llama-3.1-8b-instant'),
  ('embed',  1, 'gemini', 'gemini-embedding-001'),
  ('embed',  2, 'local',  'Xenova/bge-small-en-v1.5'),
  ('vision', 1, 'gemini', 'gemini-2.5-flash'),
  ('vision', 2, 'groq',   'meta-llama/llama-4-scout-17b-16e-instruct'),
  ('vision', 3, 'local',  'tesseract')
ON CONFLICT (task, position) DO NOTHING;

-- 12. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "own profile" ON profiles;
CREATE POLICY "own profile" ON profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "own notebooks" ON notebooks;
CREATE POLICY "own notebooks" ON notebooks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own sources" ON sources;
CREATE POLICY "own sources" ON sources
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own chunks" ON source_chunks;
CREATE POLICY "own chunks" ON source_chunks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own threads" ON chat_threads;
CREATE POLICY "own threads" ON chat_threads
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own messages" ON chat_messages;
CREATE POLICY "own messages" ON chat_messages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own artifacts" ON artifacts;
CREATE POLICY "own artifacts" ON artifacts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own jobs" ON jobs;
CREATE POLICY "own jobs" ON jobs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own usage" ON usage_events;
CREATE POLICY "own usage" ON usage_events
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "read routes" ON ai_routes;
CREATE POLICY "read routes" ON ai_routes FOR SELECT USING (true);

DROP POLICY IF EXISTS "read breaker" ON ai_provider_state;
CREATE POLICY "read breaker" ON ai_provider_state FOR SELECT USING (true);

-- 13. Helper Functions & Triggers
CREATE OR REPLACE FUNCTION clear_source_chunks(p_source uuid)
RETURNS void LANGUAGE sql AS $$
  DELETE FROM source_chunks WHERE source_id = p_source;
$$;

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notebooks_touch ON notebooks;
CREATE TRIGGER notebooks_touch BEFORE UPDATE ON notebooks
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS sources_touch ON sources;
CREATE TRIGGER sources_touch BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RPC function for Hybrid Search (pgvector + tsvector with Reciprocal Rank Fusion)
CREATE OR REPLACE FUNCTION hybrid_search_chunks(
  query_embedding vector(1536),
  query_text text,
  target_notebook_id uuid,
  enabled_source_ids uuid[],
  vector_k int DEFAULT 30,
  fts_k int DEFAULT 30,
  final_k int DEFAULT 12,
  rrf_k int DEFAULT 60
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  content text,
  page_number int,
  sheet_name text,
  heading_path text,
  char_start int,
  char_end int,
  rrf_score float8
)
LANGUAGE sql
STABLE
AS $$
WITH vec AS (
  SELECT
    sc.id,
    1 - (sc.embedding <=> query_embedding) AS score,
    ROW_NUMBER() OVER (ORDER BY sc.embedding <=> query_embedding) AS rnk
  FROM source_chunks sc
  WHERE sc.notebook_id = target_notebook_id
    AND sc.source_id = ANY(enabled_source_ids)
    AND sc.embedding IS NOT NULL
  ORDER BY sc.embedding <=> query_embedding
  LIMIT vector_k
),
fts AS (
  SELECT
    sc.id,
    ts_rank_cd(sc.tsv, websearch_to_tsquery('simple', query_text)) AS score,
    ROW_NUMBER() OVER (ORDER BY ts_rank_cd(sc.tsv, websearch_to_tsquery('simple', query_text)) DESC) AS rnk
  FROM source_chunks sc
  WHERE sc.notebook_id = target_notebook_id
    AND sc.source_id = ANY(enabled_source_ids)
    AND sc.tsv @@ websearch_to_tsquery('simple', query_text)
  LIMIT fts_k
),
fused AS (
  SELECT
    COALESCE(v.id, f.id) AS id,
    COALESCE(1.0 / (rrf_k + v.rnk), 0.0) + COALESCE(1.0 / (rrf_k + f.rnk), 0.0) AS rrf
  FROM vec v
  FULL OUTER JOIN fts f ON v.id = f.id
  ORDER BY rrf DESC
  LIMIT final_k
)
SELECT
  sc.id,
  sc.source_id,
  sc.content,
  sc.page_number,
  sc.sheet_name,
  sc.heading_path,
  sc.char_start,
  sc.char_end,
  fused.rrf::float8 AS rrf_score
FROM fused
JOIN source_chunks sc ON sc.id = fused.id
ORDER BY fused.rrf DESC;
$$;
