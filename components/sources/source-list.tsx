'use client';

import { useEffect, useState } from 'react';
import { Source } from '@/lib/types';
import { formatBytes } from '@/lib/utils';
import { FileText, Loader2, CheckCircle2, AlertTriangle, Trash2, RotateCw } from 'lucide-react';

interface SourceListProps {
  sources: Source[];
  onRefresh: () => void;
  onSelectSource?: (source: Source) => void;
  selectedSourceId?: string | null;
}

export function SourceList({
  sources,
  onRefresh,
  onSelectSource,
  selectedSourceId,
}: SourceListProps) {
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Client-driven ingestion trigger: if any source is queued, trigger ingestion
  useEffect(() => {
    const queuedSources = sources.filter((s) => s.status === 'queued');
    if (queuedSources.length === 0) return;

    queuedSources.forEach((s) => {
      fetch(`/api/sources/${s.id}/ingest`, { method: 'POST' })
        .then(() => onRefresh())
        .catch(console.error);
    });
  }, [sources, onRefresh]);

  // Polling for processing sources
  useEffect(() => {
    const isProcessing = sources.some(
      (s) => s.status === 'queued' || s.status === 'processing'
    );
    if (!isProcessing) return;

    const interval = setInterval(() => {
      onRefresh();
    }, 2000);

    return () => clearInterval(interval);
  }, [sources, onRefresh]);

  const handleToggle = async (source: Source, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !source.enabled }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetry = async (sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryingId(sourceId);
    try {
      await fetch(`/api/sources/${sourceId}/ingest`, { method: 'POST' });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Hapus dokumen sumber ini?')) return;

    try {
      await fetch(`/api/sources/${sourceId}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (sources.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground border rounded-xl bg-card p-4">
        Belum ada dokumen sumber di notebook ini.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sources.map((source) => {
        const isSelected = selectedSourceId === source.id;
        const isReady = source.status === 'ready';
        const isProcessing = source.status === 'queued' || source.status === 'processing' || retryingId === source.id;
        const isFailed = source.status === 'failed' && retryingId !== source.id;

        return (
          <div
            key={source.id}
            onClick={() => onSelectSource?.(source)}
            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col gap-2 ${
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'bg-card hover:border-primary/40'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 truncate flex-1">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold truncate">{source.file_name}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => handleToggle(source, e)}
                  title={source.enabled ? 'Aktif dalam pencarian' : 'Dinonaktifkan'}
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    source.enabled
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground bg-muted'
                  }`}
                >
                  {source.enabled && <CheckCircle2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={(e) => handleDelete(source.id, e)}
                  title="Hapus Dokumen"
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
              <span>{formatBytes(source.file_size)}</span>

              <div className="flex items-center gap-1.5">
                {isProcessing && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {source.progress || 10}%
                    </span>
                    <button
                      onClick={(e) => handleRetry(source.id, e)}
                      title="Proses ulang dokumen jika lambat atau macet"
                      className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition inline-flex items-center"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {isReady && (
                  <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    {source.chunk_count} chunk
                  </span>
                )}
                {isFailed && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-destructive font-medium" title={source.error_message || 'Gagal'}>
                      <AlertTriangle className="w-3 h-3" />
                      Gagal
                    </span>
                    <button
                      onClick={(e) => handleRetry(source.id, e)}
                      title="Coba proses ulang dokumen"
                      className="p-1 text-primary hover:bg-primary/10 rounded transition inline-flex items-center gap-0.5"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Ulangi</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
