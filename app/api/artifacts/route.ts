import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { chat } from '@/lib/ai/router';
import { ArtifactKind } from '@/lib/types';

export const maxDuration = 60;

const KIND_PROMPTS: Record<ArtifactKind, string> = {
  summary: 'Buatkan ringkasan eksekutif komprehensif dan terstruktur dari seluruh dokumen yang tersedia. Sorot temuan utama, konteks, dan kesimpulan penting.',
  faq: 'Buatkan daftar 8-10 Tanya Jawab (FAQ) paling penting dan mendalam berdasarkan isi dokumen sumber.',
  study_guide: 'Buatkan Panduan Belajar (Study Guide) lengkap yang mencakup konsep-konsep kunci, glosarium istilah, ringkasan per bagian, dan pertanyaan latihan pemahaman.',
  timeline: 'Ekstrak dan susun kronologi/timeline urutan kejadian, perkembangan waktu, atau tahapan proses yang tercatat dalam dokumen.',
  briefing: 'Buatkan dokumen briefing padat dan tajam untuk pimpinan eksekutif yang mencakup latar belakang, data kunci, implikasi, dan rekomendasi aksi.',
  action_items: 'Identifikasi dan susun daftar rekomendasi strategis, poin tindak lanjut (action items), penanggung jawab, mitigasi risiko, dan prioritas tindakan dari dokumen secara terstruktur.',
  comparison: `Lakukan analisis perbandingan komparatif yang sangat mendalam dan terstruktur antar dokumen yang disediakan.
Sajikan dalam format berikut:
1. # Ringkasan Komparasi & Identifikasi Dokumen
2. ## Matriks Perbandingan Komprehensif
Sajikan dalam Tabel Markdown yang rapi dengan kolom:
| Aspek / Parameter | Dokumen A | Dokumen B | Analisis Perbedaan & Temuan Kritis |
Bandingkan secara spesifik:
- Ruang Lingkup Pekerjaan & Spesifikasi Teknis
- Nilai Anggaran / Finansial & Skema Pembayaran
- Jangka Waktu Pelaksanaan & Milestone Kunci
- Hak, Kewajiban, dan Klausul Regulasi
- Batasan Risiko, SLA, Garansi, dan Denda/Penalti
3. ## Analisis Temuan Utama & Deviasi Signifikan
4. ## Rekomendasi Keputusan & Mitigasi Risiko`,
  audio_overview: `Buatkan naskah percakapan podcast audio yang sangat hidup, natural, dan menarik antara 2 pembicara yang membedah intisari seluruh dokumen ini:
- **Maya (Host)**: Pembawa acara cerdas, santai, memandu diskusi, menanyakan analogi, dan merangkum poin inti agar mudah dipahami.
- **Budi (Analis)**: Pakar yang menguasai isi dokumen secara detail, membeberkan fakta konkret, angka penting, dan implikasinya.

Aturan Penulisan:
- Gunakan format dialog: **Maya:** [kalimat] atau **Budi:** [kalimat]
- Awali dengan opening podcast yang seru dan mengundang rasa ingin tahu.
- Diskusikan poin-poin utama secara mengalir seperti obrolan nyata, bukan membaca teks kaku.
- Tutup dengan kesimpulan praktis dan penutup podcast yang hangat.
- Bahasa: Bahasa Indonesia yang luwes dan profesional.`,
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } }, { status: 401 });
  }

  const json = await request.json();
  const { notebookId, kind = 'summary', sourceIds, customPrompt } = json;

  if (!notebookId) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'notebookId wajib diisi' } }, { status: 400 });
  }

  const admin = createAdminClient();
  const startTime = Date.now();

  // 1. Check daily artifact & token quota + user preferred provider
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [{ data: todayEvents }, { data: profile }] = await Promise.all([
    admin
      .from('usage_events')
      .select('kind, input_tokens, output_tokens')
      .eq('user_id', user.id)
      .gte('created_at', startOfDay.toISOString()),
    admin
      .from('profiles')
      .select('daily_artifact_limit, daily_token_limit, preferred_provider')
      .eq('id', user.id)
      .single(),
  ]);

  let artifactCount = 0;
  let usedTokens = 0;
  for (const ev of todayEvents || []) {
    if (ev.kind === 'artifact') artifactCount++;
    usedTokens += (ev.input_tokens || 0) + (ev.output_tokens || 0);
  }

  const dailyArtifactLimit = profile?.daily_artifact_limit ?? 20;
  const dailyTokenLimit = profile?.daily_token_limit ?? 300000;

  if (artifactCount >= dailyArtifactLimit) {
    return NextResponse.json(
      { error: { code: 'QUOTA_EXCEEDED', message: 'Batas pembuatan dokumen sintesis harian telah tercapai' } },
      { status: 429 }
    );
  }
  if (usedTokens >= dailyTokenLimit) {
    return NextResponse.json(
      { error: { code: 'TOKEN_QUOTA_EXCEEDED', message: 'Batas kuota token AI harian telah tercapai' } },
      { status: 429 }
    );
  }

  // 2. Pastikan notebook ini milik user yang sedang login (Multi-tenant Security Isolation)
  const { data: notebook, error: nbError } = await admin
    .from('notebooks')
    .select('id')
    .eq('id', notebookId)
    .eq('user_id', user.id)
    .single();

  if (nbError || !notebook) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Notebook tidak ditemukan atau bukan milik Anda' } },
      { status: 404 }
    );
  }

  // 3. Fetch ONLY ready & enabled sources (or explicit selected sourceIds)
  let sourcesQuery = admin
    .from('sources')
    .select('id, file_name')
    .eq('notebook_id', notebookId)
    .eq('user_id', user.id)
    .eq('status', 'ready');

  if (Array.isArray(sourceIds) && sourceIds.length > 0) {
    sourcesQuery = sourcesQuery.in('id', sourceIds);
  } else {
    sourcesQuery = sourcesQuery.eq('enabled', true);
  }

  const { data: sourcesData } = await sourcesQuery;
  const activeSources = sourcesData || [];

  if (activeSources.length === 0) {
    return NextResponse.json(
      { error: { code: 'NO_READY_SOURCES', message: 'Belum ada dokumen sumber aktif yang siap dalam notebook ini' } },
      { status: 409 }
    );
  }

  const sourceNameMap = new Map<string, string>();
  activeSources.forEach((s) => sourceNameMap.set(s.id, s.file_name));
  const activeSourceIds = activeSources.map((s) => s.id);

  // 4. Balanced Multi-Document Chunk Retrieval (ensures every active document is represented)
  const totalChunkBudget = activeSourceIds.length > 1 ? 64 : 40;
  const perSourceLimit = Math.max(4, Math.ceil(totalChunkBudget / activeSourceIds.length));

  const perSourceResults = await Promise.all(
    activeSourceIds.map((srcId) =>
      admin
        .from('source_chunks')
        .select('content, source_id, page_number, chunk_index')
        .eq('notebook_id', notebookId)
        .eq('user_id', user.id)
        .eq('source_id', srcId)
        .order('chunk_index', { ascending: true })
        .limit(perSourceLimit)
    )
  );

  const chunks = perSourceResults
    .flatMap((res) => res.data || [])
    .slice(0, totalChunkBudget);

  if (chunks.length === 0) {
    return NextResponse.json(
      { error: { code: 'NO_READY_SOURCES', message: 'Belum ada potongan teks dokumen yang siap dalam notebook ini' } },
      { status: 409 }
    );
  }

  const contextText = chunks
    .map((c, i) => {
      const srcName = sourceNameMap.get(c.source_id) || `Dokumen ${i + 1}`;
      const pageInfo = c.page_number ? ` (Hal. ${c.page_number})` : '';
      return `[${srcName}${pageInfo}]:\n${c.content}`;
    })
    .join('\n\n');

  const basePrompt = KIND_PROMPTS[kind as ArtifactKind] || KIND_PROMPTS.summary;
  const artifactPrompt = customPrompt
    ? `${basePrompt}\n\n=== INSTRUKSI KHUSUS DARI PENGGUNA ===\n${customPrompt}`
    : basePrompt;

  const messages = [
    {
      role: 'system',
      content: 'Anda adalah penyusun laporan analitis profesional. Hasilkan dokumen dalam format Markdown terstruktur rapi dengan judul, sub-judul, bullet points, dan penekanan yang jelas.',
    },
    {
      role: 'user',
      content: `Berikut adalah kumpulan materi dari dokumen sumber:\n\n${contextText}\n\nTUGAS:\n${artifactPrompt}`,
    },
  ];

  try {
    const chatResult = await chat({
      messages,
      preferredProvider: profile?.preferred_provider || null,
    });
    const reader = chatResult.stream.getReader();
    let contentMd = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      contentMd += value;
    }

    const usage = await chatResult.getUsage();
    const latencyMs = Date.now() - startTime;

    const titles: Record<ArtifactKind, string> = {
      summary: 'Ringkasan Eksekutif',
      faq: 'Tanya Jawab (FAQ)',
      study_guide: 'Panduan Belajar',
      timeline: 'Kronologi Waktu',
      briefing: 'Dokumen Briefing',
      action_items: 'Rekomendasi & Tindak Lanjut',
      comparison: 'Matriks Komparasi Dokumen',
      audio_overview: 'Naskah Podcast Audio Diskusi',
    };

    let insertKind = kind;
    let { data: artifact, error } = await admin
      .from('artifacts')
      .insert({
        notebook_id: notebookId,
        user_id: user.id,
        kind: insertKind as any,
        title: titles[kind as ArtifactKind] || 'Dokumen Hasil Sintesis',
        content_md: contentMd,
        source_ids: activeSourceIds,
        provider: chatResult.provider as any,
        model: chatResult.model,
      })
      .select()
      .single();

    // Fallback if Postgres enum doesn't yet have 'comparison', 'audio_overview', or 'action_items'
    if (error && (insertKind === 'comparison' || insertKind === 'audio_overview' || insertKind === 'action_items')) {
      insertKind = 'briefing';
      const fallbackResult = await admin
        .from('artifacts')
        .insert({
          notebook_id: notebookId,
          user_id: user.id,
          kind: insertKind as any,
          title: titles[kind as ArtifactKind] || 'Dokumen Hasil Sintesis',
          content_md: contentMd,
          source_ids: activeSourceIds,
          provider: chatResult.provider as any,
          model: chatResult.model,
        })
        .select()
        .single();
      artifact = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      throw error;
    }

    // Log usage with real token counts & latency
    await admin.from('usage_events').insert({
      user_id: user.id,
      kind: 'artifact',
      provider: chatResult.provider as any,
      model: chatResult.model,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      latency_ms: latencyMs,
      outcome: 'ok',
    });

    return NextResponse.json({ data: artifact }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'AI_PROVIDER_ERROR', message: err.message } },
      { status: 502 }
    );
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const notebookId = searchParams.get('notebookId');

  if (!notebookId) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'notebookId parameter wajib diisi' } }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: artifacts, error } = await admin
    .from('artifacts')
    .select('*')
    .eq('notebook_id', notebookId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ data: artifacts || [] });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'id parameter wajib diisi' } }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('artifacts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

