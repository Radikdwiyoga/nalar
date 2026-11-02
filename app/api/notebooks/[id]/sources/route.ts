import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: notebookId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } }, { status: 401 });
  }

  // Verify notebook exists and belongs to user
  const { data: notebook, error: nbError } = await supabase
    .from('notebooks')
    .select('id')
    .eq('id', notebookId)
    .eq('user_id', user.id)
    .single();

  if (nbError || !notebook) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Notebook tidak ditemukan' } }, { status: 404 });
  }

  // Parse multipart form
  const formData = await request.formData();
  const files = formData.getAll('file') as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Tidak ada file yang dikirim' } }, { status: 400 });
  }

  const results: any[] = [];
  const errors: any[] = [];
  const admin = createAdminClient();

  for (const file of files) {
    const fileName = file.name;
    const fileSize = file.size;
    const mimeType = file.type || 'application/octet-stream';

    if (fileSize > MAX_FILE_SIZE) {
      errors.push({
        fileName,
        code: 'FILE_TOO_LARGE',
        message: `${fileName} melebihi batas 25 MB`,
      });
      continue;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // SHA-256 for duplicate detection
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      // Check duplicate in this notebook
      const { data: existing } = await supabase
        .from('sources')
        .select('id, file_name')
        .eq('notebook_id', notebookId)
        .eq('file_hash', hash)
        .maybeSingle();

      if (existing) {
        errors.push({
          fileName,
          code: 'DUPLICATE_FILE',
          message: `File ini sudah ada di dalam notebook: ${existing.file_name}`,
        });
        continue;
      }

      // Generate source ID and storage path: {user_id}/{notebook_id}/{source_id}.{ext}
      const sourceId = crypto.randomUUID();
      const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
      const storagePath = `${user.id}/${notebookId}/${sourceId}.${ext}`;

      // Upload to Supabase Storage bucket 'sources'
      const { error: storageError } = await admin.storage
        .from('sources')
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (storageError) {
        errors.push({
          fileName,
          code: 'STORAGE_ERROR',
          message: storageError.message,
        });
        continue;
      }

      // Insert source row
      const { data: newSource, error: insertError } = await admin
        .from('sources')
        .insert({
          id: sourceId,
          notebook_id: notebookId,
          user_id: user.id,
          file_name: fileName,
          mime_type: mimeType,
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
        errors.push({
          fileName,
          code: 'DB_ERROR',
          message: insertError.message,
        });
        continue;
      }

      // Insert initial job for extraction
      await admin.from('jobs').insert({
        source_id: sourceId,
        user_id: user.id,
        stage: 'extract',
        status: 'queued',
        cursor: 0,
      });

      // Track usage event
      await admin.from('usage_events').insert({
        user_id: user.id,
        kind: 'upload',
        outcome: 'ok',
      });

      results.push({
        id: newSource.id,
        fileName: newSource.file_name,
        status: newSource.status,
        stage: newSource.stage,
        progress: newSource.progress,
      });
    } catch (err: any) {
      errors.push({
        fileName,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  const statusCode = errors.length > 0 && results.length > 0 ? 207 : errors.length > 0 ? 400 : 201;

  return NextResponse.json(
    {
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    },
    { status: statusCode }
  );
}
