'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Copy, Check, Download, Trash2, Sparkles, Calendar, Cpu, FileText, Loader2 } from 'lucide-react';
import { Artifact, ArtifactKind } from '@/lib/types';
import { AudioPodcastPlayer } from './audio-podcast-player';

interface ArtifactViewerModalProps {
  artifact: Artifact | null;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
}

const KIND_LABELS: Record<ArtifactKind, { label: string; color: string }> = {
  summary: { label: 'Ringkasan Eksekutif', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  faq: { label: 'Tanya Jawab (FAQ)', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  study_guide: { label: 'Panduan Belajar', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  timeline: { label: 'Kronologi / Linimasa', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  briefing: { label: 'Dokumen Briefing', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  action_items: { label: 'Rekomendasi & Tindak Lanjut', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300' },
  comparison: { label: 'Matriks Komparasi', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  audio_overview: { label: 'AI Podcast Diskusi', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
};

export function ArtifactViewerModal({
  artifact,
  onClose,
  onDelete,
}: ArtifactViewerModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!artifact) return null;

  const kindInfo = KIND_LABELS[artifact.kind] || {
    label: artifact.kind,
    color: 'bg-muted text-muted-foreground',
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content_md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  const handleDownloadMd = () => {
    const blob = new Blob([artifact.content_md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = artifact.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    a.href = url;
    a.download = `${safeTitle || 'dokumen-sintesis'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    try {
      const { markdownToDocxBlob } = await import('@/lib/export/docx');
      const blob = await markdownToDocxBlob(artifact.title, artifact.content_md);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeTitle = artifact.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      a.href = url;
      a.download = `${safeTitle || 'dokumen-sintesis'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export docx:', err);
      alert('Gagal mengekspor file Word');
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Apakah Anda yakin ingin menghapus artifact ini?')) return;
    setDeleting(true);
    try {
      await onDelete(artifact.id);
      onClose();
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  const formattedDate = new Date(artifact.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-card rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b flex items-start justify-between gap-4 bg-muted/20 shrink-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${kindInfo.color}`}>
                {kindInfo.label}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              {artifact.provider && (
                <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {artifact.provider} / {artifact.model}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight truncate">
              {artifact.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-muted transition-colors"
              title="Salin Markdown"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salin</span>
                </>
              )}
            </button>

            {/* Download DOCX */}
            <button
              onClick={handleDownloadDocx}
              disabled={downloadingDocx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100/60 transition-colors shadow-2xs"
              title="Unduh Microsoft Word (.docx)"
            >
              {downloadingDocx ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span className="hidden sm:inline">Word (.docx)</span>
            </button>

            {/* Download Markdown */}
            <button
              onClick={handleDownloadMd}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-lg hover:bg-muted transition-colors"
              title="Unduh file .md"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">.md</span>
            </button>

            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Hapus Artifact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors ml-1"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Markdown Content & Optional Audio Player */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 text-sm leading-relaxed space-y-5">
          {/* If audio overview podcast, show the interactive audio player on top */}
          {(artifact.kind === 'audio_overview' ||
            artifact.title.toLowerCase().includes('podcast') ||
            artifact.content_md.includes('**Maya:**') ||
            artifact.content_md.includes('**Budi:**')) && (
            <AudioPodcastPlayer
              contentMd={artifact.content_md}
              title={artifact.title}
            />
          )}

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {artifact.content_md}
            </ReactMarkdown>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Dihasilkan dari analisis dokumen sumber aktif di Nalar</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

