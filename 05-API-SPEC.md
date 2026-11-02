# Spesifikasi API — Nalar

Semua endpoint berada di bawah `/api`, memakai sesi Supabase (cookie) dan
mengembalikan JSON. Pengecualian: `/api/chat` mengembalikan `text/event-stream`.

---

## 1. Konvensi

| Aspek | Aturan |
| --- | --- |
| Auth | Cookie sesi Supabase; `401` jika tidak ada sesi |
| Format error | `{ "error": { "code": "...", "message": "..." } }` |
| Validasi | Zod di setiap handler; `422` jika gagal |
| Rate limit | 30 req/menit per user per endpoint (kecuali chat: 10/menit) |
| Idempotency | Upload & ingest menerima header `Idempotency-Key` opsional |
| Paginasi | `?cursor=<id>&limit=20` (default 20, maks 50) |

### Kode error

| HTTP | Code | Arti |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Body tidak valid |
| 401 | `UNAUTHENTICATED` | Tidak ada sesi |
| 403 | `FORBIDDEN` | Bukan pemilik resource |
| 404 | `NOT_FOUND` | Resource tidak ada |
| 409 | `DUPLICATE_FILE` | File dengan hash sama sudah ada |
| 413 | `FILE_TOO_LARGE` | Melebihi 25 MB |
| 415 | `UNSUPPORTED_TYPE` | Format tidak didukung (cek magic bytes) |
| 422 | `VALIDATION_FAILED` | Field tidak valid |
| 429 | `QUOTA_EXCEEDED` | Kuota harian habis |
| 429 | `RATE_LIMITED` | Terlalu banyak request |
| 502 | `AI_PROVIDER_ERROR` | Provider gagal, fallback juga gagal |
| 503 | `ALL_PROVIDERS_FAILED` | Semua provider tidak tersedia |

---

## 2. Notebook

### `GET /api/notebooks`

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Riset Skripsi",
      "description": null,
      "sourceCount": 8,
      "readyCount": 7,
      "updatedAt": "2026-11-02T10:00:00Z"
    }
  ],
  "nextCursor": null
}
```

### `POST /api/notebooks`

```json
{ "title": "Riset Skripsi", "description": "opsional" }
```

→ `201` dengan objek notebook.

**Batasan:** maksimal 20 notebook per user → `429 QUOTA_EXCEEDED`.

### `PATCH /api/notebooks/:id`

```json
{ "title": "Judul baru" }
```

### `DELETE /api/notebooks/:id`

Menghapus cascade: sources, chunks, threads, messages, artifacts, jobs, dan file
di Storage. → `204`.

---

## 3. Source & upload

### `POST /api/notebooks/:id/sources`

`Content-Type: multipart/form-data`

| Field | Tipe | Wajib |
| --- | --- | --- |
| `file` | File | ya (boleh diulang untuk multi-upload) |

Alur server:

```
1. Cek kuota upload harian
2. Baca magic bytes → tentukan tipe sebenarnya
3. Tolak jika > 25 MB atau tipe tidak didukung
4. Hitung sha256 → cek duplikat di notebook
5. Upload ke Storage: {user_id}/{notebook_id}/{source_id}.{ext}
6. Insert row sources (status=queued)
7. Insert job stage=extract
8. Trigger ingestion (fire-and-forget)
9. Return 201
```

Respons `201`:

```json
{
  "data": [
    {
      "id": "uuid",
      "fileName": "laporan-2023.pdf",
      "status": "queued",
      "stage": "pending",
      "progress": 0
    }
  ]
}
```

Respons `207 Multi-Status` jika sebagian file gagal:

```json
{
  "data": [{ "id": "uuid", "fileName": "ok.pdf", "status": "queued" }],
  "errors": [
    { "fileName": "besar.pdf", "code": "FILE_TOO_LARGE", "message": "32 MB melebihi batas 25 MB" }
  ]
}
```

### `GET /api/sources/:id`

```json
{
  "id": "uuid",
  "fileName": "laporan-2023.pdf",
  "status": "ready",
  "stage": "done",
  "progress": 100,
  "pageCount": 42,
  "chunkCount": 118,
  "lowConfidence": false,
  "embeddingModel": "gemini-embedding-001",
  "error": null,
  "downloadUrl": "https://...signed... (5 menit)"
}
```

### `POST /api/sources/:id/ingest`

Dipanggil client untuk melanjutkan pipeline (client-driven chaining karena
batas 60 detik Vercel).

```json
{ "stage": "extract", "cursor": 0 }
```

Respons:

```json
{ "stage": "chunk", "cursor": 0, "done": false, "progress": 40 }
```

Client memanggil berulang sampai `done: true`. Interval 500 ms.

**Idempoten:** memanggil stage yang sama dua kali tidak menduplikasi data.

### `PATCH /api/sources/:id`

```json
{ "enabled": false }
```

Toggle apakah source ikut dipakai saat retrieval.

### `DELETE /api/sources/:id`

Hapus row, chunk (cascade), file di Storage. → `204`.

### `GET /api/sources/:id/content?page=3`

Mengembalikan teks per halaman (untuk source viewer) + offset karakter agar UI
bisa menyorot kutipan.

```json
{
  "page": 3,
  "text": "...",
  "chunks": [
    { "id": "uuid", "charStart": 120, "charEnd": 780 }
  ]
}
```

---

## 4. Chat

### `POST /api/chat`

`Content-Type: application/json`
`Accept: text/event-stream`

```json
{
  "notebookId": "uuid",
  "threadId": "uuid | null",
  "question": "Apa temuan utama studi Sari 2023?",
  "sourceIds": ["uuid"],
  "options": { "temperature": 0.2 }
}
```

`sourceIds` kosong/absen = pakai semua source `enabled = true` yang `ready`.

**Respons `200` — SSE**

```
event: meta
data: {"messageId":"m1","threadId":"t1","provider":"gemini","model":"gemini-2.5-flash"}

event: delta
data: {"text":"Menurut "}

event: delta
data: {"text":"studi Sari (2023) [S1], "}

event: citations
data: {"citations":[{"marker":"S1","chunkId":"c1","sourceId":"s1","sourceName":"sari-2023.pdf","page":12}]}

event: done
data: {"finish":"stop","usage":{"input":4210,"output":312},"latencyMs":2870}
```

Error di tengah stream:

```
event: error
data: {"code":"STREAM_INTERRUPTED","message":"Koneksi ke model terputus.","partial":true}
```

Error sebelum stream dimulai → HTTP `503`:

```json
{
  "error": {
    "code": "ALL_PROVIDERS_FAILED",
    "message": "Semua layanan AI sedang tidak tersedia. Coba lagi sebentar.",
    "attempts": [
      { "provider": "gemini", "model": "gemini-2.5-flash", "error": "RATE_LIMIT" },
      { "provider": "groq", "model": "llama-3.3-70b-versatile", "error": "TIMEOUT" }
    ]
  }
}
```

> `attempts` hanya dikirim saat `NODE_ENV !== 'production'` atau user adalah admin,
> agar tidak membocorkan detail internal ke pengguna umum.

**Prasyarat:** minimal 1 source `ready` di notebook → jika tidak, `409`
`NO_READY_SOURCES`.

### `GET /api/notebooks/:id/threads`

Daftar thread percakapan.

### `GET /api/threads/:id/messages`

```json
{
  "data": [
    { "id": "m0", "role": "user", "content": "...", "createdAt": "..." },
    {
      "id": "m1",
      "role": "assistant",
      "content": "Menurut studi Sari [S1] ...",
      "citations": [{ "marker": "S1", "sourceId": "s1", "page": 12 }],
      "provider": "groq",
      "model": "llama-3.3-70b-versatile",
      "finishReason": "stop"
    }
  ]
}
```

---

## 5. Artifact

### `POST /api/artifacts`

```json
{
  "notebookId": "uuid",
  "kind": "summary",
  "sourceIds": ["uuid"],
  "language": "id"
}
```

`kind`: `summary` | `faq` | `study_guide` | `timeline` | `briefing`

Proses memakan waktu lebih lama (map-reduce). Respons langsung `202`:

```json
{ "jobId": "uuid", "status": "queued" }
```

### `GET /api/artifacts/:jobId`

```json
{ "status": "running", "progress": 60, "stage": "reduce" }
```

Selesai:

```json
{ "status": "done", "artifactId": "uuid" }
```

### `GET /api/notebooks/:id/artifacts`

Daftar artifact.

### `GET /api/artifacts/:id`

```json
{
  "id": "uuid",
  "kind": "summary",
  "title": "Ringkasan Eksekutif — Riset Skripsi",
  "contentMd": "## Temuan Utama\n...",
  "citations": [{ "marker": "S1", "sourceId": "s1", "page": 12 }],
  "createdAt": "..."
}
```

---

## 6. Usage & settings

### `GET /api/usage`

```json
{
  "date": "2026-11-02",
  "chat":     { "used": 12, "limit": 100 },
  "artifact": { "used": 1,  "limit": 20 },
  "upload":   { "used": 3,  "limit": 50 },
  "tokens":   { "used": 18400, "limit": 300000 },
  "storageBytes": 47185920
}
```

### `PATCH /api/profile`

```json
{ "displayName": "Radik", "locale": "id", "preferredProvider": "groq" }
```

### `GET /api/health`

Untuk monitoring eksternal (uptime check).

```json
{
  "status": "ok",
  "providers": {
    "gemini": { "circuit": "closed", "lastError": null },
    "groq":   { "circuit": "open",   "lastError": "RATE_LIMIT" }
  },
  "db": "ok"
}
```

Tidak memerlukan auth, tapi tidak mengekspos data user.

---

## 7. Contoh pemakaian (client)

### Upload + tunggu sampai ready

```ts
const form = new FormData();
form.append('file', file);

const res = await fetch(`/api/notebooks/${nbId}/sources`, {
  method: 'POST',
  body: form,
});
const { data } = await res.json();
const sourceId = data[0].id;

// Polling + chaining
while (true) {
  const s = await fetch(`/api/sources/${sourceId}`).then(r => r.json());
  if (s.status === 'ready' || s.status === 'failed') break;
  if (s.status === 'processing') {
    await fetch(`/api/sources/${sourceId}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: s.stage }),
    });
  }
  await new Promise(r => setTimeout(r, 800));
}
```

### Streaming chat

```ts
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ notebookId, threadId, question }),
});

const reader = res.body!.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  const parts = buffer.split('\n\n');
  buffer = parts.pop() ?? '';

  for (const part of parts) {
    const [head, ...rest] = part.split('\n');
    const event = head.replace('event: ', '');
    const payload = JSON.parse(rest.join('\n').replace('data: ', ''));
    if (event === 'delta') appendText(payload.text);
    if (event === 'citations') setCitations(payload.citations);
    if (event === 'meta') setProvider(payload.provider);
  }
}
```

---

## 8. Catatan implementasi

- Semua handler memanggil `requireUser()` lebih dulu; tidak ada endpoint yang
  mengandalkan RLS saja.
- Handler yang memanggil AI dibungkus `withTimeout(45_000)`.
- `export const maxDuration = 60` dan `export const runtime = 'nodejs'` pada route
  ingestion, chat, dan artifact.
- Jangan pernah mengembalikan `error.stack` ke client.
- Header respons AI: `X-AI-Provider` dan `X-AI-Model` untuk debugging (aman
  diekspos karena tidak sensitif).
