import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

function parseNotebookMeta(nb: any): { isPublic: boolean; shareToken: string | null; textDescription: string } {
  let isPublic = Boolean(nb.is_public);
  let shareToken: string | null = nb.share_token || null;
  let textDescription = nb.description || '';

  // Legacy fallback if columns do not exist yet and JSON was stored in description
  if (nb.description && nb.description.startsWith('{"_meta":true')) {
    try {
      const parsed = JSON.parse(nb.description);
      isPublic = Boolean(parsed.isPublic);
      shareToken = parsed.shareToken || shareToken;
      textDescription = parsed.textDescription || '';
    } catch {
      // ignore
    }
  }

  return { isPublic, shareToken, textDescription };
}

export async function GET(
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
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: notebook, error } = await admin
    .from('notebooks')
    .select('*')
    .eq('id', notebookId)
    .eq('user_id', user.id)
    .single();

  if (error || !notebook) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Notebook tidak ditemukan' } }, { status: 404 });
  }

  const { isPublic, shareToken } = parseNotebookMeta(notebook);
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://nalar-five.vercel.app';
  const shareUrl = shareToken ? `${origin}/share/${shareToken}` : '';

  return NextResponse.json({
    data: {
      isPublic,
      shareToken,
      shareUrl,
    },
  });
}

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
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: notebook, error: fetchErr } = await admin
    .from('notebooks')
    .select('*')
    .eq('id', notebookId)
    .eq('user_id', user.id)
    .single();

  if (fetchErr || !notebook) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Notebook tidak ditemukan' } }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const enablePublic = Boolean(json?.isPublic);

  const meta = parseNotebookMeta(notebook);
  // Always use a cryptographic random token (never fall back to raw notebook UUID unless migrating legacy)
  const shareToken =
    meta.shareToken && meta.shareToken !== notebook.id
      ? meta.shareToken
      : crypto.randomBytes(16).toString('hex');

  // Try direct columns first (also clean description if it previously held _meta JSON)
  const updatePayload: Record<string, any> = {
    is_public: enablePublic,
    share_token: shareToken,
    updated_at: new Date().toISOString(),
  };
  if (notebook.description && notebook.description.startsWith('{"_meta":true')) {
    updatePayload.description = meta.textDescription || null;
  }

  const { error: directErr } = await admin
    .from('notebooks')
    .update(updatePayload)
    .eq('id', notebookId)
    .eq('user_id', user.id);

  // If columns do not exist in DB yet, fallback to JSON in description
  if (directErr) {
    const metaJson = JSON.stringify({
      _meta: true,
      isPublic: enablePublic,
      shareToken,
      textDescription: meta.textDescription,
    });

    await admin
      .from('notebooks')
      .update({
        description: metaJson,
        updated_at: new Date().toISOString(),
      })
      .eq('id', notebookId)
      .eq('user_id', user.id);
  }

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://nalar-five.vercel.app';
  const shareUrl = `${origin}/share/${shareToken}`;

  return NextResponse.json({
    data: {
      isPublic: enablePublic,
      shareToken,
      shareUrl,
    },
  });
}

