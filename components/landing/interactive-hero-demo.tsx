'use client';

import { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Download,
  Bookmark,
  MessageSquare,
  Scale,
  Radio,
  Sparkles,
  FileSpreadsheet,
  Play,
  Pause,
} from 'lucide-react';

type DemoTab = 'chat' | 'matrix' | 'podcast';

const CITATIONS_DATA = {
  S1: {
    marker: 'S1',
    doc: 'SPK_Pengadaan_Infrastruktur_2026.pdf',
    loc: 'Halaman 4 • Pasal 8 Ayat 2',
    chunk: 'Chunk #14 • PDF Kontrak',
    quote:
      'Penyedia jasa wajib menyelesaikan seluruh instalasi klaster server dan menyerahkan Berita Acara Serah Terima (BAST) paling lambat 90 (sembilan puluh) hari kalender sejak SPMK diterbitkan, dengan denda keterlambatan 1‰ per hari.',
  },
  S2: {
    marker: 'S2',
    doc: 'RAB_Alokasi_Anggaran_2026.xlsx',
    loc: 'Sheet: Rekapitulasi • Baris 18–24',
    chunk: 'Chunk #3 • Tabel Excel',
    quote:
      'Total Pagu Anggaran: Rp 4.850.000.000 (termasuk PPN 11%). Skema pencairan: Termin I (30%) saat perangkat tiba di lokasi, Termin II (50%) pasca UAT, dan Termin III (20%) setelah masa pemeliharaan.',
  },
};

export function InteractiveHeroDemo() {
  const [activeTab, setActiveTab] = useState<DemoTab>('chat');
  const [selectedCite, setSelectedCite] = useState<'S1' | 'S2'>('S1');
  const [podcastPlaying, setPodcastPlaying] = useState(true);

  const activeCiteData = CITATIONS_DATA[selectedCite];

  return (
    <div className="floating-island rounded-3xl p-2 sm:p-3.5 max-w-5xl mx-auto text-left overflow-hidden border border-nalar-border bg-nalar-card/95 backdrop-blur-md">
      {/* Window Top Chrome + Accessible Interactive Tablist */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 px-2 border-b border-nalar-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-2 font-serif font-bold text-xs sm:text-sm text-nalar-text truncate">
            Ruang Riset: Evaluasi Kontrak & RAB 2026
          </span>
        </div>

        {/* Single-row scrollable ARIA tablist with shape underline indicator */}
        <div
          role="tablist"
          aria-label="Pratinjau fitur interaktif Nalar"
          className="flex items-center gap-1 overflow-x-auto bg-nalar-surface p-1 rounded-xl border border-nalar-border shrink-0"
        >
          {[
            { id: 'chat' as const, label: 'Chat & Sitasi', icon: MessageSquare },
            { id: 'matrix' as const, label: 'Matriks Komparasi', icon: Scale },
            { id: 'podcast' as const, label: 'AI Podcast', icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`demo-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-nalar-card text-nalar-accent shadow-2xs after:content-[""] after:absolute after:inset-x-2.5 after:bottom-0.5 after:border-b-2 after:border-nalar-accent'
                    : 'text-nalar-muted hover:text-nalar-text'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PANEL 1: Interactive Chat & Split Citation Highlight */}
      <div
        role="tabpanel"
        aria-labelledby="demo-tab-chat"
        hidden={activeTab !== 'chat'}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 text-xs">
          {/* Left Island: Active Sources */}
          <div className="hidden md:flex md:col-span-3 flex-col justify-between p-3.5 rounded-2xl bg-nalar-surface border border-nalar-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[10px] uppercase tracking-wider text-nalar-muted">
                  Sumber Aktif
                </p>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-nalar-card border border-nalar-border text-nalar-text">
                  3 Berkas
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCite('S1')}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                  selectedCite === 'S1'
                    ? 'bg-nalar-card border-nalar-accent shadow-2xs'
                    : 'bg-nalar-card/70 border-nalar-border hover:border-nalar-accent/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-medium text-[11px] truncate text-nalar-text">
                    SPK_Infrastruktur.pdf
                  </span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedCite('S2')}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                  selectedCite === 'S2'
                    ? 'bg-nalar-card border-nalar-accent shadow-2xs'
                    : 'bg-nalar-card/70 border-nalar-border hover:border-nalar-accent/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-medium text-[11px] truncate text-nalar-text">
                    RAB_Anggaran_2026.xlsx
                  </span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </button>

              <div className="p-2.5 rounded-xl bg-nalar-card/70 border border-nalar-border flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-medium text-[11px] truncate text-nalar-text">
                    TOR_Teknis_Server.docx
                  </span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
            </div>

            <p className="text-[10px] text-nalar-muted pt-3 border-t border-nalar-border/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-nalar-accent shrink-0" />
              <span>Klik sitasi untuk uji sorot langsung</span>
            </p>
          </div>

          {/* Center Island: Synthesized Answer */}
          <div className="md:col-span-5 flex flex-col justify-between gap-3 p-4 rounded-2xl bg-nalar-bg/70 border border-nalar-border">
            <div className="space-y-3">
              <div className="self-end ml-auto max-w-[90%] bg-nalar-accent text-white px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-[11px] font-medium shadow-xs">
                Berapa batas waktu penyelesaian SPK dan bagaimana rincian termin pembayarannya?
              </div>

              <div className="p-3.5 rounded-2xl bg-nalar-card border border-nalar-border space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between p-2 rounded-xl border border-nalar-border bg-nalar-surface/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-nalar-citationBg text-nalar-accent flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] truncate text-nalar-text">
                        Ringkasan-Kontrak-SPK-RAB.docx
                      </p>
                      <p className="text-[10px] text-nalar-muted">Siap diunduh ke Microsoft Word</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-nalar-accent text-white text-[10px] font-semibold shrink-0">
                    <Download className="w-3 h-3" />
                    .docx
                  </span>
                </div>

                <p className="text-xs text-nalar-text leading-relaxed">
                  Masa pelaksanaan pekerjaan ditetapkan selama <strong>90 hari kalender</strong> dengan denda keterlambatan 1‰ per hari{' '}
                  <button
                    type="button"
                    onClick={() => setSelectedCite('S1')}
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border text-[10px] font-bold transition cursor-pointer ${
                      selectedCite === 'S1'
                        ? 'bg-nalar-accent text-white border-nalar-accent'
                        : 'bg-nalar-citationBg text-nalar-accent border-nalar-citationBorder hover:bg-nalar-accent hover:text-white'
                    }`}
                  >
                    [S1 Hal. 4]
                  </button>
                  . Nilai total kontrak sebesar <strong>Rp 4,85 Miliar</strong> dicairkan dalam 3 termin bertahap (30% - 50% - 20%){' '}
                  <button
                    type="button"
                    onClick={() => setSelectedCite('S2')}
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border text-[10px] font-bold transition cursor-pointer ${
                      selectedCite === 'S2'
                        ? 'bg-nalar-accent text-white border-nalar-accent'
                        : 'bg-nalar-citationBg text-nalar-accent border-nalar-citationBorder hover:bg-nalar-accent hover:text-white'
                    }`}
                  >
                    [S2 Sheet 1]
                  </button>
                  .
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-nalar-muted px-1">
              <span>👆 Klik tombol [S1] atau [S2] di atas</span>
              <span className="font-mono">Hybrid RRF • 0.8s</span>
            </div>
          </div>

          {/* Right Island: Live Citation Document Inspector */}
          <div className="md:col-span-4 flex flex-col justify-between gap-2.5 p-3.5 rounded-2xl bg-nalar-surface border border-nalar-border">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-nalar-border">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-nalar-text">
                  <Bookmark className="w-3.5 h-3.5 text-nalar-accent" />
                  <span>Inspeksi Sitasi [{activeCiteData.marker}]</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-nalar-accent text-white">
                  Terverifikasi
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-nalar-card border border-nalar-border space-y-0.5">
                <p className="font-serif font-bold text-xs text-nalar-text truncate">
                  {activeCiteData.doc}
                </p>
                <p className="text-[11px] text-nalar-accent font-medium">{activeCiteData.loc}</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/15 border-l-4 border-nalar-accent border-y border-r border-amber-500/30 text-xs leading-relaxed text-nalar-text space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-nalar-accent block">
                  Sorotan Kalimat Asli:
                </span>
                <p className="font-serif italic text-xs leading-relaxed">
                  &ldquo;{activeCiteData.quote}&rdquo;
                </p>
              </div>
            </div>

            <div className="text-[10px] font-mono text-nalar-muted flex items-center justify-between pt-2 border-t border-nalar-border/60">
              <span>{activeCiteData.chunk}</span>
              <span>100% Sesuai Sumber</span>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL 2: Comparison Matrix Showcase */}
      <div
        role="tabpanel"
        aria-labelledby="demo-tab-matrix"
        hidden={activeTab !== 'matrix'}
      >
        <div className="pt-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-2">
            <div>
              <h4 className="font-serif font-bold text-sm text-nalar-text">
                Matriks Komparasi Lintas Dokumen (SPK vs TOR vs RAB)
              </h4>
              <p className="text-[11px] text-nalar-muted">
                Perbandingan otomatis parameter kritis lengkap dengan ekspor tabel Word (.docx) asli
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-nalar-citationBg text-nalar-accent border border-nalar-citationBorder text-xs font-semibold">
              <Download className="w-3.5 h-3.5" />
              Tabel Word Siap Unduh
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-nalar-border bg-nalar-card">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-nalar-surface border-b border-nalar-border text-nalar-text">
                  <th className="p-3 font-serif font-bold">Parameter Evaluasi</th>
                  <th className="p-3 font-serif font-bold">SPK Kontrak Utama</th>
                  <th className="p-3 font-serif font-bold">TOR Spesifikasi Teknis</th>
                  <th className="p-3 font-serif font-bold">Temuan Analisis AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nalar-border">
                <tr>
                  <td className="p-3 font-semibold text-nalar-text">Durasi Pelaksanaan</td>
                  <td className="p-3 text-nalar-muted">90 Hari Kalender [S1]</td>
                  <td className="p-3 text-nalar-muted">3 Bulan sejak Kick-off [S3]</td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">✓ Selaras & Konsisten</td>
                </tr>
                <tr className="bg-nalar-bg/50">
                  <td className="p-3 font-semibold text-nalar-text">SLA & Garansi</td>
                  <td className="p-3 text-nalar-muted">Uptime 99,9% • Garansi 3 Thn</td>
                  <td className="p-3 text-nalar-muted">Response time &lt; 2 jam (24/7)</td>
                  <td className="p-3 text-nalar-accent font-medium">⚡ Klausul SLA saling melengkapi</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-nalar-text">Skema Pembayaran</td>
                  <td className="p-3 text-nalar-muted">3 Termin (30% / 50% / 20%)</td>
                  <td className="p-3 text-nalar-muted">Wajib lampirkan BAST & UAT</td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">✓ Sesuai pagu Rp 4,85 Miliar</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PANEL 3: AI Audio Podcast Showcase */}
      <div
        role="tabpanel"
        aria-labelledby="demo-tab-podcast"
        hidden={activeTab !== 'podcast'}
      >
        <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
          <div className="md:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-nalar-citationBg via-nalar-surface to-nalar-card border border-nalar-citationBorder flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-nalar-card border border-nalar-border text-[11px] font-semibold text-nalar-accent">
                <Radio className="w-3.5 h-3.5" />
                Dual-Speaker AI Podcast
              </span>
              <span className="font-mono text-[11px] text-nalar-muted">04:18</span>
            </div>

            <div className="space-y-1">
              <h4 className="font-serif font-bold text-base sm:text-lg text-nalar-text">
                Bedah Tuntas Kontrak & Risiko Proyek 2026
              </h4>
              <p className="text-xs text-nalar-muted">
                Maya (Host) & Budi (Analis) mendiskusikan poin krusial dokumen Anda secara santai.
              </p>
            </div>

            {/* Animated Waveform Visualizer */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPodcastPlaying(!podcastPlaying)}
                aria-label={podcastPlaying ? 'Jeda simulasi audio' : 'Putar simulasi audio'}
                className="w-10 h-10 rounded-full bg-nalar-accent hover:bg-nalar-accentHover text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition"
              >
                {podcastPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <div className="flex-1 flex items-end gap-1 h-8 px-2" aria-hidden="true">
                {[45, 85, 60, 95, 40, 75, 100, 55, 80, 50, 90, 65, 40, 85, 70, 50, 95, 60, 45, 75].map(
                  (h, i) => (
                    <span
                      key={i}
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 0.08}s`,
                      }}
                      className={`flex-1 rounded-full bg-nalar-accent/80 ${
                        podcastPlaying ? 'animate-waveform' : 'opacity-40'
                      }`}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-7 p-4 rounded-2xl bg-nalar-surface border border-nalar-border space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-nalar-card border border-nalar-border space-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                Maya (Host)
              </span>
              <p className="text-nalar-text leading-relaxed">
                &ldquo;Menarik banget ya Budi, dari 8 berkas pengadaan yang kita kumpulkan ini, sebenarnya titik krusial yang paling wajib dijaga tim proyek itu di bagian mana?&rdquo;
              </p>
            </div>

            <div className="p-3 rounded-xl bg-nalar-card border-2 border-nalar-accent/60 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Budi (Analis)
                </span>
                <span className="text-[10px] font-semibold text-nalar-accent">● Sedang berbicara</span>
              </div>
              <p className="text-nalar-text leading-relaxed">
                &ldquo;Ada di sinkronisasi jadwal UAT pada hari ke-90, Maya. Karena di RAB tercatat pencairan Termin II sebesar 50% baru bisa cair setelah berita acara UAT ditandatangani kedua pihak.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
