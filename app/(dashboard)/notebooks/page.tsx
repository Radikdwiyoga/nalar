'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Clock, FileText, Trash2, Loader2, FolderPlus } from 'lucide-react';
import { Notebook } from '@/lib/types';

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

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notebook Saya</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kumpulan ruang riset terisolasi untuk mengorganisir dokumen & tanya-jawab AI
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Notebook Baru</span>
        </button>
      </div>

      {/* Grid of Notebooks */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-20 px-4 border-2 border-dashed rounded-2xl bg-muted/20">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <FolderPlus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Belum ada Notebook</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Mulai riset Anda dengan membuat notebook pertama untuk mengunggah PDF, Word, atau data Anda.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Notebook Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.map((nb) => (
            <Link
              key={nb.id}
              href={`/notebooks/${nb.id}`}
              className="group relative bg-card border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(nb.id, e)}
                    title="Hapus Notebook"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                  {nb.title}
                </h3>
                {nb.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {nb.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 border-t mt-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {nb.sources_count || 0} sumber
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(nb.updated_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in-0 zoom-in-95">
            <div>
              <h2 className="text-lg font-bold">Buat Notebook Baru</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Beri nama ruang proyek atau topik riset dokumen Anda.
              </p>
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
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
                  placeholder="Contoh: Analisis Laporan Keuangan 2024"
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
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
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={creating}
                  className="px-4 py-2 rounded-lg text-xs font-medium border hover:bg-muted transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Buat Notebook</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
