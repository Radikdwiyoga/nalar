'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  Check,
  Sparkles,
  ArrowRight,
  Scale,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Source } from '@/lib/types';

interface DocumentComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: Source[];
  onGenerate: (selectedSourceIds: string[], customPrompt?: string) => void;
  isGenerating: boolean;
}

const COMPARISON_CRITERIA = [
  'Ruang Lingkup Pekerjaan & Spesifikasi Teknis',
  'Nilai Anggaran / Finansial & Skema Pembayaran',
  'Jangka Waktu Pelaksanaan & Milestone Kunci',
  'Hak, Kewajiban, dan Klausul Kontrak',
  'SLA, Batasan Tanggung Jawab, dan Denda/Penalti',
  'Persyaratan Kualifikasi & Dokumen Pendukung',
];

export function DocumentComparisonModal({
  isOpen,
  onClose,
  sources,
  onGenerate,
  isGenerating,
}: DocumentComparisonModalProps) {
  const readySources = sources.filter((s) => s.status === 'ready');

  // Pre-select first 2-3 sources by default
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    readySources.slice(0, 3).map((s) => s.id)
  );

  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([
    'Ruang Lingkup Pekerjaan & Spesifikasi Teknis',
    'Nilai Anggaran / Finansial & Skema Pembayaran',
    'Jangka Waktu Pelaksanaan & Milestone Kunci',
    'SLA, Batasan Tanggung Jawab, dan Denda/Penalti',
  ]);

  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  const toggleSource = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleCriteria = (crit: string) => {
    setSelectedCriteria((prev) =>
      prev.includes(crit) ? prev.filter((item) => item !== crit) : [...prev, crit]
    );
  };

  const handleStart = () => {
    if (selectedIds.length === 0) {
      alert('Pilih minimal 1 atau 2 dokumen untuk dibandingkan');
      return;
    }

    const criteriaPrompt =
      selectedCriteria.length > 0
        ? `Fokus kriteria perbandingan:\n- ${selectedCriteria.join('\n- ')}\n${
            customNote ? `Catatan khusus: ${customNote}` : ''
          }`
        : customNote;

    onGenerate(selectedIds, criteriaPrompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="w-full max-w-xl bg-card rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between gap-3 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                Matriks Komparasi Dokumen
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Bandingkan parameter, klausul, dan angka antar dokumen secara sistematis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs max-h-[75vh]">
          {/* Step 1: Select Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>1. Pilih Dokumen yang Dibandingkan</span>
                <span className="text-primary font-semibold">({selectedIds.length} dipilih)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedIds.length === readySources.length) {
                    setSelectedIds([]);
                  } else {
                    setSelectedIds(readySources.map((s) => s.id));
                  }
                }}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                {selectedIds.length === readySources.length ? 'Batal Semua' : 'Pilih Semua'}
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {readySources.length === 0 ? (
                <p className="text-muted-foreground py-3 text-center border rounded-xl bg-muted/20">
                  Belum ada dokumen yang siap di notebook ini.
                </p>
              ) : (
                readySources.map((src) => {
                  const isChecked = selectedIds.includes(src.id);
                  return (
                    <div
                      key={src.id}
                      onClick={() => toggleSource(src.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                        isChecked
                          ? 'border-indigo-500/60 bg-indigo-500/10 shadow-2xs'
                          : 'bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-semibold truncate">{src.file_name}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Comparison Focus Criteria */}
          <div className="space-y-2">
            <label className="font-bold text-xs uppercase tracking-wider text-muted-foreground block">
              2. Aspek yang Ingin Dibandingkan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMPARISON_CRITERIA.map((crit) => {
                const isSelected = selectedCriteria.includes(crit);
                return (
                  <button
                    key={crit}
                    type="button"
                    onClick={() => toggleCriteria(crit)}
                    className={`p-2 rounded-lg border text-left flex items-start gap-2 transition cursor-pointer text-[11px] ${
                      isSelected
                        ? 'border-primary/50 bg-primary/5 font-semibold text-foreground'
                        : 'text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <span>{crit}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Custom Instruction */}
          <div className="space-y-1.5">
            <label className="font-bold text-xs uppercase tracking-wider text-muted-foreground block">
              3. Catatan Khusus Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Contoh: Fokus pada perbandingan denda keterlambatan dan kepemilikan source code..."
              className="w-full px-3 py-2 rounded-xl border bg-background text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-muted/20 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl border bg-background hover:bg-muted text-xs font-medium transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={isGenerating || selectedIds.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menganalisis Dokumen...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buat Matriks Komparasi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
