'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Citation } from '@/lib/types';
import { CitationChip } from './citation-chip';
import { Bot, User, Cpu } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  onCitationClick?: (citation: Citation) => void;
}

export function MessageBubble({ message, onCitationClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl p-4 space-y-2.5 ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border rounded-tl-sm shadow-sm'
        }`}
      >
        <div className={`prose dark:prose-invert max-w-none text-sm break-words leading-relaxed ${
          isUser ? 'text-primary-foreground' : 'text-foreground'
        }`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
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

        {/* Provider badge */}
        {!isUser && message.model && (
          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground/70">
            <span className="inline-flex items-center gap-1 font-mono">
              <Cpu className="w-3 h-3" />
              {message.provider ? `${message.provider} / ` : ''}{message.model}
            </span>
            {message.latency_ms && (
              <span>· {Math.round(message.latency_ms / 100) / 10}s</span>
            )}
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

