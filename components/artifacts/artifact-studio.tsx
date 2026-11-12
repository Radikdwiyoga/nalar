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
  CheckCircle2,
  ListTodo,
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
  badge?: string;
  badgeColor?: string;
}

// 1. Fitur Interaktif & Lanjutan (2 Kolom Penuh: 50% - 50%)
const FEATURED_OPTIONS: GeneratorOption[] = [
  {
    kind: 'comparison',
    title: 'Matriks Komparasi Dokumen',
    desc: 'Bandingkan 2 atau lebih dokumen dalam tabel perbandingan aspek kunci, klausul kontrak, dan rincian biaya.',
    icon: Scale,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900',
    badge: 'Analisis Komparatif',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  },
  {
    kind: 'audio_overview',
    title: 'Audio Overview (AI Podcast)',
    desc: 'Obrolan podcast interaktif 2 pembicara (Host & Analis) yang membahas intisari dokumen dengan suara alami.',
    icon: Radio,
    color: 'text-[#C25127] bg-[#F3EAE2] border-[#DFC9B8]',
    badge: 'Dual Speaker TTS',
    badgeColor: 'bg-[#F3EAE2] text-[#A6421D] border border-[#DFC9B8]',
  },
];

// 2. Dokumen Sintesis & Laporan (Grid 3 Kolom Sempurna: 2 baris x 3 kolom = 6 kartu)
const SYNTHESIS_OPTIONS: GeneratorOption[] = [
  {
    kind: 'summary',
    title: 'Ringkasan Eksekutif',
    desc: 'Rangkuman komprehensif 300–500 kata yang menyorot temuan utama dan konteks dokumen.',
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900',
    badge: 'Intisari Dokumen',
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  },
  {
    kind: 'briefing',
    title: 'Dokumen Briefing Eksekutif',
    desc: 'Laporan ringkas 1 halaman: latar belakang masalah, data kunci, implikasi, dan rekomendasi.',
    icon: ClipboardList,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900',
    badge: 'Format Eksekutif',
    badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  },
  {
    kind: 'faq',
    title: 'Tanya Jawab (FAQ)',
    desc: 'Daftar 8–12 pertanyaan mendasar dan jawaban mendalam berdasarkan materi dokumen sumber.',
    icon: HelpCircle,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900',
    badge: 'Q&A Kunci',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
  },
  {
    kind: 'study_guide',
    title: 'Panduan Belajar',
    desc: 'Konsep kunci, glosarium istilah teknis, ringkasan per bagian, dan pertanyaan latihan materi.',
    icon: GraduationCap,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900',
    badge: 'Panduan Materi',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  },
  {
    kind: 'timeline',
    title: 'Kronologi / Linimasa',
    desc: 'Ekstraksi urutan kejadian waktu, milestone penting, atau tahapan alur proses yang tercatat.',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900',
    badge: 'Urutan Waktu',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  },
  {
    kind: 'action_items',
    title: 'Rekomendasi & Tindak Lanjut',
    desc: 'Daftar langkah aksi konkret, pemetaan mitigasi risiko, penanggung jawab, dan prioritas implementasi.',
    icon: ListTodo,
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-900',
    badge: 'Langkah Aksi',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  },
];

const ALL_OPTIONS = [...FEATURED_OPTIONS, ...SYNTHESIS_OPTIONS];

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
          <div className="w-8 h-8 rounded-lg bg-[#F3EAE2] text-[#C25127] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-nalar-text">Studio & Dokumen Sintesis</h2>
        </div>
        <p className="text-xs sm:text-sm text-nalar-muted">
          Hasilkan catatan komprehensif, ringkasan eksekutif, atau panduan belajar dari materi dokumen aktif Anda dengan 1-klik.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Fitur Interaktif & Lanjutan (2 Kolom Seimbang) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C25127]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-nalar-text">
              Fitur Interaktif & Lanjutan
            </h3>
          </div>
          <span className="text-[11px] text-nalar-muted font-medium">2 Alat Interaktif</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURED_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isGeneratingThis = generatingKind === opt.kind;
            const isAnyGenerating = generatingKind !== null;

            return (
              <div
                key={opt.kind}
                onClick={() => {
                  if (!isAnyGenerating && readySourceCount > 0) {
                    handleGenerate(opt.kind);
                  }
                }}
                className={`group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl border border-[#E5E0D5] bg-white hover:border-[#C25127] hover:shadow-md transition-all duration-200 cursor-pointer min-h-[160px] ${
                  isAnyGenerating || readySourceCount === 0 ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${opt.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      {isGeneratingThis ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C25127] animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Memproses...
                        </span>
                      ) : (
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-base text-nalar-text group-hover:text-[#C25127] transition-colors">
                      {opt.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-nalar-muted leading-relaxed mt-1">
                      {opt.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3.5 mt-4 border-t border-[#E5E0D5]/70 flex items-center justify-between text-xs font-semibold text-nalar-muted group-hover:text-[#C25127] transition-colors">
                  <span>{opt.kind === 'comparison' ? 'Buka Matriks Komparasi' : 'Putar Audio Podcast'}</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Dokumen Sintesis & Laporan (Grid 3x2 Sempurna & Rapi: 6 Kartu) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3D3A37]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-nalar-text">
              Dokumen Sintesis & Laporan
            </h3>
          </div>
          <span className="text-[11px] text-nalar-muted font-medium">6 Format 1-Klik</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYNTHESIS_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isGeneratingThis = generatingKind === opt.kind;
            const isAnyGenerating = generatingKind !== null;

            return (
              <div
                key={opt.kind}
                onClick={() => {
                  if (!isAnyGenerating && readySourceCount > 0) {
                    handleGenerate(opt.kind);
                  }
                }}
                className={`group relative flex flex-col justify-between p-5 rounded-2xl border border-[#E5E0D5] bg-white hover:border-[#C25127] hover:shadow-md transition-all duration-200 cursor-pointer min-h-[175px] ${
                  isAnyGenerating || readySourceCount === 0 ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${opt.color}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    {isGeneratingThis ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C25127] animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Menyusun...
                      </span>
                    ) : (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${opt.badgeColor}`}>
                        {opt.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-sm text-nalar-text group-hover:text-[#C25127] transition-colors line-clamp-1">
                      {opt.title}
                    </h4>
                    <p className="text-xs text-nalar-muted leading-relaxed mt-1 line-clamp-2">
                      {opt.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#E5E0D5]/70 flex items-center justify-between text-xs font-semibold text-nalar-muted group-hover:text-[#C25127] transition-colors">
                  <span>Buat dengan 1-Klik</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Artifacts Section */}
      <div className="space-y-3 pt-4">
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
          <div className="p-8 border border-dashed border-[#DFC9B8] rounded-2xl text-center space-y-3 bg-[#FAF8F5]/50">
            <div className="w-12 h-12 rounded-2xl bg-[#F3EAE2] text-[#A6421D] flex items-center justify-center mx-auto">
              <FileCode2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold font-serif text-nalar-text">Belum Ada Dokumen Sintesis</p>
              <p className="text-xs text-nalar-muted max-w-sm mx-auto">
                Pilih salah satu format di atas untuk merangkum, mengekstrak linimasa, atau menyusun laporan dari dokumen Anda.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artifacts.map((art) => {
              const matchedOption = ALL_OPTIONS.find((o) => o.kind === art.kind);
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
                  className="p-5 rounded-2xl border border-[#E5E0D5] bg-white hover:border-[#C25127] hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
                        {matchedOption?.title || art.kind}
                      </span>
                      <span className="text-[11px] text-nalar-muted flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {dateStr}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-sm text-nalar-text group-hover:text-[#C25127] transition-colors line-clamp-1">
                      {art.title}
                    </h4>

                    <p className="text-xs text-nalar-muted line-clamp-2 leading-relaxed">
                      {art.content_md.slice(0, 160).replace(/[#*`_]/g, '')}...
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E5E0D5]/70 text-xs">
                    <span className="text-[#C25127] font-semibold flex items-center gap-1 group-hover:underline">
                      <span>Buka Catatan</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(art.id);
                      }}
                      className="p-1.5 text-nalar-muted hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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

