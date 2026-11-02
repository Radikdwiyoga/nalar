'use client';

import { Citation } from '@/lib/types';
import { BookOpen } from 'lucide-react';

interface CitationChipProps {
  citation: Citation;
  onClick?: (citation: Citation) => void;
}

export function CitationChip({ citation, onClick }: CitationChipProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(citation)}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium border border-primary/20 transition-all cursor-pointer"
      title={`Buka kutipan: ${citation.sourceName || 'Dokumen'} ${
        citation.page ? `(Hal. ${citation.page})` : ''
      }`}
    >
      <BookOpen className="w-3 h-3 shrink-0" />
      <span>
        [{citation.marker}] {citation.sourceName ? citation.sourceName.slice(0, 15) : 'Sumber'}
        {citation.page ? ` : h.${citation.page}` : ''}
      </span>
    </button>
  );
}

