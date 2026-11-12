'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Citation } from '@/lib/types';
import {
  X,
  ExternalLink,
  FileText,
  Loader2,
  Bookmark,
  Maximize2,
  Minimize2,
  Search,
  Copy,
  Check,
  Download,
  Layers,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface ChunkItem {
  id: string;
  chunk_index: number;
  content: string;
  page_number: number | null;
  sheet_name: string | null;
  heading_path: string | null;
}

interface SourceViewerProps {
  sourceId?: string | null;
  activeCitation?: Citation | null;
  onClose: () => void;
}

export function SourceViewer({ sourceId, activeCitation, onClose }: SourceViewerProps) {
  const targetId = sourceId || activeCitation?.sourceId;
  const [sourceData, setSourceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pdf' | 'text'>('pdf');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const activeChunkRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    fetch(`/api/sources/${targetId}`)
      .then((r) => r.json())
      .then((json) => {
        const data = json.data || null;
        setSourceData(data);

        // If not a PDF, default to the text / chunks tab
        const isPdf =
          data?.mimeType === 'application/pdf' ||
          data?.fileName?.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
          setActiveTab('text');
        } else {
          setActiveTab('pdf');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [targetId]);

  // Update target page when citation changes
  useEffect(() => {
    if (activeCitation?.page) {
      setCurrentPage(activeCitation.page);
    }
  }, [activeCitation]);

  // Auto-scroll to active chunk when switching to text tab or when activeCitation updates
  useEffect(() => {
    if (activeTab === 'text' && activeChunkRef.current) {
      const timer = setTimeout(() => {
        activeChunkRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeTab, activeCitation, sourceData]);

  const handleCopyChunk = async (chunkId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedChunkId(chunkId);
      setTimeout(() => setCopiedChunkId(null), 2000);
    } catch (err) {
      console.error('Failed to copy chunk:', err);
    }
  };

  const isPdf = useMemo(() => {
    if (!sourceData) return false;
    return (
      sourceData.mimeType === 'application/pdf' ||
      sourceData.fileName?.toLowerCase().endsWith('.pdf')
    );
  }, [sourceData]);

  // Filter chunks based on in-document search query
  const filteredChunks: ChunkItem[] = useMemo(() => {
    const list: ChunkItem[] = sourceData?.chunks || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        (c.heading_path && c.heading_path.toLowerCase().includes(q))
    );
  }, [sourceData?.chunks, searchQuery]);

  if (!targetId) return null;

  const targetPage = activeCitation?.page || currentPage || 1;
  const pdfEmbedUrl = sourceData?.downloadUrl
    ? `${sourceData.downloadUrl}#page=${targetPage}&view=FitH`
    : null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />

      {/* Split Viewer Container */}
      <div
        className={`fixed inset-y-0 right-0 z-50 md:static md:z-auto border-l border-[#E5E0D5] bg-[#F3F0EA] flex flex-col h-full shrink-0 shadow-2xl md:shadow-none transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'w-full md:w-[65%] lg:w-[70%] xl:w-[75%]'
            : 'w-full max-w-lg md:w-[48%] lg:w-[50%] xl:w-[50%]'
        }`}
      >
        {/* Header Bar */}
        <div className="h-14 px-3 sm:px-4 border-b border-[#E5E0D5] flex items-center justify-between gap-2 shrink-0 bg-[#FAF8F5]/80 backdrop-blur-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#F3EAE2] text-[#C25127] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs sm:text-sm text-nalar-text truncate block font-serif">
                  {sourceData?.fileName || 'Memuat Dokumen...'}
                </span>
                {isPdf && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-500/10 text-red-600 border border-red-500/20 shrink-0">
                    PDF
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-nalar-muted truncate">
                {activeCitation && (
                  <span className="inline-flex items-center gap-1 text-[#C25127] font-semibold">
                    <Bookmark className="w-3 h-3" />
                    Sitasi [{activeCitation.marker}]
                    {activeCitation.page ? ` · Hal. ${activeCitation.page}` : ''}
                  </span>
                )}
                {sourceData?.fileSize && (
                  <span>· {formatBytes(sourceData.fileSize)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {sourceData?.downloadUrl && (
              <a
                href={sourceData.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka file asli di tab baru"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Expand / Collapse Split Button (Desktop only) */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden md:inline-flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              title={isExpanded ? 'Perkecil ke tampilan split 50%' : 'Perlebar tampilan dokumen'}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer ml-1"
              aria-label="Tutup panel dokumen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Subheader */}
        <div className="px-3 sm:px-4 py-2 border-b bg-muted/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border text-xs">
            {isPdf && (
              <button
                onClick={() => setActiveTab('pdf')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeTab === 'pdf'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>Dokumen Asli (PDF)</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Teks & Chunks ({sourceData?.chunkCount || 0})</span>
            </button>
          </div>

          {/* Quick jump to cited page if PDF and citation exists */}
          {activeTab === 'pdf' && isPdf && activeCitation?.page && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-muted-foreground font-medium">
                Kutipan di:
              </span>
              <button
                onClick={() => setCurrentPage(activeCitation.page!)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold text-[11px] hover:bg-amber-500/20 transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Hal. {activeCitation.page}
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 relative overflow-hidden bg-background">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-medium">Memuat berkas dokumen...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: PDF Viewer */}
              {activeTab === 'pdf' && (
                <div className="h-full flex flex-col relative bg-muted/30">
                  {pdfEmbedUrl ? (
                    <div className="flex-1 h-full w-full relative">
                      <iframe
                        src={pdfEmbedUrl}
                        key={`${pdfEmbedUrl}-${currentPage}`}
                        title={sourceData?.fileName || 'PDF Viewer'}
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground space-y-3">
                      <FileText className="w-12 h-12 text-muted-foreground/60" />
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          Preview Langsung Tidak Tersedia
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                          Dokumen berformat non-PDF dapat Anda baca melalui tab{' '}
                          <span className="font-semibold text-primary">Teks & Chunks</span> atau unduh file aslinya.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => setActiveTab('text')}
                          className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium shadow-xs"
                        >
                          Buka Teks Dokumen
                        </button>
                        {sourceData?.downloadUrl && (
                          <a
                            href={sourceData.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl border bg-card text-xs font-medium hover:bg-muted"
                          >
                            Unduh File
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Extracted Text & Chunks Viewer */}
              {activeTab === 'text' && (
                <div className="h-full flex flex-col">
                  {/* Search bar inside document chunks */}
                  <div className="p-3 border-b bg-muted/20 shrink-0">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari kata kunci dalam dokumen ini..."
                        className="w-full pl-8 pr-8 py-1.5 rounded-lg border bg-background text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        Menampilkan {filteredChunks.length} dari {sourceData?.chunks?.length || 0} potongan teks
                      </p>
                    )}
                  </div>

                  {/* Chunks List */}
                  <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3"
                  >
                    {filteredChunks.length === 0 ? (
                      <div className="text-center py-12 text-xs text-muted-foreground">
                        Tidak ada potongan teks yang cocok dengan pencarian.
                      </div>
                    ) : (
                      filteredChunks.map((chunk) => {
                        const isCited =
                          activeCitation &&
                          (activeCitation.chunkId === chunk.id ||
                            (activeCitation.page && activeCitation.page === chunk.page_number &&
                              activeCitation.snippet &&
                              chunk.content.includes(activeCitation.snippet.slice(0, 40))));

                        return (
                          <div
                            key={chunk.id}
                            ref={isCited ? activeChunkRef : null}
                            className={`p-3.5 rounded-xl text-xs leading-relaxed transition-all relative ${
                              isCited
                                ? 'bg-[#FEF3C7] border-l-4 border-[#C25127] border-y border-r border-[#E5E0D5] shadow-xs'
                                : 'bg-white border border-[#E5E0D5] hover:border-[#C25127]/40'
                            }`}
                          >
                            {/* Chunk Metadata Tag Header */}
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E0D5]/60 text-[11px] text-nalar-muted">
                              <div className="flex items-center gap-1.5 font-medium">
                                <span className="px-1.5 py-0.5 rounded bg-[#F3F0EA] font-mono text-[10px] text-nalar-text">
                                  Chunk #{chunk.chunk_index + 1}
                                </span>
                                {chunk.page_number && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#F3EAE2] text-[#A6421D] font-semibold border border-[#DFC9B8]/60">
                                    Halaman {chunk.page_number}
                                  </span>
                                )}
                                {chunk.sheet_name && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#F3F0EA] text-nalar-text font-semibold">
                                    Sheet: {chunk.sheet_name}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {isCited && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C25127] text-white">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Kutipan Aktif [{activeCitation?.marker}]
                                  </span>
                                )}
                                <button
                                  onClick={() => handleCopyChunk(chunk.id, chunk.content)}
                                  title="Salin teks bagian ini"
                                  className="p-1 rounded hover:bg-[#F3F0EA] text-nalar-muted hover:text-nalar-text transition cursor-pointer"
                                >
                                  {copiedChunkId === chunk.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Heading context if available */}
                            {chunk.heading_path && (
                              <p className="text-[11px] font-semibold text-primary/80 mb-1.5 italic">
                                {chunk.heading_path}
                              </p>
                            )}

                            {/* Chunk content with search highlight */}
                            <div className="text-foreground text-xs whitespace-pre-wrap font-sans selection:bg-amber-200 dark:selection:bg-amber-900">
                              {searchQuery ? (
                                highlightMatch(chunk.content, searchQuery)
                              ) : isCited && activeCitation?.snippet ? (
                                highlightCitationSnippet(chunk.content, activeCitation.snippet)
                              ) : (
                                chunk.content
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Helper to highlight search query inside chunk
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-300 dark:bg-yellow-600/70 text-foreground font-semibold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// Helper to highlight citation snippet text
function highlightCitationSnippet(content: string, snippet: string) {
  const cleanSnippet = snippet.replace(/\.\.\.$/, '').trim().slice(0, 60);
  if (!cleanSnippet || !content.toLowerCase().includes(cleanSnippet.toLowerCase())) {
    return content;
  }
  const regex = new RegExp(`(${escapeRegex(cleanSnippet)})`, 'i');
  const parts = content.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-300/80 dark:bg-amber-500/40 text-foreground font-semibold px-1 py-0.5 rounded border border-amber-500/40">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
