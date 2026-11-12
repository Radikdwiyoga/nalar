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
    <div className="flex flex-col h-screen overflow-hidden bg-nalar-bg text-nalar-text">
      {/* Top Header */}
      <header className="h-14 border-b border-[#E5E0D5] bg-[#FAF8F5]/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/notebooks"
            className="p-1.5 rounded-lg text-nalar-muted hover:text-nalar-text hover:bg-[#F3F0EA] transition shrink-0"
            title="Kembali ke Daftar Notebook"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-serif font-bold text-xs sm:text-sm tracking-tight truncate max-w-[140px] sm:max-w-xs md:max-w-md text-nalar-text">
              {notebook.title}
            </h1>
            <span className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-[#F3EAE2] text-[#A6421D] border border-[#DFC9B8]/70 font-medium shrink-0">
              {readySources.length} sumber aktif
            </span>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop View Switcher (Chat vs Studio) */}
          <div className="hidden md:flex items-center bg-[#F3F0EA] p-1 rounded-xl border border-[#E5E0D5] text-xs">
            <button
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeView === 'chat'
                  ? 'bg-white text-nalar-text shadow-2xs font-semibold'
                  : 'text-nalar-muted hover:text-nalar-text'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-nalar-accent" />
              <span>Chat AI</span>
            </button>
            <button
              onClick={() => setActiveView('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeView === 'studio'
                  ? 'bg-white text-nalar-text shadow-2xs font-semibold'
                  : 'text-nalar-muted hover:text-nalar-text'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Studio Dokumen</span>
            </button>
          </div>

          {/* Share Button */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#E5E0D5] bg-white hover:bg-[#F3F0EA] text-xs font-medium text-nalar-text transition-colors shadow-2xs cursor-pointer"
            title="Bagikan Notebook"
          >
            <Share2 className="w-3.5 h-3.5 text-nalar-accent" />
            <span className="hidden sm:inline">Bagikan</span>
          </button>

          {/* Mobile Tab Switcher (Chat vs Studio vs Sumber) */}
          <div className="flex md:hidden items-center bg-[#F3F0EA] p-0.5 rounded-xl border border-[#E5E0D5] text-[11px]">
            <button
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeView === 'chat'
                  ? 'bg-white text-nalar-text shadow-2xs font-bold'
                  : 'text-nalar-muted'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-nalar-accent" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setActiveView('studio')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-all ${
                activeView === 'studio'
                  ? 'bg-white text-nalar-text shadow-2xs font-bold'
                  : 'text-nalar-muted'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Studio</span>
            </button>
            <button
              onClick={() => setActiveView('sources')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-all ${
                activeView === 'sources'
                  ? 'bg-white text-nalar-text shadow-2xs font-bold'
                  : 'text-nalar-muted'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-nalar-accent" />
              <span>Sumber</span>
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
          } md:flex md:w-72 lg:w-80 border-r border-[#E5E0D5] bg-[#F3F0EA] flex-col h-full shrink-0 overflow-hidden`}
        >
          <div className="p-3.5 border-b border-[#E5E0D5] flex items-center justify-between shrink-0 bg-[#F3F0EA]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-nalar-muted">
              <Layers className="w-4 h-4 text-nalar-accent" />
              <span>Sumber Dokumen</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-[#E5E0D5] text-nalar-text">
              {sources.length}
            </span>
          </div>

          <div className="p-3 sm:p-3.5 flex-1 overflow-y-auto space-y-3.5">
            <UploadDropzone
              notebookId={notebookId}
              onUploaded={fetchNotebookData}
            />

            <SourceList
              sources={sources}
              onRefresh={fetchNotebookData}
              onSelectSource={(s) => {
                if (selectedSourceId === s.id && !activeCitation) {
                  setSelectedSourceId(null);
                } else {
                  setSelectedSourceId(s.id);
                  setActiveCitation(null);
                }
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
              sources={sources}
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
