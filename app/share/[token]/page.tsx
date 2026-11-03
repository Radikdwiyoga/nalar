import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BookOpen, Layers, MessageSquare, Sparkles, Lock, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { Artifact, Source } from '@/lib/types';
import { PublicNotebookView } from './public-notebook-view';

export const dynamic = 'force-dynamic';

function parseNotebookMeta(nb: any): { isPublic: boolean; shareToken: string; textDescription: string } {
  let isPublic = !!nb.is_public;
  let shareToken = nb.share_token || nb.id;
  let textDescription = nb.description || '';

  if (nb.description && nb.description.startsWith('{"_meta":true')) {
    try {
      const parsed = JSON.parse(nb.description);
      isPublic = !!parsed.isPublic;
      shareToken = parsed.shareToken || nb.id;
      textDescription = parsed.textDescription || '';
    } catch {
      // ignore
    }
  }

  return { isPublic, shareToken, textDescription };
}

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  // Try finding notebook by ID or share_token or in description
  let { data: notebook } = await admin
    .from('notebooks')
    .select('id, title, description, created_at, user_id')
    .or(`id.eq.${token},share_token.eq.${token}`)
    .maybeSingle();

  if (!notebook) {
    // Check if token matches description JSON or search all
    const { data: allNb } = await admin.from('notebooks').select('id, title, description, created_at, user_id');
    const matched = allNb?.find((nb) => {
      const meta = parseNotebookMeta(nb);
      return meta.shareToken === token || nb.id === token;
    });
    if (matched) {
      notebook = matched;
    }
  }

  if (!notebook) {
    notFound();
  }

  const meta = parseNotebookMeta(notebook);
  if (!meta.isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md bg-card p-8 rounded-2xl border text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Notebook Ini Bersifat Privat</h2>
            <p className="text-sm text-muted-foreground">
              Pemilik belum mengaktifkan akses publik untuk notebook ini.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <span>Buka Beranda Nalar</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Fetch active sources
  const { data: sources } = await admin
    .from('sources')
    .select('*')
    .eq('notebook_id', notebook.id)
    .eq('status', 'ready')
    .order('created_at', { ascending: true });

  // Fetch artifacts
  const { data: artifacts } = await admin
    .from('artifacts')
    .select('*')
    .eq('notebook_id', notebook.id)
    .order('created_at', { ascending: false });

  // Fetch chat messages from the primary thread
  const { data: threads } = await admin
    .from('chat_threads')
    .select('id')
    .eq('notebook_id', notebook.id)
    .order('created_at', { ascending: true })
    .limit(1);

  let messages: any[] = [];
  if (threads && threads.length > 0) {
    const { data: msgs } = await admin
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threads[0].id)
      .order('created_at', { ascending: true });
    messages = msgs || [];
  }

  return (
    <PublicNotebookView
      notebookTitle={notebook.title}
      sources={(sources as Source[]) || []}
      artifacts={(artifacts as Artifact[]) || []}
      messages={messages}
    />
  );
}

