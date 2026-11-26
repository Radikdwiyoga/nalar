'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  BookOpen,
  Clock,
  FileText,
  Trash2,
  Loader2,
  FolderPlus,
  Sparkles,
  Layers,
  Search,
  ArrowUpRight,
  FileSpreadsheet,
} from 'lucide-react';
import { Notebook } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CARD_THEMES = [
  {
    bar: 'from-[#C25127] via-[#D97736] to-[#E59866]',
    badgeBg: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
  },
  {
    bar: 'from-emerald-600 via-teal-500 to-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
  {
    bar: 'from-indigo-600 via-blue-500 to-sky-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
  },
  {
    bar: 'from-amber-600 via-yellow-500 to-orange-400',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  },
  {
    bar: 'from-rose-600 via-pink-500 to-orange-400',
    badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  },
];

function getThemeById(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return CARD_THEMES[hash % CARD_THEMES.length];
}

function getFileBadgeColor(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'text-rose-600 dark:text-rose-400';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv'))
    return 'text-emerald-600 dark:text-emerald-400';
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'text-blue-600 dark:text-blue-400';
  return 'text-nalar-accent';
}

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'sources' | 'alpha'>('recent');
  const [greeting, setGreeting] = useState('Ruang Riset Anda');

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 11) setGreeting('Selamat Pagi');
    else if (hr < 15) setGreeting('Selamat Siang');
    else if (hr < 19) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');
  }, []);

  const fetchNotebooks = async () => {
    try {
      const res = await fetch('/api/notebooks');
      if (res.ok) {
        const json = await res.json();
        setNotebooks(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || undefined }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Gagal membuat notebook');
      } else {
        setIsModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        fetchNotebooks();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membuat notebook');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Yakin ingin menghapus notebook ini beserta seluruh sumbernya?')) return;

    try {
      const res = await fetch(`/api/notebooks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotebooks((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotebooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? notebooks.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            (n.description && n.description.toLowerCase().includes(q))
        )
      : [...notebooks];

    if (sortBy === 'sources') {
      list.sort((a, b) => (b.sources_count || 0) - (a.sources_count || 0));
    } else if (sortBy === 'alpha') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'id'));
    } else {
      list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    return list;
  }, [notebooks, searchQuery, sortBy]);

  const totalSourcesCount = notebooks.reduce((acc, n) => acc + (n.sources_count || 0), 0);
  const totalArtifactsCount = notebooks.reduce((acc: number, n: any) => acc + (n.artifacts_count || 0), 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6 bg-nalar-bg text-nalar-text">
      {/* Editorial Hero Header Banner */}
      <div className="floating-island rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute inset-0 ambient-mesh pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-nalar-accent block">
              {greeting} • Ruang Kerja Terisolasi
            </span>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-nalar-text">
                Koleksi Notebook Riset
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-nalar-citationBg text-nalar-accent border border-nalar-citationBorder text-xs font-semibold">
                {notebooks.length} Ruang
              </span>
            </div>
            <p className="text-xs sm:text-sm text-nalar-muted max-w-xl">
              Organisir kontrak, laporan teknis, dan dokumen proyek ke dalam ruang analisis mandiri dengan sitasi halaman akurat.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-nalar-accent text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-nalar-accentHover transition shadow-xs hover:scale-[1.01] active:scale-[0.99] self-start sm:self-auto cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Notebook Baru</span>
          </button>
        </div>

        {/* Summary KPI Strip inside Hero */}
        {!loading && notebooks.length > 0 && (
          <div className="relative z-10 grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-nalar-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-nalar-citationBg text-nalar-accent flex items-center justify-center shrink-0 border border-nalar-citationBorder">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] text-nalar-muted">Ruang Aktif</p>
                <p className="text-sm sm:text-base font-bold font-mono text-nalar-text">{notebooks.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-nalar-citationBg text-nalar-accent flex items-center justify-center shrink-0 border border-nalar-citationBorder">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] text-nalar-muted">Total Berkas</p>
                <p className="text-sm sm:text-base font-bold font-mono text-nalar-text">{totalSourcesCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] text-nalar-muted">Hasil Sintesis</p>
                <p className="text-sm sm:text-base font-bold font-mono text-nalar-text">{totalArtifactsCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search & Sort Toolbar */}
      {!loading && notebooks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="notebook-search" className="sr-only">
              Cari notebook
            </label>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-nalar-muted" />
            <input
              id="notebook-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul atau deskripsi notebook..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-nalar-border bg-nalar-card text-xs text-nalar-text placeholder:text-nalar-muted focus:outline-none focus:ring-2 focus:ring-nalar-accent/30 focus:border-nalar-accent transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nalar-muted hover:text-nalar-text text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-nalar-surface p-1 rounded-xl border border-nalar-border text-xs self-start sm:self-auto">
            {[
              { id: 'recent' as const, label: 'Terbaru' },
              { id: 'sources' as const, label: 'Terbanyak Berkas' },
              { id: 'alpha' as const, label: 'A–Z' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSortBy(opt.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  sortBy === opt.id
                    ? 'bg-nalar-card text-nalar-text shadow-2xs font-semibold'
                    : 'text-nalar-muted hover:text-nalar-text'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Notebooks */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-nalar-muted gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-nalar-accent" />
          <p className="text-xs">Memuat daftar notebook Anda...</p>
        </div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-16 sm:py-20 px-4 border-2 border-dashed border-nalar-border rounded-3xl floating-island">
          <div className="w-16 h-16 rounded-2xl bg-nalar-citationBg text-nalar-accent border border-nalar-citationBorder flex items-center justify-center mx-auto mb-4 shadow-2xs">
            <FolderPlus className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-lg text-nalar-text mb-1">Belum Ada Notebook</h3>
          <p className="text-xs sm:text-sm text-nalar-muted max-w-sm mx-auto mb-6 leading-relaxed">
            Mulai riset Anda dengan membuat notebook pertama untuk mengunggah PDF, Word, Excel, atau berkas kontrak kerja Anda.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-nalar-accent text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-nalar-accentHover transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Notebook Pertama</span>
          </button>
        </div>
      ) : filteredNotebooks.length === 0 ? (
        <div className="text-center py-14 rounded-2xl border border-dashed border-nalar-border bg-nalar-card/50 text-xs text-nalar-muted">
          Tidak ditemukan notebook yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredNotebooks.map((nb: any) => {
            const theme = getThemeById(nb.id);
            return (
              <Link
                key={nb.id}
                href={`/notebooks/${nb.id}`}
                className="group relative floating-island rounded-2xl overflow-hidden hover:border-nalar-accent hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                {/* Distinctive Top Color Accent Ribbon */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${theme.bar}`} />

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform ${theme.badgeBg}`}>
                        <BookOpen className="w-4 h-4" />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="p-1.5 rounded-lg text-nalar-muted group-hover:text-nalar-accent transition-colors">
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                        <button
                          onClick={(e) => handleDelete(nb.id, e)}
                          title="Hapus Notebook"
                          className="p-1.5 rounded-lg text-nalar-muted hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-base sm:text-lg tracking-tight text-nalar-text group-hover:text-nalar-accent transition-colors line-clamp-1">
                        {nb.title}
                      </h3>
                      {nb.description ? (
                        <p className="text-xs text-nalar-muted line-clamp-2 leading-relaxed mt-1">
                          {nb.description}
                        </p>
                      ) : (
                        <p className="text-xs text-nalar-muted/70 italic mt-1">
                          Ruang analisis dokumen terisolasi
                        </p>
                      )}
                    </div>

                    {/* Colored Document Preview Chips */}
                    {nb.preview_sources && nb.preview_sources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {nb.preview_sources.map((name: string, i: number) => {
                          const isSheet = /\.(xlsx|xls|csv)$/i.test(name);
                          const FileIcon = isSheet ? FileSpreadsheet : FileText;
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-nalar-surface text-nalar-muted text-[10px] font-medium truncate max-w-[145px] border border-nalar-border"
                            >
                              <FileIcon className={`w-2.5 h-2.5 shrink-0 ${getFileBadgeColor(name)}`} />
                              <span className="truncate">{name}</span>
                            </span>
                          );
                        })}
                        {nb.sources_count > nb.preview_sources.length && (
                          <span className="px-1.5 py-0.5 rounded-md bg-nalar-citationBg text-nalar-accent text-[10px] font-semibold border border-nalar-citationBorder">
                            +{nb.sources_count - nb.preview_sources.length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-nalar-border/70 text-[11px] text-nalar-muted">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-semibold text-nalar-text">
                        <FileText className="w-3.5 h-3.5 text-nalar-accent" />
                        {nb.sources_count || 0} berkas
                      </span>
                      {nb.artifacts_count > 0 && (
                        <span>· {nb.artifacts_count} sintesis</span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                      <Clock className="w-3 h-3" />
                      {new Date(nb.updated_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="w-full max-w-md floating-island rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div>
              <h2 className="text-lg font-serif font-bold text-nalar-text">Buat Ruang Notebook Baru</h2>
              <p className="text-xs text-nalar-muted mt-1">
                Beri nama proyek atau topik riset dokumen Anda.
              </p>
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-xl border border-destructive/20">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-nalar-text" htmlFor="title">
                  Judul Notebook
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  autoFocus
                  maxLength={100}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Evaluasi Kontrak & RAB 2026"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-nalar-border bg-nalar-bg text-nalar-text focus:outline-none focus:ring-2 focus:ring-nalar-accent/30 focus:border-nalar-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-nalar-text" htmlFor="desc">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  id="desc"
                  rows={3}
                  maxLength={500}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Catatan konteks proyek atau ruang lingkup..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-nalar-border bg-nalar-bg text-nalar-text focus:outline-none focus:ring-2 focus:ring-nalar-accent/30 focus:border-nalar-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-nalar-border hover:bg-nalar-surface text-xs font-medium text-nalar-muted hover:text-nalar-text transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="inline-flex items-center gap-1.5 bg-nalar-accent text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-nalar-accentHover disabled:opacity-50 transition shadow-xs cursor-pointer"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{creating ? 'Membuat...' : 'Buat Notebook'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
