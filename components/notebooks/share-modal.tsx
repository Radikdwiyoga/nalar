'use client';

import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, ExternalLink, Globe, Lock, Loader2 } from 'lucide-react';

interface ShareModalProps {
  notebookId: string;
  notebookTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({
  notebookId,
  notebookTitle,
  isOpen,
  onClose,
}: ShareModalProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    fetch(`/api/notebooks/${notebookId}/share`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setIsPublic(json.data.isPublic);
          setShareUrl(json.data.shareUrl);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [notebookId, isOpen]);

  if (!isOpen) return null;

  const handleToggle = async (checked: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: checked }),
      });
      const json = await res.json();
      if (json.data) {
        setIsPublic(json.data.isPublic);
        setShareUrl(json.data.shareUrl);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah pengaturan berbagi');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div
        className="w-full max-w-md bg-card rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Bagikan Notebook</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                {notebookTitle}
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {loading ? (
            <div className="py-8 flex justify-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Access Toggle Box */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isPublic
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">
                      {isPublic ? 'Akses Publik Aktif' : 'Privat (Hanya Anda)'}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      {isPublic
                        ? 'Siapa saja yang memiliki tautan ini dapat melihat isi notebook.'
                        : 'Hanya Anda yang dapat mengakses dan melihat isi notebook ini.'}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    disabled={saving}
                    onChange={(e) => handleToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Share Link Box */}
              {isPublic && (
                <div className="space-y-2 animate-in fade-in-50 duration-200">
                  <label className="text-xs font-semibold text-foreground/90 block">
                    Tautan Publik
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-muted/50 font-mono text-muted-foreground select-all focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Buka Pratinjau Tautan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                    ℹ️ Pengunjung dapat membaca dokumen sumber, ringkasan artifact, dan riwayat tanya jawab dalam mode <strong>hanya baca</strong>. Mereka tidak dapat mengedit atau menghapus data Anda.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-xs font-medium hover:bg-muted transition-colors"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

