'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Layers, Loader2, Sparkles } from 'lucide-react';
import { Source, Citation } from '@/lib/types';
import { UploadDropzone } from '@/components/sources/upload-dropzone';
import { SourceList } from '@/components/sources/source-list';
import { ChatPanel } from '@/components/chat/chat-panel';
import { SourceViewer } from '@/components/sources/source-viewer';

export default function NotebookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: notebookId } = use(params);

  const [notebook, setNotebook] = useState<any>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  // Source viewer state
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const fetchNotebookData = async () => {
    try {
      const res = await fetch(`/api/notebooks/${notebookId}`);
      if (res.ok) {
        const json = await res.json();
        setNotebook(json.data);
        setSources(json.data.sources || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebookData();
  }, [notebookId]);

  const readySources = sources.filter((s) => s.status === 'ready' && s.enabled);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Notebook Tidak Ditemukan</h2>
        <Link href="/notebooks" className="text-primary hover:underline text-sm">
          Kembali ke daftar notebook
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b bg-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/notebooks"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
            title="Kembali ke Daftar Notebook"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm tracking-tight truncate max-w-xs sm:max-w-md">
              {notebook.title}
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {readySources.length} sumber aktif
            </span>
          </div>
        </div>
      </header>

      {/* Main split work area */}
      <div className="flex-1 flex min-h-0">
        {/* Left sources panel */}
        <div className="w-72 lg:w-80 border-r bg-muted/10 flex flex-col h-full shrink-0">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Layers className="w-4 h-4 text-primary" />
              <span>Sumber Dokumen</span>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {sources.length}
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <UploadDropzone
              notebookId={notebookId}
              onUploaded={fetchNotebookData}
            />

            <SourceList
              sources={sources}
              onRefresh={fetchNotebookData}
              onSelectSource={(s) => {
                setSelectedSourceId(s.id);
                setActiveCitation(null);
              }}
              selectedSourceId={selectedSourceId}
            />
          </div>
        </div>

        {/* Center chat panel */}
        <ChatPanel
          notebookId={notebookId}
          readySourceCount={readySources.length}
          onCitationClick={(cit) => {
            setActiveCitation(cit);
            setSelectedSourceId(cit.sourceId);
          }}
        />

        {/* Right source viewer drawer */}
        {(selectedSourceId || activeCitation) && (
          <SourceViewer
            sourceId={selectedSourceId}
            activeCitation={activeCitation}
            onClose={() => {
              setSelectedSourceId(null);
              setActiveCitation(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

