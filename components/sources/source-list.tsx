'use client';

import { useEffect, useState, useMemo } from 'react';
import { Source } from '@/lib/types';
import { formatBytes } from '@/lib/utils';
import { FileText, Loader2, CheckCircle2, AlertTriangle, Trash2, RotateCw, Search, CheckSquare, Square } from 'lucide-react';

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
  const [filterQuery, setFilterQuery] = useState('');

  // Filter sources by search query
  const filteredSources = useMemo(() => {
    if (!filterQuery.trim()) return sources;
    const q = filterQuery.toLowerCase();
    return sources.filter((s) => s.file_name.toLowerCase().includes(q));
  }, [sources, filterQuery]);

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
    <div className="space-y-2.5">
      {/* Search Input for Documents */}
      {sources.length > 3 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-nalar-muted" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Cari nama berkas..."
            className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-[#E5E0D5] bg-white text-xs text-nalar-text placeholder:text-nalar-muted focus:outline-none focus:ring-1 focus:ring-nalar-accent focus:border-nalar-accent transition shadow-2xs"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-nalar-muted hover:text-nalar-text text-xs"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Compact Documents List */}
      <div className="space-y-1.5">
        {filteredSources.length === 0 ? (
          <div className="text-center py-4 text-xs text-nalar-muted">
            Tidak ada dokumen yang cocok.
          </div>
        ) : (
          filteredSources.map((source) => {
            const isSelected = selectedSourceId === source.id;
            const isReady = source.status === 'ready';
            const isProcessing =
              source.status === 'queued' || source.status === 'processing' || retryingId === source.id;
            const isFailed = source.status === 'failed' && retryingId !== source.id;

            return (
              <div
                key={source.id}
                onClick={() => onSelectSource?.(source)}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex flex-col gap-1.5 ${
                  isSelected
                    ? 'border-[#C25127] bg-[#F3EAE2]/50 shadow-2xs'
                    : 'bg-white border-[#E5E0D5] hover:border-[#C25127]/40 shadow-2xs'
                }`}
              >
                {/* Row 1: Checkbox + Name + Actions */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                    <button
                      onClick={(e) => handleToggle(source, e)}
                      title={source.enabled ? 'Aktif dalam pencarian AI' : 'Dinonaktifkan'}
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors ${
                        source.enabled
                          ? 'text-[#C25127]'
                          : 'text-nalar-muted'
                      }`}
                    >
                      {source.enabled ? (
                        <CheckSquare className="w-3.5 h-3.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <FileText className="w-3.5 h-3.5 text-nalar-accent shrink-0" />
                    <span className="font-medium text-xs text-nalar-text truncate" title={source.file_name}>
                      {source.file_name}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDelete(source.id, e)}
                    title="Hapus Dokumen"
                    className="p-1 rounded text-nalar-muted hover:text-destructive hover:bg-destructive/10 transition shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Row 2: Metadata (Size + Status / Chunks + Retry) */}
                <div className="flex items-center justify-between text-[10px] text-nalar-muted pl-5 pt-0.5 border-t border-[#E5E0D5]/40">
                  <span>{formatBytes(source.file_size)}</span>

                  <div className="flex items-center gap-1.5">
                    {isProcessing && (
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        {source.progress || 10}%
                      </span>
                    )}
                    {isReady && (
                      <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {source.chunk_count} chunk
                      </span>
                    )}
                    {isFailed && (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-0.5 text-destructive font-medium">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Gagal
                        </span>
                        <button
                          onClick={(e) => handleRetry(source.id, e)}
                          title="Coba proses ulang dokumen"
                          className="text-nalar-accent hover:underline flex items-center gap-0.5"
                        >
                          <RotateCw className="w-2.5 h-2.5" />
                          <span>Ulangi</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
