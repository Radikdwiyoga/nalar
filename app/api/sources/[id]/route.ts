import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { data: source, error } = await supabase
    .from('sources')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !source) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Sumber tidak ditemukan' } }, { status: 404 });
  }

  // Create signed URL for download (300 seconds)
  const admin = createAdminClient();
  const { data: signed } = await admin.storage
    .from('sources')
    .createSignedUrl(source.storage_path, 300);

  // Fetch chunks for in-app reader & smart citation highlight
  const { data: chunks } = await admin
    .from('source_chunks')
    .select('id, chunk_index, content, page_number, sheet_name, heading_path')
    .eq('source_id', id)
    .eq('user_id', user.id)
    .order('chunk_index', { ascending: true });

  return NextResponse.json({
    data: {
      id: source.id,
      fileName: source.file_name,
      fileSize: source.file_size,
      mimeType: source.mime_type,
      status: source.status,
      stage: source.stage,
      progress: source.progress,
      pageCount: source.page_count,
      charCount: source.char_count,
      chunkCount: source.chunk_count,
      lowConfidence: source.low_confidence,
      embeddingModel: source.embedding_model,
      enabled: source.enabled,
      error: source.error_message,
      downloadUrl: signed?.signedUrl || null,
      chunks: chunks || [],
      updatedAt: source.updated_at,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } }, { status: 401 });
  }

  const json = await request.json();
  const { enabled } = json;

  const { data: source, error } = await supabase
    .from('sources')
    .update({ enabled: Boolean(enabled) })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ data: source });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { data: source } = await supabase
    .from('sources')
    .select('storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!source) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Sumber tidak ditemukan' } }, { status: 404 });
  }

  const admin = createAdminClient();

  // Remove file from storage
  await admin.storage.from('sources').remove([source.storage_path]);

  // Remove source row (foreign keys cascade to chunks and jobs)
  await admin.from('sources').delete().eq('id', id).eq('user_id', user.id);

  return new NextResponse(null, { status: 204 });
}

