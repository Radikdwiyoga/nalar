'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Layers,
  MessageSquare,
  Sparkles,
  ArrowRight,
  FileText,
  Calendar,
  Globe,
  Download,
  ExternalLink,
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Public Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-30 px-4 h-15 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo-icon.png"
              alt="Nalar"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-base tracking-tight hidden sm:inline">Nalar</span>
          </Link>

          <div className="h-4 w-px bg-border shrink-0 hidden sm:block" />

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-bold text-sm tracking-tight truncate max-w-[160px] sm:max-w-xs md:max-w-md">
              {notebookTitle}
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>Publik (Hanya Baca)</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/signup"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <span>Mulai Gratis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="border-b bg-card/50 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('artifacts')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'artifacts'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dokumen Sintesis ({artifacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Riwayat Tanya Jawab ({messages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'sources'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
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
              <h2 className="text-lg font-bold tracking-tight">Dokumen Sintesis & Ringkasan</h2>
              <p className="text-xs text-muted-foreground">
                Dokumen hasil sintesis AI dari materi riset ini. Klik kartu untuk membaca lengkap atau mengunduh dalam format Word/Markdown.
              </p>
            </div>

            {artifacts.length === 0 ? (
              <div className="p-8 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
                Belum ada dokumen sintesis yang dibuat dalam notebook ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {artifacts.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArtifact(art)}
                    className="p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                          {art.kind}
                        </span>
                        <span>{new Date(art.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                        {art.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {art.content_md.slice(0, 180).replace(/[#*`_]/g, '')}...
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-xs text-primary font-medium">
                      <span className="flex items-center gap-1 group-hover:underline">
                        <span>Baca Lengkap</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Chat History */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Riwayat Percakapan AI</h2>
              <p className="text-xs text-muted-foreground">
                Tanya-jawab berbasis fakta dokumen sumber dengan sitasi akurat.
              </p>
            </div>

            {messages.length === 0 ? (
              <div className="p-8 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
                Belum ada percakapan dalam notebook ini.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'bg-card border shadow-2xs text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Sources */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Dokumen Sumber</h2>
              <p className="text-xs text-muted-foreground">
                File rujukan yang digunakan sebagai landasan pengetahuan notebook ini.
              </p>
            </div>

            <div className="space-y-2">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className="p-3.5 rounded-xl border bg-card flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{src.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(src.file_size / (1024 * 1024)).toFixed(2)} MB • {src.chunk_count} chunk
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
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

