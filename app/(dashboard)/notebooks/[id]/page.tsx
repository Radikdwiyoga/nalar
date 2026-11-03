'use client';

export const dynamic = 'force-dynamic';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Layers, Loader2, MessageSquare, Sparkles, Share2 } from 'lucide-react';
import { Source, Citation } from '@/lib/types';
import { UploadDropzone } from '@/components/sources/upload-dropzone';
import { SourceList } from '@/components/sources/source-list';
import { ChatPanel } from '@/components/chat/chat-panel';
import { SourceViewer } from '@/components/sources/source-viewer';
import { ArtifactStudio } from '@/components/artifacts/artifact-studio';
import { ShareModal } from '@/components/notebooks/share-modal';

export default function NotebookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: notebookId } = use(params);

  const [notebook, setNotebook] = useState<any>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Active view: 'chat' | 'studio' | 'sources' (on mobile)
  const [activeView, setActiveView] = useState<'chat' | 'studio' | 'sources'>('chat');

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
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Header */}
      <header className="h-14 border-b bg-card px-3 sm:px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/notebooks"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition shrink-0"
            title="Kembali ke Daftar Notebook"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-bold text-xs sm:text-sm tracking-tight truncate max-w-[140px] sm:max-w-xs md:max-w-md">
              {notebook.title}
            </h1>
            <span className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
              {readySources.length} sumber aktif
            </span>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop View Switcher (Chat vs Studio) */}
          <div className="hidden md:flex items-center bg-muted/60 p-1 rounded-lg border text-xs">
            <button
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                activeView === 'chat'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>Chat AI</span>
            </button>
            <button
              onClick={() => setActiveView('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                activeView === 'studio'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Studio & Dokumen</span>
            </button>
          </div>

          {/* Share Button */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors shadow-2xs"
            title="Bagikan Notebook"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Bagikan</span>
          </button>

          {/* Mobile Tab Switcher (Chat vs Studio vs Sumber) */}
          <div className="flex md:hidden items-center bg-muted/60 p-1 rounded-lg border text-xs">
            <button
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium transition-all ${
                activeView === 'chat'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="sr-only sm:not-sr-only">Chat</span>
            </button>
            <button
              onClick={() => setActiveView('studio')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium transition-all ${
                activeView === 'studio'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="sr-only sm:not-sr-only">Studio</span>
            </button>
            <button
              onClick={() => setActiveView('sources')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium transition-all ${
                activeView === 'sources'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="sr-only sm:not-sr-only">Sumber</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Work Area */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Sources Panel */}
        <div
          className={`${
            activeView === 'sources' ? 'flex w-full' : 'hidden'
          } md:flex md:w-72 lg:w-80 border-r bg-muted/10 flex-col h-full shrink-0 overflow-hidden`}
        >
          <div className="p-3.5 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Layers className="w-4 h-4 text-primary" />
              <span>Sumber Dokumen</span>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {sources.length}
            </span>
          </div>

          <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-4">
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

        {/* Center Workspace (Chat or Studio) */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          {activeView === 'studio' ? (
            <ArtifactStudio
              notebookId={notebookId}
              readySourceCount={readySources.length}
            />
          ) : (
            <div
              className={`${
                activeView === 'chat' ? 'flex' : 'hidden md:flex'
              } flex-1 flex-col h-full min-w-0 overflow-hidden`}
            >
              <ChatPanel
                notebookId={notebookId}
                readySourceCount={readySources.length}
                onCitationClick={(cit) => {
                  setActiveCitation(cit);
                  setSelectedSourceId(cit.sourceId);
                }}
              />
            </div>
          )}
        </div>

        {/* Source Viewer Drawer (Responsive Slide-over) */}
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

      {/* Share Modal */}
      {notebook && (
        <ShareModal
          notebookId={notebookId}
          notebookTitle={notebook.title}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
}
