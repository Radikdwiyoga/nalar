'use client';

export const dynamic = 'force-dynamic';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Layers,
  Loader2,
  MessageSquare,
  Sparkles,
  Share2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Source, Citation } from '@/lib/types';
import { UploadDropzone } from '@/components/sources/upload-dropzone';
import { SourceList } from '@/components/sources/source-list';
import { ChatPanel } from '@/components/chat/chat-panel';
import { SourceViewer } from '@/components/sources/source-viewer';
import { ArtifactStudio } from '@/components/artifacts/artifact-studio';
import { ShareModal } from '@/components/notebooks/share-modal';
import { ThemeToggle } from '@/components/theme/theme-toggle';

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

  const [activeView, setActiveView] = useState<'chat' | 'studio' | 'sources'>('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      <div className="flex items-center justify-center h-full py-24 text-nalar-muted">
        <Loader2 className="w-8 h-8 animate-spin text-nalar-accent" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-serif font-bold text-nalar-text">Notebook Tidak Ditemukan</h2>
        <Link href="/notebooks" className="text-nalar-accent hover:underline text-sm">
          Kembali ke daftar notebook
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-nalar-bg text-nalar-text md:p-2.5 md:gap-2.5">
      {/* Floating Island Top Header */}
      <header className="h-14 md:rounded-2xl border-b md:border border-nalar-border bg-nalar-card/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 z-20 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <Link
            href="/notebooks"
            className="p-1.5 rounded-xl text-nalar-muted hover:text-nalar-text hover:bg-nalar-surface transition shrink-0"
            title="Kembali ke Koleksi Notebook"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:inline-flex p-1.5 rounded-xl text-nalar-muted hover:text-nalar-text hover:bg-nalar-surface transition shrink-0 cursor-pointer"
            title={sidebarCollapsed ? 'Tampilkan Panel Sumber' : 'Sembunyikan Panel Sumber'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          <div className="h-4 w-px bg-nalar-border hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-serif font-bold text-xs sm:text-sm md:text-base tracking-tight truncate max-w-[140px] sm:max-w-xs md:max-w-md text-nalar-text">
              {notebook.title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-nalar-citationBg text-nalar-accent border border-nalar-citationBorder font-semibold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {readySources.length} sumber aktif
            </span>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop View Switcher (Chat vs Studio) */}
          <div className="hidden md:flex items-center bg-nalar-surface p-1 rounded-xl border border-nalar-border text-xs">
            <button
              type="button"
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeView === 'chat'
                  ? 'bg-nalar-card text-nalar-text shadow-2xs font-semibold'
                  : 'text-nalar-muted hover:text-nalar-text'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-nalar-accent" />
              <span>Chat AI</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeView === 'studio'
                  ? 'bg-nalar-card text-nalar-text shadow-2xs font-semibold'
                  : 'text-nalar-muted hover:text-nalar-text'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Studio Sintesis</span>
            </button>
          </div>

          <ThemeToggle compact />

          {/* Share Button */}
          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-nalar-border bg-nalar-card hover:bg-nalar-surface text-xs font-medium text-nalar-text transition-colors shadow-2xs cursor-pointer"
            title="Bagikan Notebook"
          >
            <Share2 className="w-3.5 h-3.5 text-nalar-accent" />
            <span className="hidden sm:inline">Bagikan</span>
          </button>

          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden items-center bg-nalar-surface p-0.5 rounded-xl border border-nalar-border text-[11px]">
            <button
              type="button"
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeView === 'chat'
                  ? 'bg-nalar-card text-nalar-text shadow-2xs font-bold'
                  : 'text-nalar-muted'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-nalar-accent" />
              <span>Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('studio')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-all ${
                activeView === 'studio'
                  ? 'bg-nalar-card text-nalar-text shadow-2xs font-bold'
                  : 'text-nalar-muted'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('sources')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-all ${
                activeView === 'sources'
                  ? 'bg-nalar-card text-nalar-text shadow-2xs font-bold'
                  : 'text-nalar-muted'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-nalar-accent" />
              <span>Sumber</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Floating Islands Workspace */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden md:gap-2.5">
        {/* Left Island: Sources Panel */}
        <div
          className={`${
            activeView === 'sources' ? 'flex w-full' : 'hidden'
          } ${
            sidebarCollapsed ? 'md:hidden' : 'md:flex md:w-72 lg:w-80'
          } md:rounded-2xl floating-island flex-col h-full shrink-0 overflow-hidden transition-all`}
        >
          <div className="p-3.5 border-b border-nalar-border flex items-center justify-between shrink-0 bg-nalar-surface/50">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-nalar-muted">
              <Layers className="w-4 h-4 text-nalar-accent" />
              <span>Sumber Dokumen</span>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-nalar-card border border-nalar-border text-nalar-text">
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

        {/* Center Island: Chat or Studio */}
        <div
          className={`${
            activeView === 'sources' ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col h-full min-w-0 overflow-hidden md:rounded-2xl floating-island`}
        >
          {activeView === 'studio' ? (
            <ArtifactStudio
              notebookId={notebookId}
              readySourceCount={readySources.length}
              sources={sources}
            />
          ) : (
            <ChatPanel
              notebookId={notebookId}
              readySourceCount={readySources.length}
              onCitationClick={(cit) => {
                setActiveCitation(cit);
                setSelectedSourceId(cit.sourceId);
              }}
            />
          )}
        </div>

        {/* Right Island: Source Viewer Split Panel */}
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
