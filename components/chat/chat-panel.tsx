'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Citation } from '@/lib/types';
import { MessageBubble } from './message-bubble';
import { Send, Square, Sparkles, Loader2, RotateCcw, FileText } from 'lucide-react';

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
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from Supabase on mount / notebook change
  useEffect(() => {
    let cancelled = false;
    async function loadChatHistory() {
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

    loadChatHistory();
    return () => {
      cancelled = true;
    };
  }, [notebookId]);

  const scrollToBottom = () => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!loadingHistory) {
      scrollToBottom();
    }
  }, [messages, loadingHistory]);

  const handleClearHistory = async () => {
    if (!confirm('Hapus seluruh riwayat chat di notebook ini dan mulai percakapan baru?')) return;
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
              if (data.threadId) setThreadId(data.threadId);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, provider: data.provider, model: data.model }
                    : m
                )
              );
            } else if (eventType === 'delta') {
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
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* Sub-header with History Controls */}
      <div className="px-4 py-2 border-b bg-card/50 flex items-center justify-between text-xs text-muted-foreground shrink-0">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Tanya Jawab Dokumen</span>
          {messages.length > 0 && (
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-muted">
              {messages.length} pesan
            </span>
          )}
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            title="Hapus riwayat dan mulai chat baru"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Chat Baru</span>
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Memuat riwayat chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Mulai Tanya Jawab</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {readySourceCount === 0
                ? 'Unggah dan tunggu dokumen Anda siap untuk mulai bertanya dengan sitasi akurat.'
                : `Terdapat ${readySourceCount} dokumen aktif siap digunakan sebagai acuan jawaban.`}
            </p>

            {readySourceCount > 0 && (
              <div className="flex flex-col gap-2 w-full pt-2">
                <button
                  onClick={() => {
                    handleSend(undefined, 'Rangkum semua dokumen yang diunggah ke dalam format Word (.docx) secara detail dan komprehensif.');
                  }}
                  className="p-2.5 rounded-lg border border-primary/30 text-xs text-left bg-primary/5 hover:bg-primary/10 transition flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-medium text-foreground">
                    &quot;Rangkum semua dokumen ke format Word (.docx) secara detail&quot;
                  </span>
                </button>
                <button
                  onClick={() => {
                    setInput('Buatkan ringkasan lengkap dari dokumen yang diunggah.');
                  }}
                  className="p-2.5 rounded-lg border text-xs text-left bg-card hover:bg-muted/50 transition cursor-pointer"
                >
                  📄 &quot;Buatkan ringkasan lengkap dari dokumen yang diunggah.&quot;
                </button>
                <button
                  onClick={() => {
                    setInput('Apa poin-poin terpenting, kesepakatan, dan temuan utamanya?');
                  }}
                  className="p-2.5 rounded-lg border text-xs text-left bg-card hover:bg-muted/50 transition cursor-pointer"
                >
                  💡 &quot;Apa poin-poin terpenting, kesepakatan, dan temuan utamanya?&quot;
                </button>
              </div>
            )}
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onCitationClick={onCitationClick}
            />
          ))
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Input area */}
      <div className="p-2.5 sm:p-4 border-t bg-card/80 backdrop-blur sticky bottom-0 z-10">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              readySourceCount === 0
                ? 'Unggah sumber dokumen terlebih dahulu...'
                : 'Tanyakan sesuatu atau minta rangkum ke Word... (Enter untuk kirim)'
            }
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none min-h-[44px] sm:min-h-[48px] max-h-32"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="px-3.5 sm:px-4 bg-destructive text-destructive-foreground rounded-xl flex items-center justify-center hover:bg-destructive/90 transition shadow-sm shrink-0 cursor-pointer"
              title="Hentikan Jawaban"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-3.5 sm:px-4 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition shadow-sm shrink-0 cursor-pointer"
              title="Kirim Pertanyaan"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

