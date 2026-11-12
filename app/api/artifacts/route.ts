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
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } }, { status: 401 });
  }

  const json = await request.json();
  const { notebookId, kind = 'summary', sourceIds } = json;

  if (!notebookId) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'notebookId wajib diisi' } }, { status: 400 });
  }

  const admin = createAdminClient();

  // Pastikan notebook ini milik user yang sedang login (Multi-tenant Security Isolation)
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

  // Fetch chunks from the notebook milik user
  let query = admin
    .from('source_chunks')
    .select('content, source_id, page_number')
    .eq('notebook_id', notebookId)
    .eq('user_id', user.id)
    .limit(40);

  if (Array.isArray(sourceIds) && sourceIds.length > 0) {
    query = query.in('source_id', sourceIds);
  }

  const { data: chunks } = await query;

  if (!chunks || chunks.length === 0) {
    return NextResponse.json(
      { error: { code: 'NO_READY_SOURCES', message: 'Belum ada dokumen sumber yang siap dalam notebook ini' } },
      { status: 409 }
    );
  }

  const contextText = chunks
    .map((c, i) => `[Sumber ${i + 1}]:\n${c.content}`)
    .join('\n\n');

  const artifactPrompt = KIND_PROMPTS[kind as ArtifactKind] || KIND_PROMPTS.summary;

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
    const chatResult = await chat({ messages });
    const reader = chatResult.stream.getReader();
    let contentMd = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      contentMd += value;
    }

    const titles: Record<ArtifactKind, string> = {
      summary: 'Ringkasan Eksekutif',
      faq: 'Tanya Jawab (FAQ)',
      study_guide: 'Panduan Belajar',
      timeline: 'Kronologi Waktu',
      briefing: 'Dokumen Briefing',
    };

    const { data: artifact, error } = await admin
      .from('artifacts')
      .insert({
        notebook_id: notebookId,
        user_id: user.id,
        kind: kind as any,
        title: titles[kind as ArtifactKind] || 'Dokumen Hasil Sintesis',
        content_md: contentMd,
        provider: chatResult.provider as any,
        model: chatResult.model,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log usage
    await admin.from('usage_events').insert({
      user_id: user.id,
      kind: 'artifact',
      provider: chatResult.provider as any,
      model: chatResult.model,
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

