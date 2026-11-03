import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateNotebookSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: notebook, error } = await supabase
    .from('notebooks')
    .select(`
      *,
      sources (*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !notebook) {
    return NextResponse.json({ error: 'Notebook tidak ditemukan' }, { status: 404 });
  }

  // Auto-recover stale processing sources (if stuck > 2 minutes)
  const now = Date.now();
  if (notebook.sources && Array.isArray(notebook.sources)) {
    for (const s of notebook.sources) {
      if (s.status === 'processing' || s.status === 'queued') {
        const updatedAt = new Date(s.updated_at || s.created_at).getTime();
        if (now - updatedAt > 2 * 60 * 1000) {
          s.status = 'failed';
          s.error_message = 'Waktu proses habis atau koneksi terputus. Silakan klik Ulangi.';
          // Update in background
          supabase
            .from('sources')
            .update({
              status: 'failed',
              error_code: 'TIMEOUT_STALE',
              error_message: 'Waktu proses habis atau koneksi terputus. Silakan klik Ulangi.',
            })
            .eq('id', s.id)
            .then(() => {});
        }
      }
    }
  }

  return NextResponse.json({ data: notebook });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = updateNotebookSchema.parse(json);

    const { data: notebook, error } = await supabase
      .from('notebooks')
      .update(parsed)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: notebook });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Deleting a notebook cascades delete to sources, source_chunks, threads, artifacts.
  const { error } = await supabase
    .from('notebooks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

