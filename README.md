# Nalar — AI Notebook Pribadi

> Upload dokumenmu (PDF, Word, Excel, TXT, gambar), lalu tanya-jawab dengan AI yang
> menjawab **hanya berdasarkan isi dokumen** dan menyertakan sitasi ke halaman aslinya.
> Ditenagai dua provider AI dengan rantai fallback otomatis.

Status: **dokumen perencanaan (belum ada kode aplikasi)**

---

## 1. Ringkasan produk

Nalar adalah web app multi-user untuk individu (bukan tim). Setiap user punya akun
sendiri dan data terisolasi total. Konsep intinya mirip NotebookLM:

- Buat **Notebook** (semacam folder proyek)
- Masukkan **Source** (dokumen) ke dalam notebook
- Tanya jawab dengan AI, jawaban selalu **grounded + bersitasi**
- Generate **Artifact** (ringkasan, FAQ, study guide, timeline, briefing doc)

Pembeda utama: **fallback chain dua provider** (Google AI Studio / Gemini dan Groq)
supaya layanan tetap jalan saat salah satu kena rate limit, down, atau error.

---

## 2. Dokumen dalam paket ini

| Dokumen | Isi |
| --- | --- |
| [`docs/01-PRD.md`](docs/01-PRD.md) | Product Requirements Document lengkap: tujuan, persona, scope, fitur + acceptance criteria, NFR, risiko |
| [`docs/02-ARCHITECTURE.md`](docs/02-ARCHITECTURE.md) | Arsitektur sistem, pipeline ingestion, alur RAG, diagram, batasan Vercel/Supabase |
| [`docs/03-AI-FALLBACK.md`](docs/03-AI-FALLBACK.md) | Spesifikasi rantai fallback: matriks kapabilitas, taksonomi error, circuit breaker, contoh kode |
| [`docs/04-DATA-MODEL.md`](docs/04-DATA-MODEL.md) | Skema database (Postgres + pgvector), RLS, SQL siap pakai |
| [`docs/05-API-SPEC.md`](docs/05-API-SPEC.md) | Kontrak REST + SSE, format request/response, kode error |
| [`docs/06-ROADMAP.md`](docs/06-ROADMAP.md) | Milestone, urutan pengerjaan, estimasi, estimasi biaya |
| [`.env.example`](.env.example) | Semua environment variable yang dibutuhkan |

Urutan baca yang disarankan: `01 → 02 → 03 → 04 → 05 → 06`.

---

## 3. Stack yang dipilih

| Layer | Pilihan | Alasan |
| --- | --- | --- |
| Frontend + Backend | **Next.js 15 (App Router) + TypeScript** | Satu codebase, streaming SSE mudah, deploy Vercel gratis |
| UI | **Tailwind CSS + shadcn/ui** | Cepat, konsisten, tidak perlu desain dari nol |
| Database | **Supabase Postgres + pgvector** | Vector search + full-text search + RLS dalam satu DB |
| Auth | **Supabase Auth** (email + Google OAuth) | Bawaan, RLS terintegrasi, gratis |
| File storage | **Supabase Storage** | Signed URL, gratis 1 GB |
| Parsing dokumen | `unpdf` (PDF), `mammoth` (DOCX), `xlsx` (Excel), `tesseract.js` (OCR cadangan) | Semua ringan, jalan di Node runtime |
| Embedding | Gemini `gemini-embedding-001` → fallback lokal | Groq tidak punya endpoint embedding |
| LLM | Gemini 2.5 Flash → Groq (Llama 3.3 70B / GPT-OSS 120B) | Free tier keduanya cukup untuk MVP |
| Job/antrian | Tabel `jobs` + route handler (`maxDuration = 60`) | Tanpa infra tambahan; upgrade ke Trigger.dev bila perlu |
| Deploy | **Vercel Hobby** | Gratis, terintegrasi Next.js |

---

## 4. Estimasi biaya MVP

| Komponen | Free tier | Cukup untuk |
| --- | --- | --- |
| Vercel Hobby | 100 GB bandwidth, function 60s | ~50 user aktif ringan |
| Supabase Free | 500 MB DB, 1 GB storage, 5 GB egress | ~200 dokumen / ~2.000 chunk |
| Gemini API free tier | Rate limit per menit/hari (berubah-ubah, cek dashboard) | Chat + embedding harian |
| Groq free tier | Rate limit per model (TPM/RPM) | Fallback + burst |

**Total: $0/bulan** untuk pemakaian pribadi dan beberapa tester.
Bottleneck pertama biasanya **storage Supabase (1 GB)**, bukan API.

> Angka free tier sering berubah. Selalu verifikasi di dashboard masing-masing
> provider sebelum mengandalkannya.

---

## 5. Langkah berikutnya

1. Review `docs/01-PRD.md` — terutama bagian **Out of Scope** dan **Open Questions**.
2. Konfirmasi nama produk & domain (sekarang masih working title "Nalar").
3. Mulai Milestone 0 di `docs/06-ROADMAP.md` (setup repo + Supabase + kunci API).
4. Scaffold aplikasi Next.js.

---

## 6. Batasan yang harus disadari sejak awal

- **Groq tidak menyediakan embedding.** Rantai embedding hanya Gemini → model lokal.
  Groq hanya dipakai untuk generasi teks dan (terbatas) vision.
- **Free tier = rate limit ketat.** Fallback bukan kemewahan, tapi kebutuhan.
- **Dokumen adalah input tidak tepercaya.** Prompt injection dari isi PDF harus
  dimitigasi (lihat `03-AI-FALLBACK.md` bagian Keamanan Prompt).
- **Bukan alat kolaborasi.** Tidak ada sharing notebook antar user di MVP.
