'use client';

import React, { useState } from 'react';
import { X, Link as LinkIcon, Loader2, AlertCircle, CheckCircle2, Globe, FileSpreadsheet, FileText } from 'lucide-react';

interface UrlInputModalProps {
  notebookId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export function UrlInputModal({
  notebookId,
  isOpen,
  onClose,
  onUploaded,
}: UrlInputModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal mengambil dokumen dari URL');
      }

      const newSource = json.data;

      // Trigger ingestion immediately
      if (newSource && newSource.id) {
        fetch(`/api/sources/${newSource.id}/ingest`, { method: 'POST' }).catch((e) =>
          console.error('Trigger ingest error:', e)
        );
      }

      onUploaded();
      setUrl('');
      setTitle('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses tautan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div
        className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Tambah dari Link / Google Drive</h3>
              <p className="text-xs text-muted-foreground">
                Ambil dokumen dari Google Drive, Docs, Sheets, atau artikel web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90" htmlFor="doc-url">
              Tautan Dokumen / URL Web <span className="text-destructive">*</span>
            </label>
            <input
              id="doc-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/... atau https://..."
              className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90" htmlFor="doc-title">
              Judul Dokumen (Opsional)
            </label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Biarkan kosong untuk judul otomatis"
              className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* Supported Format Badges & Guide */}
          <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-2 text-muted-foreground">
            <span className="font-semibold text-foreground text-[11px] block">
              Format Tautan yang Didukung:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Google Drive (PDF/Word)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
                <span>Google Sheets & Docs</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <Globe className="w-3.5 h-3.5 text-purple-500" />
                <span>Artikel Web / Berita / Wikipedia</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground pt-1 border-t leading-tight">
              ⚠️ <strong>Penting:</strong> Untuk file Google Drive, pastikan setelan akses diatur ke <em>"Siapa saja yang memiliki link" (Anyone with the link)</em>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border text-xs font-medium hover:bg-muted transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunduh Dokumen...</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Ambil Dokumen</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

