'use client';

import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Citation } from '@/lib/types';
import { CitationChip } from './citation-chip';
import { Bot, User, Cpu, Download, Copy, Check, FileText, Loader2, BookOpen } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  onCitationClick?: (citation: Citation) => void;
}

export function MessageBubble({ message, onCitationClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  // Map citations by uppercase marker (e.g. "S1", "S2")
  const citationsByMarker = useMemo(() => {
    const map = new Map<string, Citation>();
    message.citations?.forEach((c) => {
      map.set(c.marker.toUpperCase(), c);
    });
    return map;
  }, [message.citations]);

  // Turn inline citation tags [S1] or [S1 Hal. 3] into interactive link targets
  const processedContent = useMemo(() => {
    if (isUser || !message.citations || message.citations.length === 0) {
      return message.content;
    }
    return message.content.replace(/\[(S\d+)([^\]]*)\]/g, (match, marker) => {
      const upperMarker = marker.toUpperCase();
      if (citationsByMarker.has(upperMarker)) {
        return `[${match}](#cite-${upperMarker})`;
      }
      return match;
    });
  }, [message.content, message.citations, isUser, citationsByMarker]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Extract a clean document title from the first heading or preview text
  const getDerivedTitle = () => {
    const firstLine = message.content.split('\n').find((l) => l.trim().length > 0) || '';
    if (firstLine.startsWith('#')) {
      return firstLine.replace(/^#+\s*/, '').trim();
    }
    return firstLine.slice(0, 40).replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'Rangkuman-Dokumen';
  };

  const handleDownloadDocx = async () => {
    if (!message.content || downloadingDocx) return;
    setDownloadingDocx(true);
    try {
      const { markdownToDocxBlob } = await import('@/lib/export/docx');
      const title = getDerivedTitle();
      const blob = await markdownToDocxBlob(title, message.content);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeFilename = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      a.href = url;
      a.download = `${safeFilename || 'dokumen-nalar'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export docx:', err);
      alert('Gagal mengekspor dokumen Word (.docx)');
    } finally {
      setDownloadingDocx(false);
    }
  };

  // Determine if this message is a structured document/summary worth highlighting with a download card
  const isDocumentSummary =
    !isUser &&
    message.content.length > 150 &&
    (message.content.includes('#') ||
      message.content.includes('- ') ||
      message.content.toLowerCase().includes('rangkum') ||
      message.content.toLowerCase().includes('bab ') ||
      message.content.toLowerCase().includes('spk'));

  return (
    <div className={`flex gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-3 sm:p-4 space-y-2.5 ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border rounded-tl-sm shadow-sm'
        }`}
      >
        {/* Prominent Word Download Card if the answer is a structured document / summary */}
        {isDocumentSummary && (
          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-foreground truncate">
                  Dokumen Word (.docx) Tersedia
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {getDerivedTitle()}.docx
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadDocx}
              disabled={downloadingDocx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition shrink-0 shadow-xs ml-2 cursor-pointer"
            >
              {downloadingDocx ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Unduh .docx</span>
            </button>
          </div>
        )}

        <div
          className={`prose dark:prose-invert max-w-none text-sm break-words leading-relaxed ${
            isUser ? 'text-primary-foreground' : 'text-foreground'
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                if (href?.startsWith('#cite-')) {
                  const marker = href.replace('#cite-', '');
                  const cit = citationsByMarker.get(marker);
                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (cit) onCitationClick?.(cit);
                      }}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.2 mx-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold border border-primary/30 transition-all cursor-pointer align-baseline no-underline shadow-2xs"
                      title={
                        cit
                          ? `Buka dokumen: ${cit.sourceName || marker}${cit.page ? ` (Hal. ${cit.page})` : ''}`
                          : `Sitasi ${marker}`
                      }
                    >
                      <BookOpen className="w-2.5 h-2.5 shrink-0" />
                      <span>{children}</span>
                    </button>
                  );
                }
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    {children}
                  </a>
                );
              },
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </div>

        {/* Citations block for assistant responses */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="pt-2 border-t mt-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Sitasi Sumber:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.citations.map((c, idx) => (
                <CitationChip key={idx} citation={c} onClick={onCitationClick} />
              ))}
            </div>
          </div>
        )}

        {/* Footer info & Action buttons for assistant responses */}
        {!isUser && (
          <div className="flex items-center justify-between pt-2 border-t mt-2 text-[11px] text-muted-foreground/80">
            {/* Model & latency badge */}
            <div className="flex items-center gap-2">
              {message.model && (
                <span className="inline-flex items-center gap-1 font-mono">
                  <Cpu className="w-3 h-3" />
                  {message.provider ? `${message.provider} / ` : ''}{message.model}
                </span>
              )}
              {message.latency_ms && (
                <span>· {Math.round(message.latency_ms / 100) / 10}s</span>
              )}
            </div>

            {/* Quick Actions (Copy & Export Word) */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                title="Salin jawaban"
                className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>

              <button
                onClick={handleDownloadDocx}
                disabled={downloadingDocx}
                title="Unduh sebagai file Word (.docx)"
                className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                {downloadingDocx ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <FileText className="w-3 h-3 text-blue-600" />
                )}
                <span>Word (.docx)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

