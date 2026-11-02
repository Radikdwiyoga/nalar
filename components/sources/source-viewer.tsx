'use client';

import { useEffect, useState } from 'react';
import { Citation, Source } from '@/lib/types';
import { X, ExternalLink, FileText, Loader2, Bookmark } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface SourceViewerProps {
  sourceId?: string | null;
  activeCitation?: Citation | null;
  onClose: () => void;
}

export function SourceViewer({ sourceId, activeCitation, onClose }: SourceViewerProps) {
  const targetId = sourceId || activeCitation?.sourceId;
  const [sourceData, setSourceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    fetch(`/api/sources/${targetId}`)
      .then((r) => r.json())
      .then((json) => {
        setSourceData(json.data || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [targetId]);

  if (!targetId) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 z-50 md:static md:z-auto w-full max-w-sm sm:max-w-md md:w-80 lg:w-96 border-l bg-card flex flex-col h-full shrink-0 shadow-2xl md:shadow-none animate-in slide-in-from-right-4">
        {/* Header */}
        <div className="h-14 px-4 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 truncate">
            <Bookmark className="w-4 h-4 text-primary" />
            <span className="font-semibold text-xs tracking-tight truncate">
              {activeCitation ? `Kutipan [${activeCitation.marker}]` : 'Detail Sumber'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {sourceData && (
                <div className="bg-muted/40 p-3.5 rounded-xl border space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-semibold text-xs truncate">
                        {sourceData.fileName}
                      </span>
                    </div>
                    {sourceData.downloadUrl && (
                      <a
                        href={sourceData.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 shrink-0 font-medium text-[11px]"
                      >
                        <span>Unduh</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1.5 border-t">
                    <div>Ukuran: {formatBytes(sourceData.fileSize)}</div>
                    <div>Status: {sourceData.status}</div>
                    {sourceData.pageCount && <div>Halaman: {sourceData.pageCount}</div>}
                    <div>Total Chunk: {sourceData.chunkCount}</div>
                  </div>
                </div>
              )}

              {activeCitation && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase text-primary">Kutipan Sumber</h4>
                    {activeCitation.page && (
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-semibold">
                        Halaman {activeCitation.page}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-foreground text-xs leading-relaxed font-mono whitespace-pre-wrap">
                    {activeCitation.snippet || 'Kutipan teks yang relevan'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
