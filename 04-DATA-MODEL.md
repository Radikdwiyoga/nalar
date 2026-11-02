# Model Data — Nalar

Skema untuk Supabase Postgres. Semua tabel memakai RLS. Migrasi disimpan di
`supabase/migrations/` dan dijalankan berurutan.

---

## 1. Diagram relasi

```
auth.users (Supabase)
    │ 1:1
    ▼
profiles
    │
    ├──< notebooks ──< sources ──< source_chunks
    │         │                        │
    │         ├──< chat_threads ──< chat_messages
    │         └──< artifacts
    │
    ├──< jobs
    └──< usage_events

ai_routes          (global, tanpa RLS per user)
ai_provider_state  (global)
```

---

## 2. Extension & tipe

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE source_status  AS ENUM ('queued','processing','ready','failed');
CREATE TYPE ingest_stage   AS ENUM ('pending','extract','chunk','embed','index','done');
CREATE TYPE job_status     AS ENUM ('queued','running','done','failed');
CREATE TYPE artifact_kind  AS ENUM ('summary','faq','study_guide','timeline','briefing');
CREATE TYPE provider_name  AS ENUM ('gemini','groq','local');
```

---

## 3. Tabel

### 3.1 profiles

```sql
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text,
  locale        text NOT NULL DEFAULT 'id',
  -- kuota (bisa di-override per user)
  daily_chat_limit      int NOT NULL DEFAULT 100,
  daily_artifact_limit  int NOT NULL DEFAULT 20,
  daily_upload_limit    int NOT NULL DEFAULT 50,
  daily_token_limit     int NOT NULL DEFAULT 300000,
  -- preferensi
  preferred_provider    provider_name,          -- NULL = pakai urutan default
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Buat profil otomatis saat user mendaftar
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 3.2 notebooks

```sql
CREATE TABLE notebooks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notebooks_user_idx ON notebooks (user_id, updated_at DESC);
```

### 3.3 sources

```sql
CREATE TABLE sources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id   uuid NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  file_name     text NOT NULL,
  mime_type     text NOT NULL,
  file_size     bigint NOT NULL,
  storage_path  text NOT NULL,
  file_hash     text NOT NULL,              -- sha256, cegah duplikat

  status        source_status NOT NULL DEFAULT 'queued',
  stage         ingest_stage  NOT NULL DEFAULT 'pending',
  progress      smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  error_code    text,
  error_message text,
  low_confidence boolean NOT NULL DEFAULT false,

  page_count    int,
  char_count    int,
  chunk_count   int NOT NULL DEFAULT 0,

  embedding_model text,                     -- 'gemini-embedding-001' | 'bge-small' | NULL
  enabled       boolean NOT NULL DEFAULT true,   -- toggle ikut retrieval atau tidak

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (notebook_id, file_hash)
);

CREATE INDEX sources_notebook_idx ON sources (notebook_id, created_at DESC);
CREATE INDEX sources_user_idx     ON sources (user_id);
```

### 3.4 source_chunks

Tabel terbesar. Perkiraan ukuran: ~1,5 KB teks + 6 KB vektor per baris.

```sql
CREATE TABLE source_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id   uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  notebook_id uuid NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  chunk_index int  NOT NULL,
  content     text NOT NULL,

  page_number  int,
  sheet_name   text,
  heading_path text,
  char_start   int,
  char_end     int,

  embedding        vector(1536),
  embedding_local  vector(384),
  tsv              tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,

  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Vector index (HNSW, cosine). Bangun setelah data awal masuk untuk hasil terbaik.
CREATE INDEX source_chunks_embedding_idx
  ON source_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX source_chunks_tsv_idx ON source_chunks USING gin (tsv);
CREATE INDEX source_chunks_notebook_idx ON source_chunks (notebook_id);
CREATE INDEX source_chunks_source_idx   ON source_chunks (source_id, chunk_index);
```

Catatan:
- Kolom `tsv` memakai konfigurasi `'simple'` karena dokumen campuran ID/EN.
  Jika nanti fokus bahasa Indonesia, pertimbangkan stemming manual atau `pg_trgm`.
- `user_id` sengaja diduplikasi (denormalisasi) agar policy RLS sederhana dan
  cepat, tanpa join ke `notebooks`.

### 3.5 chat_threads & chat_messages

```sql
CREATE TABLE chat_threads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id uuid NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'Percakapan baru',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id     uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  role          text NOT NULL CHECK (role IN ('user','assistant')),
  content       text NOT NULL,
  citations     jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- [{ "marker":"S1","chunkId":"...","sourceId":"...","page":12 }]

  provider      provider_name,
  model         text,
  input_tokens  int,
  output_tokens int,
  latency_ms    int,
  finish_reason text,          -- 'stop' | 'interrupted' | 'error'
  citation_coverage real,

  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_thread_idx ON chat_messages (thread_id, created_at);
```

### 3.6 artifacts

```sql
CREATE TABLE artifacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id uuid NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  kind        artifact_kind NOT NULL,
  title       text NOT NULL,
  content_md  text NOT NULL,
  citations   jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_ids  uuid[] NOT NULL DEFAULT '{}',   -- source yang dipakai

  provider    provider_name,
  model       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX artifacts_notebook_idx ON artifacts (notebook_id, created_at DESC);
```

### 3.7 jobs

```sql
CREATE TABLE jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id   uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  stage       ingest_stage NOT NULL,
  status      job_status   NOT NULL DEFAULT 'queued',
  attempts    int NOT NULL DEFAULT 0,
  cursor      int NOT NULL DEFAULT 0,      -- checkpoint: halaman/chunk terakhir
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  error       text,

  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX jobs_status_idx ON jobs (status, created_at);
```

### 3.8 usage_events

```sql
CREATE TABLE usage_events (
  id            bigserial PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind          text NOT NULL,             -- 'chat' | 'artifact' | 'upload' | 'embed'
  provider      provider_name,
  model         text,
  input_tokens  int NOT NULL DEFAULT 0,
  output_tokens int NOT NULL DEFAULT 0,
  latency_ms    int,
  outcome       text NOT NULL,             -- 'ok' | 'fallback' | 'failed'
  error_code    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX usage_events_user_day_idx ON usage_events (user_id, created_at DESC);
```

Kuota harian dihitung dengan agregasi, bukan counter:

```sql
SELECT count(*) FILTER (WHERE kind = 'chat')     AS chats,
       count(*) FILTER (WHERE kind = 'artifact') AS artifacts,
       count(*) FILTER (WHERE kind = 'upload')   AS uploads,
       COALESCE(sum(input_tokens + output_tokens), 0) AS tokens
FROM usage_events
WHERE user_id = $1 AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');
```

> Untuk skala MVP ini cukup. Jika `usage_events` membesar, tambahkan tabel
> `usage_daily` yang di-rollup oleh cron.

### 3.9 Tabel global (tanpa RLS per user)

```sql
CREATE TABLE ai_routes (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task     text NOT NULL CHECK (task IN ('chat','embed','vision')),
  position int  NOT NULL,
  provider provider_name NOT NULL,
  model    text NOT NULL,
  enabled  boolean NOT NULL DEFAULT true,
  UNIQUE (task, position)
);

CREATE TABLE ai_provider_state (
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
```

Seed data:

```sql
INSERT INTO ai_routes (task, position, provider, model) VALUES
  ('chat',   1, 'gemini', 'gemini-2.5-flash'),
  ('chat',   2, 'groq',   'llama-3.3-70b-versatile'),
  ('chat',   3, 'groq',   'gpt-oss-120b'),
  ('chat',   4, 'groq',   'llama-3.1-8b-instant'),
  ('embed',  1, 'gemini', 'gemini-embedding-001'),
  ('embed',  2, 'local',  'Xenova/bge-small-en-v1.5'),
  ('vision', 1, 'gemini', 'gemini-2.5-flash'),
  ('vision', 2, 'groq',   'meta-llama/llama-4-scout-17b-16e-instruct'),
  ('vision', 3, 'local',  'tesseract');
```

---

## 4. Row Level Security

Prinsip: **default deny**, lalu izinkan berdasarkan `auth.uid()`.

```sql
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources         ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_chunks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_routes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_state ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "own profile" ON profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- pola berulang untuk tabel ber-user_id
CREATE POLICY "own notebooks" ON notebooks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own sources" ON sources
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own chunks" ON source_chunks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own threads" ON chat_threads
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own messages" ON chat_messages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own artifacts" ON artifacts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own jobs" ON jobs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own usage" ON usage_events
  FOR SELECT USING (user_id = auth.uid());

-- tabel global: hanya service role yang boleh menulis
CREATE POLICY "read routes" ON ai_routes FOR SELECT USING (true);
CREATE POLICY "read breaker" ON ai_provider_state FOR SELECT USING (true);
```

Catatan penting:

- **Server-side writes** (ingestion, chat) memakai `service_role` key yang
  melewati RLS. Karena itu setiap query di server **wajib** memfilter `user_id`
  secara eksplisit. RLS adalah jaring pengaman untuk akses dari client, bukan
  pengganti pengecekan di server.
- `usage_events` hanya `SELECT` untuk user; insert dilakukan server.

---

## 5. Storage bucket

```
bucket: sources  (private)
path:   {user_id}/{notebook_id}/{source_id}.{ext}

policy:
  - SELECT/INSERT/DELETE hanya jika (storage.foldername(name))[1] = auth.uid()::text
```

File diakses lewat signed URL berumur 300 detik yang dibuat server.

---

## 6. Fungsi bantu

```sql
-- Hapus semua chunk sebuah source (dipakai saat re-ingest)
CREATE OR REPLACE FUNCTION clear_source_chunks(p_source uuid)
RETURNS void LANGUAGE sql AS $$
  DELETE FROM source_chunks WHERE source_id = p_source;
$$;

-- Update timestamp otomatis
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER notebooks_touch BEFORE UPDATE ON notebooks
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER sources_touch BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
```

---

## 7. Perkiraan kapasitas (Supabase Free)

| Item | Per unit | 500 MB muat |
| --- | --- | --- |
| Chunk (teks + vektor 1536) | ~7,5 KB | ~55.000 chunk |
| Source metadata | ~1 KB | — |
| Pesan chat | ~1 KB | — |
| File asli (Storage, 1 GB) | rata-rata 2 MB | ~500 file |

Realistisnya DB penuh lebih dulu daripada Storage jika dokumen banyak. Monitor
`pg_database_size('postgres')` dan tampilkan peringatan di `/admin` saat > 70%.
