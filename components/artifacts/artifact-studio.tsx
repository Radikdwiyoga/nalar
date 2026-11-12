'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  HelpCircle,
  GraduationCap,
  Clock,
  ClipboardList,
  Sparkles,
  Loader2,
  Trash2,
  Calendar,
  ExternalLink,
  AlertCircle,
  FileCode2,
  Scale,
  Radio,
} from 'lucide-react';
import { Artifact, ArtifactKind, Source } from '@/lib/types';
import { ArtifactViewerModal } from './artifact-viewer-modal';
import { DocumentComparisonModal } from './document-comparison-modal';

interface ArtifactStudioProps {
  notebookId: string;
  readySourceCount: number;
  sources?: Source[];
}

interface GeneratorOption {
  kind: ArtifactKind;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeColor: string;
}

const GENERATOR_OPTIONS: GeneratorOption[] = [
  {
    kind: 'comparison',
    title: 'Matriks Komparasi Dokumen',
    desc: 'Bandingkan 2 atau lebih dokumen dalam tabel perbandingan aspek kunci, klausul & anggaran.',
    icon: Scale,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  {
    kind: 'audio_overview',
    title: 'Audio Overview (AI Podcast)',
    desc: 'Obrolan podcast 2 pembicara (Host & Analis) yang membahas intisari dokumen dengan suara alami.',
    icon: Radio,
    color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  },
  {
    kind: 'summary',
    title: 'Ringkasan Eksekutif',
    desc: '300–500 kata merangkum poin inti dan temuan utama dokumen.',
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  {
    kind: 'faq',
    title: 'Tanya Jawab (FAQ)',
    desc: '8–12 pasang pertanyaan & jawaban penting dari isi materi.',
    icon: HelpCircle,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  {
    kind: 'study_guide',
    title: 'Panduan Belajar',
    desc: 'Konsep kunci, glosarium istilah, dan soal latihan pemahaman.',
    icon: GraduationCap,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
  {
    kind: 'timeline',
    title: 'Kronologi / Linimasa',
    desc: 'Urutan kronologis waktu atau tahapan proses dalam dokumen.',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  {
    kind: 'briefing',
    title: 'Dokumen Briefing',
    desc: 'Tinjauan 1 halaman: latar belakang, implikasi & rekomendasi aksi.',
    icon: ClipboardList,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  },
];

export function ArtifactStudio({ notebookId, readySourceCount, sources = [] }: ArtifactStudioProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [generatingKind, setGeneratingKind] = useState<ArtifactKind | null>(null);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

  const fetchArtifacts = async () => {
    try {
      const res = await fetch(`/api/artifacts?notebookId=${notebookId}`);
      if (res.ok) {
        const json = await res.json();
        setArtifacts(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching artifacts:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchArtifacts();
  }, [notebookId]);

  const handleGenerate = async (
    kind: ArtifactKind,
    sourceIds?: string[],
    customPrompt?: string
  ) => {
    if (readySourceCount === 0) {
      setError('Unggah dan aktifkan minimal 1 dokumen sumber terlebih dahulu untuk menghasilkan dokumen.');
      return;
    }

    if (kind === 'comparison' && !sourceIds) {
      setComparisonModalOpen(true);
      return;
    }

    setGeneratingKind(kind);
    setError(null);

    try {
      const res = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebookId, kind, sourceIds, customPrompt }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || `Gagal menghasilkan artifact (${res.status})`);
      }

      const json = await res.json();
      if (json.data) {
        setArtifacts((prev) => [json.data, ...prev]);
        setActiveArtifact(json.data);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses artifact.');
    } finally {
      setGeneratingKind(null);
      setComparisonModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/artifacts?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setArtifacts((prev) => prev.filter((a) => a.id !== id));
      if (activeArtifact?.id === id) {
        setActiveArtifact(null);
      }
    } else {
      const errJson = await res.json().catch(() => null);
      alert(errJson?.error?.message || 'Gagal menghapus artifact');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Studio Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Studio & Dokumen Sintesis</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Hasilkan catatan komprehensif, ringkasan, atau panduan belajar dari materi dokumen aktif Anda dengan 1-klik.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Generator Options Grid */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Pilihan Pembuat Dokumen
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GENERATOR_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isGeneratingThis = generatingKind === opt.kind;
            const isAnyGenerating = generatingKind !== null;

            return (
              <div
                key={opt.kind}
                className="group relative flex flex-col justify-between p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all space-y-3"
              >
                <div className="space-y-2">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${opt.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {opt.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      {opt.desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerate(opt.kind)}
                  disabled={isAnyGenerating || readySourceCount === 0}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {isGeneratingThis ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyusun...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Buat Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Artifacts Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Dokumen Tersimpan ({artifacts.length})
          </h3>
        </div>

        {loadingList ? (
          <div className="py-12 flex justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : artifacts.length === 0 ? (
          <div className="p-8 border border-dashed rounded-2xl text-center space-y-3 bg-card/50">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <FileCode2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Belum Ada Dokumen Sintesis</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Pilih salah satu jenis di atas untuk merangkum atau menyusun panduan belajar dari dokumen Anda.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {artifacts.map((art) => {
              const matchedOption = GENERATOR_OPTIONS.find((o) => o.kind === art.kind);
              const badgeClass = matchedOption?.badgeColor || 'bg-muted text-muted-foreground';
              const Icon = matchedOption?.icon || FileText;

              const dateStr = new Date(art.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={art.id}
                  onClick={() => setActiveArtifact(art)}
                  className="p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
                        {matchedOption?.title || art.kind}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dateStr}
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                      {art.title}
                    </h4>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {art.content_md.slice(0, 160).replace(/[#*`_]/g, '')}...
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t text-xs">
                    <span className="text-primary font-medium flex items-center gap-1 group-hover:underline">
                      <span>Buka Catatan</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(art.id);
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Comparison Modal */}
      <DocumentComparisonModal
        isOpen={comparisonModalOpen}
        onClose={() => setComparisonModalOpen(false)}
        sources={sources}
        onGenerate={(selectedIds, customNote) => {
          handleGenerate('comparison', selectedIds, customNote);
        }}
        isGenerating={generatingKind === 'comparison'}
      />

      {/* Artifact Viewer Modal */}
      {activeArtifact && (
        <ArtifactViewerModal
          artifact={activeArtifact}
          onClose={() => setActiveArtifact(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

