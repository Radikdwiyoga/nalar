'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Clock, FileText, Trash2, Loader2, FolderPlus, Sparkles, Layers } from 'lucide-react';
import { Notebook } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const totalSourcesCount = notebooks.reduce((acc, n) => acc + (n.sources_count || 0), 0);
  const totalArtifactsCount = notebooks.reduce((acc: number, n: any) => acc + (n.artifacts_count || 0), 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 bg-nalar-bg text-nalar-text">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E0D5] pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-nalar-text">
              Notebook Saya
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F3EAE2] text-[#A6421D] border border-[#DFC9B8] text-xs font-semibold">
              {notebooks.length} Ruang
            </span>
          </div>
          <p className="text-xs sm:text-sm text-nalar-muted mt-1">
            Kumpulan ruang riset terisolasi untuk mengorganisir dokumen & tanya-jawab AI
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-nalar-accent text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-nalar-accentHover transition shadow-xs hover:shadow self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Notebook Baru</span>
        </button>
      </div>

      {/* Summary KPI Badges (Compact & Refined) */}
      {!loading && notebooks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 rounded-xl border border-[#E5E0D5] bg-white flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#F3EAE2] text-[#C25127] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-nalar-muted font-medium">Total Notebook</p>
              <p className="text-base sm:text-lg font-bold text-nalar-text">{notebooks.length}</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl border border-[#E5E0D5] bg-white flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#F3EAE2] text-[#C25127] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-nalar-muted font-medium">Dokumen Tersimpan</p>
              <p className="text-base sm:text-lg font-bold text-nalar-text">{totalSourcesCount}</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl border border-[#E5E0D5] bg-white hidden sm:flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-nalar-muted font-medium">Multi-Source AI & RAG</p>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {totalArtifactsCount} Catatan Studio Aktif
              </p>
            </div>
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
        <div className="text-center py-16 sm:py-20 px-4 border-2 border-dashed border-[#E5E0D5] rounded-3xl bg-white shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-[#F3EAE2] text-[#C25127] flex items-center justify-center mx-auto mb-4 shadow-2xs">
            <FolderPlus className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-lg text-nalar-text mb-1">Belum Ada Notebook</h3>
          <p className="text-xs sm:text-sm text-nalar-muted max-w-sm mx-auto mb-6 leading-relaxed">
            Mulai riset Anda dengan membuat notebook pertama untuk mengunggah PDF, Word, atau berkas kontrak kerja Anda.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-nalar-accent text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-nalar-accentHover transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Notebook Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {notebooks.map((nb: any) => (
            <Link
              key={nb.id}
              href={`/notebooks/${nb.id}`}
              className="group relative bg-white border border-[#E5E0D5] rounded-2xl p-5 hover:border-[#C25127] hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#F3EAE2] text-[#C25127] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(nb.id, e)}
                    title="Hapus Notebook"
                    className="p-1.5 rounded-lg text-nalar-muted hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg tracking-tight text-nalar-text group-hover:text-[#C25127] transition-colors line-clamp-1">
                    {nb.title}
                  </h3>
                  {nb.description ? (
                    <p className="text-xs text-nalar-muted line-clamp-2 leading-relaxed mt-1">
                      {nb.description}
                    </p>
                  ) : (
                    <p className="text-xs text-nalar-muted/60 italic mt-1">
                      Ruang analisis dokumen terisolasi
                    </p>
                  )}
                </div>

                {/* Document Preview Chips */}
                {nb.preview_sources && nb.preview_sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {nb.preview_sources.map((name: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3F0EA] text-[#6E6A61] text-[10px] font-medium truncate max-w-[140px] border border-[#E5E0D5]/70"
                      >
                        <FileText className="w-2.5 h-2.5 text-nalar-accent shrink-0" />
                        <span className="truncate">{name}</span>
                      </span>
                    ))}
                    {nb.sources_count > nb.preview_sources.length && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#F3EAE2] text-[#A6421D] text-[10px] font-semibold border border-[#DFC9B8]">
                        +{nb.sources_count - nb.preview_sources.length} lainnya
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E5E0D5]/60 text-[11px] text-nalar-muted">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <FileText className="w-3.5 h-3.5 text-nalar-accent" />
                    {nb.sources_count || 0} berkas
                  </span>
                  {nb.artifacts_count > 0 && (
                    <span className="text-nalar-muted/70">
                      · {nb.artifacts_count} catatan
                    </span>
                  )}
                </div>

                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(nb.updated_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in-0">
          <div className="w-full max-w-md glass-card border rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div>
              <h2 className="text-lg font-bold">Buat Notebook Baru</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Beri nama ruang proyek atau topik riset dokumen Anda.
              </p>
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-xl border border-destructive/20">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" htmlFor="title">
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
                  placeholder="Contoh: Analisis SPK & Pengadaan 2026"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold" htmlFor="desc">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  id="desc"
                  rows={3}
                  maxLength={500}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Catatan tambahan mengenai ruang notebook ini..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition shadow-sm cursor-pointer"
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
