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

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Notebook Saya</h1>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {notebooks.length} Ruang
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kumpulan ruang riset terisolasi untuk mengorganisir dokumen & tanya-jawab AI
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary/90 transition shadow-sm hover:shadow hover:scale-[1.01] active:scale-[0.99] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Notebook Baru</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      {!loading && notebooks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card p-3.5 sm:p-4 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Notebook</p>
              <p className="text-base sm:text-lg font-bold">{notebooks.length}</p>
            </div>
          </div>

          <div className="glass-card p-3.5 sm:p-4 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Dokumen Tersimpan</p>
              <p className="text-base sm:text-lg font-bold">{totalSourcesCount}</p>
            </div>
          </div>

          <div className="glass-card p-3.5 sm:p-4 rounded-xl hidden sm:flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Multi-Source AI</p>
              <p className="text-xs font-semibold text-emerald-600">Aktif & Siap</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Notebooks */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs">Memuat daftar notebook Anda...</p>
        </div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-16 sm:py-20 px-4 border-2 border-dashed rounded-3xl glass-card">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 shadow-xs">
            <FolderPlus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold mb-1">Belum Ada Notebook</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
            Mulai riset Anda dengan membuat notebook pertama untuk mengunggah PDF, Word, atau data Anda.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary/90 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Notebook Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {notebooks.map((nb) => (
            <Link
              key={nb.id}
              href={`/notebooks/${nb.id}`}
              className="group relative glass-card rounded-2xl p-5 hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(nb.id, e)}
                    title="Hapus Notebook"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-base sm:text-lg tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                  {nb.title}
                </h3>

                {nb.description ? (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {nb.description}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/60 italic">
                    Tidak ada deskripsi tambahan
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t mt-4 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-primary/70" />
                  {nb.sources_count || 0} sumber
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
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
