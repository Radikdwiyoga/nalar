'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Layers,
  MessageSquare,
  Sparkles,
  ArrowRight,
  FileText,
  Globe,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { Artifact, Source } from '@/lib/types';
import { ArtifactViewerModal } from '@/components/artifacts/artifact-viewer-modal';

interface PublicNotebookViewProps {
  notebookTitle: string;
  sources: Source[];
  artifacts: Artifact[];
  messages: any[];
}

export function PublicNotebookView({
  notebookTitle,
  sources,
  artifacts,
  messages,
}: PublicNotebookViewProps) {
  const [activeTab, setActiveTab] = useState<'artifacts' | 'chat' | 'sources'>('artifacts');
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-nalar-bg text-nalar-text">
      {/* Public Header */}
      <header className="border-b border-[#E5E0D5] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="p-1 rounded-xl bg-[#F3EAE2] border border-[#DFC9B8]/70">
              <Image
                src="/logo-icon.png"
                alt="Nalar"
                width={26}
                height={26}
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="font-serif font-bold text-base tracking-tight hidden sm:inline text-nalar-text">
              Nalar
            </span>
          </Link>

          <div className="h-4 w-px bg-[#E5E0D5] shrink-0 hidden sm:block" />

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-serif font-bold text-sm tracking-tight truncate max-w-[160px] sm:max-w-xs md:max-w-md text-nalar-text">
              {notebookTitle}
            </h1>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>Publik (Hanya Baca)</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/signup"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-nalar-accent text-white text-xs font-semibold hover:bg-nalar-accentHover transition-all shadow-xs"
          >
            <span>Mulai Gratis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="border-b border-[#E5E0D5] bg-[#F3F0EA]/80 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('artifacts')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'artifacts'
                ? 'border-[#C25127] text-[#C25127] font-semibold'
                : 'border-transparent text-nalar-muted hover:text-nalar-text'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dokumen Sintesis ({artifacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'chat'
                ? 'border-[#C25127] text-[#C25127] font-semibold'
                : 'border-transparent text-nalar-muted hover:text-nalar-text'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Riwayat Tanya Jawab ({messages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'sources'
                ? 'border-[#C25127] text-[#C25127] font-semibold'
                : 'border-transparent text-nalar-muted hover:text-nalar-text'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sumber Dokumen ({sources.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 overflow-y-auto">
        {/* Tab 1: Artifacts / Synthesis */}
        {activeTab === 'artifacts' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-serif font-bold tracking-tight text-nalar-text">
                Dokumen Sintesis & Ringkasan
              </h2>
              <p className="text-xs text-nalar-muted">
                Dokumen hasil sintesis AI dari materi riset ini. Klik kartu untuk membaca lengkap atau mengunduh dalam format Word (.docx) / Markdown.
              </p>
            </div>

            {artifacts.length === 0 ? (
              <div className="p-8 border border-dashed border-[#DFC9B8] rounded-2xl bg-white/60 text-center text-xs text-nalar-muted">
                Belum ada dokumen sintesis yang dibuat dalam notebook ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artifacts.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArtifact(art)}
                    className="p-5 rounded-2xl border border-[#E5E0D5] bg-white hover:border-[#C25127] hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-nalar-muted">
                        <span className="font-semibold px-2.5 py-0.5 rounded-full bg-[#F3EAE2] text-[#A6421D] border border-[#DFC9B8] capitalize">
                          {art.kind.replace('_', ' ')}
                        </span>
                        <span className="font-mono">{new Date(art.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                      <h3 className="font-serif font-bold text-sm sm:text-base text-nalar-text group-hover:text-[#C25127] transition-colors line-clamp-1">
                        {art.title}
                      </h3>
                      <p className="text-xs text-nalar-muted line-clamp-3 leading-relaxed">
                        {art.content_md.slice(0, 180).replace(/[#*`_]/g, '')}...
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#E5E0D5]/70 text-xs text-[#C25127] font-semibold">
                      <span className="flex items-center gap-1 group-hover:underline">
                        <span>Baca & Unduh Dokumen</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Chat History (Rendered Markdown) */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-serif font-bold tracking-tight text-nalar-text">
                Riwayat Percakapan AI
              </h2>
              <p className="text-xs text-nalar-muted">
                Tanya-jawab berbasis fakta dokumen sumber dengan sitasi halaman asli.
              </p>
            </div>

            {messages.length === 0 ? (
              <div className="p-8 border border-dashed border-[#DFC9B8] rounded-2xl bg-white/60 text-center text-xs text-nalar-muted">
                Belum ada percakapan dalam notebook ini.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id || idx}
                      className={`flex gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-lg bg-[#F3EAE2] text-[#C25127] border border-[#DFC9B8] flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[90%] sm:max-w-[85%] leading-relaxed ${
                          isUser
                            ? 'bg-nalar-accent text-white rounded-2xl rounded-tr-sm px-4 py-3 font-medium shadow-xs'
                            : 'bg-white border border-[#E5E0D5] rounded-2xl rounded-tl-sm p-5 shadow-2xs text-nalar-text'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap text-xs sm:text-sm">{m.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none text-nalar-text">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Sources */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-serif font-bold tracking-tight text-nalar-text">
                Dokumen Sumber
              </h2>
              <p className="text-xs text-nalar-muted">
                Berkas rujukan yang digunakan sebagai landasan pengetahuan notebook ini.
              </p>
            </div>

            <div className="space-y-2.5">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className="p-4 rounded-2xl border border-[#E5E0D5] bg-white flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#F3EAE2] text-[#C25127] border border-[#DFC9B8] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-nalar-text truncate">{src.file_name}</p>
                      <p className="text-[11px] text-nalar-muted font-mono">
                        {(src.file_size / (1024 * 1024)).toFixed(2)} MB • {src.chunk_count} chunk
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Siap
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Artifact Modal Viewer */}
      {selectedArtifact && (
        <ArtifactViewerModal
          artifact={selectedArtifact}
          onClose={() => setSelectedArtifact(null)}
        />
      )}
    </div>
  );
}
