import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { fetchUrlResource } from '@/lib/ingest/url';

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: notebookId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  // Verify notebook exists and belongs to user
  const { data: notebook, error: nbError } = await supabase
    .from('notebooks')
    .select('id')
    .eq('id', notebookId)
    .eq('user_id', user.id)
    .single();

  if (nbError || !notebook) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Notebook tidak ditemukan' } },
      { status: 404 }
    );
  }

  const json = await request.json().catch(() => null);
  const { url, title } = json || {};

  if (!url || typeof url !== 'string') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'URL dokumen wajib diisi' } },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Check daily upload limit & per-notebook source limit
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const [{ count: todayUploads }, { data: profile }, { count: currentNotebookSources }] = await Promise.all([
    admin
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kind', 'upload')
      .gte('created_at', startOfDay.toISOString()),
    admin.from('profiles').select('daily_upload_limit').eq('id', user.id).single(),
    admin
      .from('sources')
      .select('*', { count: 'exact', head: true })
      .eq('notebook_id', notebookId)
      .eq('user_id', user.id),
  ]);

  const dailyUploadLimit = profile?.daily_upload_limit ?? 50;
  const maxSourcesPerNotebook = parseInt(process.env.MAX_SOURCES_PER_NOTEBOOK || '50', 10);

  if ((todayUploads ?? 0) >= dailyUploadLimit) {
    return NextResponse.json(
      { error: { code: 'QUOTA_EXCEEDED', message: `Batas unggah harian (${dailyUploadLimit} berkas) telah tercapai` } },
      { status: 429 }
    );
  }

  if ((currentNotebookSources ?? 0) >= maxSourcesPerNotebook) {
    return NextResponse.json(
      { error: { code: 'NOTEBOOK_FULL', message: `Maksimal ${maxSourcesPerNotebook} dokumen sumber per notebook` } },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch content from Google Drive or Web URL
    const fetched = await fetchUrlResource(url.trim(), title);

    const fileSize = fetched.buffer.length;
    if (fileSize > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: { code: 'FILE_TOO_LARGE', message: 'Ukuran file melebihi batas 25 MB' } },
        { status: 400 }
      );
    }

    // 2. Hash for duplicate detection
    const hash = crypto.createHash('sha256').update(fetched.buffer).digest('hex');

    // Check duplicate
    const { data: existing } = await admin
      .from('sources')
      .select('id, file_name')
      .eq('notebook_id', notebookId)
      .eq('file_hash', hash)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: {
            code: 'DUPLICATE_FILE',
            message: `Dokumen dari link ini sudah ada di dalam notebook: ${existing.file_name}`,
          },
        },
        { status: 409 }
      );
    }

    // 3. Upload to Supabase Storage
    const sourceId = crypto.randomUUID();
    const ext = fetched.fileName.includes('.') ? fetched.fileName.split('.').pop() : 'txt';
    const storagePath = `${user.id}/${notebookId}/${sourceId}.${ext}`;

    const { error: storageError } = await admin.storage
      .from('sources')
      .upload(storagePath, fetched.buffer, {
        contentType: fetched.mimeType,
        upsert: false,
      });

    if (storageError) {
      throw new Error(`Gagal menyimpan ke storage: ${storageError.message}`);
    }

    // 4. Insert into sources table
    const { data: source, error: insertError } = await admin
      .from('sources')
      .insert({
        id: sourceId,
        notebook_id: notebookId,
        user_id: user.id,
        file_name: fetched.fileName,
        mime_type: fetched.mimeType,
        file_size: fileSize,
        storage_path: storagePath,
        file_hash: hash,
        status: 'queued',
        stage: 'pending',
        progress: 0,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Gagal menyimpan data sumber: ${insertError.message}`);
    }

    // 5. Insert job & usage event (matching file upload behavior)
    await Promise.all([
      admin.from('jobs').insert({
        source_id: sourceId,
        user_id: user.id,
        stage: 'extract',
        status: 'queued',
        cursor: 0,
      }),
      admin.from('usage_events').insert({
        user_id: user.id,
        kind: 'upload',
        outcome: 'ok',
      }),
    ]);

    return NextResponse.json({ data: source }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'FETCH_URL_FAILED', message: err.message || 'Gagal memproses URL' } },
      { status: 422 }
    );
  }
}

