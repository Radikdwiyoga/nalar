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
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 rounded-md bg-[#F3EAE2] text-[#A6421D] border border-[#DFC9B8] hover:bg-[#C25127] hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
      title={`Buka kutipan: ${citation.sourceName || 'Dokumen'} ${
        citation.page ? `(Hal. ${citation.page})` : ''
      }`}
    >
      <BookOpen className="w-3 h-3 shrink-0" />
      <span>
        [{citation.marker}] {citation.sourceName ? citation.sourceName.slice(0, 16) : 'Sumber'}
        {citation.page ? ` · h.${citation.page}` : ''}
      </span>
    </button>
  );
}

