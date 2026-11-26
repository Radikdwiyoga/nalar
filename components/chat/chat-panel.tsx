'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Citation } from '@/lib/types';
import { MessageBubble } from './message-bubble';
import {
  Send,
  Square,
  Sparkles,
  Loader2,
  RotateCcw,
  FileText,
  Scale,
  ShieldAlert,
  CornerDownLeft,
} from 'lucide-react';

interface ChatPanelProps {
  notebookId: string;
  onCitationClick: (citation: Citation) => void;
  readySourceCount: number;
}

export function ChatPanel({
  notebookId,
  onCitationClick,
  readySourceCount,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStage, setStreamingStage] = useState<'retrieving' | 'synthesizing'>('retrieving');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      setLoadingHistory(true);
      try {
        const res = await fetch(`/api/chat?notebookId=${notebookId}`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && json.data) {
            setThreadId(json.data.threadId || null);
            setMessages(json.data.messages || []);
          }
        }
      } catch (err) {
        console.error('Gagal memuat riwayat chat:', err);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [notebookId]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleClearHistory = async () => {
    if (!confirm('Hapus seluruh riwayat chat pada notebook ini dan mulai percakapan baru?')) {
      return;
    }
    try {
      await fetch(`/api/chat?notebookId=${notebookId}`, { method: 'DELETE' });
      setMessages([]);
      setThreadId(null);
    } catch (err) {
      console.error('Gagal menghapus riwayat chat:', err);
    }
  };

  const handleSend = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || input).trim();
    if (!query || isStreaming) return;

    if (!customQuery) setInput('');
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      thread_id: threadId || '',
      user_id: '',
      role: 'user',
      content: query,
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingStage('retrieving');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const assistantMsgId = crypto.randomUUID();
    const placeholderAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      thread_id: threadId || '',
      user_id: '',
      role: 'assistant',
      content: '',
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, placeholderAssistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebookId,
          threadId,
          question: query,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const detail = errorJson?.error?.detail ? ` (${errorJson.error.detail})` : '';
        throw new Error(
          (errorJson?.error?.message || `Server error (${res.status})`) + detail
        );
      }

      if (!res.body) {
        throw new Error('Response body is empty');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const rawLines = block.split('\n');
          let eventType = '';
          let dataStr = '';

          for (const line of rawLines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6).trim();
            }
          }

          if (!eventType || !dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            if (eventType === 'meta') {
              setStreamingStage('synthesizing');
              if (data.threadId) setThreadId(data.threadId);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, provider: data.provider, model: data.model }
                    : m
                )
              );
            } else if (eventType === 'delta') {
              setStreamingStage('synthesizing');
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + data.text }
                    : m
                )
              );
            } else if (eventType === 'citations') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, citations: data.citations || [] }
                    : m
                )
              );
            } else if (eventType === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, latency_ms: data.latencyMs }
                    : m
                )
              );
            } else if (eventType === 'error') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + `\n\n*[${data.message}]*` }
                    : m
                )
              );
            }
          } catch (parseErr) {
            console.error('Error parsing SSE block:', parseErr);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    m.content ||
                    `Maaf, terjadi kendala saat memproses: ${err.message}`,
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-nalar-card relative overflow-hidden">
      {/* Subtle Top Sub-header */}
      <div className="px-4 py-2.5 border-b border-nalar-border bg-nalar-surface/40 flex items-center justify-between text-xs text-nalar-muted shrink-0">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-nalar-accent" />
          <span className="text-nalar-text font-semibold">Diskusi Berbasis Fakta Dokumen</span>
          {messages.length > 0 && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-nalar-card border border-nalar-border text-nalar-muted">
              {messages.length} pesan
            </span>
          )}
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            title="Hapus riwayat dan mulai chat baru"
            className="inline-flex items-center gap-1 text-[11px] text-nalar-muted hover:text-destructive hover:bg-destructive/10 px-2.5 py-1 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Percakapan Baru</span>
          </button>
        )}
      </div>

      {/* Messages Stream Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-5 relative">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full text-nalar-muted gap-2.5">
            <Loader2 className="w-6 h-6 animate-spin text-nalar-accent" />
            <p className="text-xs">Memuat riwayat percakapan...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full text-center max-w-2xl mx-auto py-8 px-4 space-y-6 relative">
            <div className="w-14 h-14 rounded-2xl bg-nalar-citationBg border border-nalar-citationBorder text-nalar-accent flex items-center justify-center shadow-2xs">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-nalar-text">
                Apa yang ingin Anda telaah hari ini?
              </h3>
              <p className="text-xs sm:text-sm text-nalar-muted leading-relaxed max-w-md mx-auto">
                {readySourceCount === 0
                  ? 'Unggah dokumen PDF, Word, Excel, atau tautan di panel kiri untuk memulai tanya-jawab bersitasi akurat.'
                  : `${readySourceCount} dokumen sumber aktif siap ditelusuri dengan Hybrid Vector & Entity Search.`}
              </p>
            </div>

            {readySourceCount > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      undefined,
                      'Rangkum semua dokumen yang diunggah ke dalam format Word (.docx) secara detail dan komprehensif.'
                    )
                  }
                  className="group p-4 rounded-2xl border border-nalar-border bg-nalar-bg/70 hover:bg-nalar-surface hover:border-nalar-accent transition-all flex flex-col justify-between gap-3 cursor-pointer shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-nalar-accent block mb-0.5">
                      Ekspor Word (.docx)
                    </span>
                    <p className="font-serif font-bold text-xs sm:text-sm text-nalar-text group-hover:text-nalar-accent transition-colors">
                      Rangkum seluruh dokumen secara detail
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      undefined,
                      'Apa saja poin-poin terpenting, angka kunci, dan kesimpulan eksekutif dari seluruh dokumen aktif?'
                    )
                  }
                  className="group p-4 rounded-2xl border border-nalar-border bg-nalar-bg/70 hover:bg-nalar-surface hover:border-nalar-accent transition-all flex flex-col justify-between gap-3 cursor-pointer shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-nalar-citationBg text-nalar-accent flex items-center justify-center border border-nalar-citationBorder">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-nalar-accent block mb-0.5">
                      Intisari Eksekutif
                    </span>
                    <p className="font-serif font-bold text-xs sm:text-sm text-nalar-text group-hover:text-nalar-accent transition-colors">
                      Poin terpenting & angka kunci dokumen
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      undefined,
                      'Identifikasi batasan risiko, kewajiban utama, klausul penalti, serta tenggat waktu pelaksanaan.'
                    )
                  }
                  className="group p-4 rounded-2xl border border-nalar-border bg-nalar-bg/70 hover:bg-nalar-surface hover:border-nalar-accent transition-all flex flex-col justify-between gap-3 cursor-pointer shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-nalar-accent block mb-0.5">
                      Audit Klausul
                    </span>
                    <p className="font-serif font-bold text-xs sm:text-sm text-nalar-text group-hover:text-nalar-accent transition-colors">
                      Petakan risiko, penalti & batas waktu
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : (
          messages.map((m, idx) => {
            const isLastEmptyAssistant =
              isStreaming &&
              idx === messages.length - 1 &&
              m.role === 'assistant' &&
              m.content.length === 0;

            if (isLastEmptyAssistant) {
              return (
                <div key={m.id} className="flex items-start gap-3 text-xs animate-in fade-in-0">
                  <div className="w-8 h-8 rounded-xl bg-nalar-citationBg border border-nalar-citationBorder text-nalar-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm border border-nalar-border bg-nalar-surface/60 space-y-1.5 shadow-2xs">
                    <p className="font-semibold text-xs shimmer-text">
                      {streamingStage === 'retrieving'
                        ? `Menelusuri ${readySourceCount} dokumen sumber & mencocokkan entitas...`
                        : 'Memverifikasi sitasi halaman & menyusun sintesis jawaban...'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-nalar-muted font-mono">
                      <span>Hybrid Vector + BM25 RRF</span>
                      {m.model && <span>• {m.model}</span>}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <MessageBubble
                key={m.id}
                message={m}
                onCitationClick={onCitationClick}
              />
            );
          })
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Floating Glass Omnibar Composer */}
      <div className="px-3 sm:px-5 pb-3 sm:pb-4 pt-2 bg-gradient-to-t from-nalar-card via-nalar-card/95 to-transparent shrink-0 z-10">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Quick Suggestion Pills */}
          {readySourceCount > 0 && !isStreaming && messages.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setInput('Rangkum seluruh dokumen ini ke format Word (.docx) secara detail dan terstruktur.')
                }
                className="px-2.5 py-1 rounded-full border border-nalar-border bg-nalar-surface/70 hover:border-nalar-accent hover:text-nalar-accent text-nalar-text transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                📄 Rangkum ke Word (.docx)
              </button>
              <button
                type="button"
                onClick={() =>
                  setInput('Apa saja temuan utama, poin penting, dan ringkasan eksekutifnya?')
                }
                className="px-2.5 py-1 rounded-full border border-nalar-border bg-nalar-surface/70 hover:border-nalar-accent hover:text-nalar-accent text-nalar-text transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                💡 Temuan Utama
              </button>
              <button
                type="button"
                onClick={() =>
                  setInput('Jelaskan batasan risiko, klausul penalti, dan jangka waktu pelaksanaan.')
                }
                className="px-2.5 py-1 rounded-full border border-nalar-border bg-nalar-surface/70 hover:border-nalar-accent hover:text-nalar-accent text-nalar-text transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                ⚠️ Risiko & Penalti
              </button>
            </div>
          )}

          {/* Capsule Omnibar Form */}
          <form
            ref={formRef}
            onSubmit={handleSend}
            className="glass rounded-2xl p-2 sm:p-2.5 shadow-sm transition-all focus-within:border-nalar-accent focus-within:ring-2 focus-within:ring-nalar-accent/20"
          >
            <label htmlFor="chat-omnibar-input" className="sr-only">
              Tulis pertanyaan tentang dokumen
            </label>
            <textarea
              id="chat-omnibar-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  // IME-safe composition check (prevents premature submit during IME conversion)
                  if (e.nativeEvent.isComposing || e.keyCode === 229) {
                    return;
                  }
                  formRef.current?.requestSubmit();
                }
              }}
              placeholder={
                readySourceCount === 0
                  ? 'Unggah sumber dokumen terlebih dahulu untuk bertanya...'
                  : 'Tanyakan fakta spesifik, minta perbandingan, atau rangkum ke Word...'
              }
              className="omnibar-field px-2.5 py-1.5 bg-transparent text-xs sm:text-sm text-nalar-text placeholder:text-nalar-muted focus:outline-none resize-none"
            />

            <div className="flex items-center justify-between gap-2 pt-1.5 px-2 border-t border-nalar-border/50">
              <div className="flex items-center gap-2 text-[11px] text-nalar-muted">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      readySourceCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  {readySourceCount} sumber aktif
                </span>
                <span className="hidden sm:inline text-nalar-muted/70">
                  · Shift+Enter baris baru
                </span>
              </div>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-destructive-foreground rounded-xl text-xs font-semibold hover:bg-destructive/90 transition shadow-2xs shrink-0 cursor-pointer"
                  title="Hentikan Jawaban"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Hentikan</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-nalar-accent text-white rounded-xl text-xs font-semibold hover:bg-nalar-accentHover disabled:opacity-40 transition shadow-2xs shrink-0 cursor-pointer"
                  title="Kirim Pertanyaan"
                >
                  <span>Kirim</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
