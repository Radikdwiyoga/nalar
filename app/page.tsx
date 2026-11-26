import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Sparkles,
  FileText,
  Layers,
  ScanText,
  Radio,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { InteractiveHeroDemo } from '@/components/landing/interactive-hero-demo';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-nalar-bg text-nalar-text relative overflow-x-hidden">
      {/* Floating Pill Glass Navbar */}
      <div className="sticky top-3 z-50 px-3 sm:px-6 pt-2">
        <header className="max-w-5xl mx-auto rounded-2xl glass px-4 sm:px-5 h-14 flex items-center justify-between shadow-xs">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-1 rounded-xl bg-nalar-citationBg border border-nalar-citationBorder group-hover:scale-105 transition-transform">
              <Image
                src="/logo-icon.png"
                alt="Nalar Logo"
                width={26}
                height={26}
                className="w-6 h-6 object-contain"
                priority
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif font-bold text-lg tracking-tight text-nalar-text">
                Nalar
              </span>
              <span className="hidden md:inline text-[11px] text-nalar-muted font-medium">
                AI Research Workspace
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-nalar-muted">
            <a href="#kapabilitas" className="hover:text-nalar-text transition-colors">
              Kapabilitas
            </a>
            <a href="#alur-kerja" className="hover:text-nalar-text transition-colors">
              Cara Kerja
            </a>
            <Link href="/notebooks" className="hover:text-nalar-text transition-colors">
              Ruang Riset
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Link
              href="/login"
              className="text-xs font-semibold text-nalar-muted hover:text-nalar-text px-3 py-1.5 rounded-xl hover:bg-nalar-surface transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/signup"
              className="text-xs font-semibold bg-nalar-accent text-white hover:bg-nalar-accentHover px-3.5 sm:px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Mulai Gratis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {/* Hero Section with Ambient Mesh & Faded Editorial Dot-Matrix */}
        <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 px-4 overflow-hidden">
          <div className="absolute inset-0 editorial-grid-fade pointer-events-none opacity-75" aria-hidden="true" />
          <div className="absolute inset-0 ambient-mesh pointer-events-none" aria-hidden="true" />

          <div className="relative max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-nalar-citationBorder bg-nalar-citationBg text-xs font-semibold text-nalar-accent mb-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Document Hybrid RAG • Vision OCR • 8 Format Studio AI</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.14] max-w-4xl mx-auto text-nalar-text">
              Ruang Riset Cerdas yang Bersandar{' '}
              <br className="hidden sm:inline" />
              <span className="gradient-text italic font-normal">Sepenuhnya pada Fakta Berkas</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-nalar-muted mb-8 max-w-2xl mx-auto leading-relaxed">
              Unggah puluhan PDF kontrak, scan fisik, dokumen Word, Excel, hingga Google Drive. Ajukan pertanyaan dengan sitasi halaman yang bisa diklik langsung, komparasikan dokumen, atau ekspor laporan Word (.docx) dalam 1 klik.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mb-8">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-nalar-accent text-white font-semibold px-6 py-3 rounded-xl shadow-xs hover:bg-nalar-accentHover hover:scale-[1.01] active:scale-[0.99] transition-all text-xs sm:text-sm"
              >
                Buat Ruang Riset Gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/notebooks"
                className="w-full sm:w-auto inline-flex items-center justify-center font-semibold px-6 py-3 rounded-xl border border-nalar-border bg-nalar-card hover:bg-nalar-surface transition-all text-xs sm:text-sm text-nalar-text shadow-2xs"
              >
                Buka Notebook Saya
              </Link>
            </div>

            {/* Format Support Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] text-nalar-muted mb-12">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-nalar-card border border-nalar-border">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PDF Digital & Scan OCR
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-nalar-card border border-nalar-border">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Word (.docx) & Excel (.xlsx)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-nalar-card border border-nalar-border">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Google Drive, Docs & Web
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-nalar-card border border-nalar-border">
                <ShieldCheck className="w-3 h-3 text-nalar-accent" /> Isolasi Privasi RLS
              </span>
            </div>

            {/* Live Clickable Multi-Tab Demo */}
            <InteractiveHeroDemo />
          </div>
        </section>

        {/* Rich Visual Bento Grid */}
        <section id="kapabilitas" className="py-20 border-t border-nalar-border bg-nalar-surface/70">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-nalar-accent mb-2 block">
                Arsitektur Kelas Eksekutif
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 text-nalar-text">
                Bukan Sekadar Chatbot — Melainkan Studio Analisis Utuh
              </h2>
              <p className="text-xs sm:text-sm text-nalar-muted leading-relaxed">
                Setiap fitur dirancang untuk memangkas waktu telaah dokumen ratusan halaman menjadi hitungan detik tanpa mengorbankan ketelitian.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
              {/* Bento 1 (7 Cols): Hybrid Multi-Source Synthesis with Visual Node Pipeline */}
              <div className="md:col-span-7 floating-island rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 group hover:border-nalar-accent transition-all">
                <div className="space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-nalar-citationBg text-nalar-accent border border-nalar-citationBorder">
                    <Layers className="w-3 h-3" />
                    Hybrid Dense + BM25 Entity Search
                  </span>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-nalar-text">
                    Sintesis Proporsional Lintas Belasan Berkas
                  </h3>
                  <p className="text-xs sm:text-sm text-nalar-muted leading-relaxed">
                    Menggabungkan pencarian vektor semantik dengan pencocokan nomor kontrak, pasal, dan angka eksak. Seluruh dokumen aktif dijamin terwakili secara adil tanpa ada berkas yang terlewat.
                  </p>
                </div>

                {/* Visual Mini Pipeline */}
                <div className="p-4 rounded-2xl bg-nalar-surface border border-nalar-border flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-nalar-card border border-nalar-border text-[11px] font-semibold text-nalar-text shadow-2xs">
                      <FileText className="w-3.5 h-3.5 text-rose-500" /> PDF
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-nalar-card border border-nalar-border text-[11px] font-semibold text-nalar-text shadow-2xs">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> XLSX
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-nalar-card border border-nalar-border text-[11px] font-semibold text-nalar-text shadow-2xs">
                      <Globe className="w-3.5 h-3.5 text-blue-500" /> Drive
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-nalar-accent hidden sm:block shrink-0" />

                  <div className="px-3 py-1.5 rounded-xl bg-nalar-accent text-white text-[11px] font-bold shadow-xs shrink-0">
                    RRF Fusion (64 Chunks)
                  </div>

                  <ArrowRight className="w-4 h-4 text-nalar-accent hidden sm:block shrink-0" />

                  <div className="px-3 py-1.5 rounded-xl bg-nalar-card border border-nalar-citationBorder text-[11px] font-semibold text-nalar-accent shrink-0">
                    Sitasi [S1 · Hal. 4]
                  </div>
                </div>
              </div>

              {/* Bento 2 (5 Cols): Vision OCR Scan */}
              <div className="md:col-span-5 floating-island rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 group hover:border-nalar-accent transition-all">
                <div className="space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-nalar-citationBg text-nalar-accent border border-nalar-citationBorder">
                    <ScanText className="w-3 h-3" />
                    Auto Vision OCR
                  </span>
                  <h3 className="font-serif font-bold text-xl text-nalar-text">
                    Baca PDF Scan Fisik & Foto Dokumen
                  </h3>
                  <p className="text-xs text-nalar-muted leading-relaxed">
                    Berkas kontrak lama hasil pemindaian mesin fotokopi otomatis dideteksi dan ditranskripsikan per halaman menggunakan Gemini Multimodal Vision.
                  </p>
                </div>

                {/* Visual Scan Transformation Card */}
                <div className="p-4 rounded-2xl bg-nalar-surface border border-nalar-border relative overflow-hidden space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-nalar-muted">
                    <span>SCAN_BERITA_ACARA.PDF</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">OCR AKTIF</span>
                  </div>
                  <div className="h-1.5 w-3/4 rounded bg-nalar-border/80" />
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-nalar-accent to-transparent my-1" />
                  <p className="font-mono text-[11px] text-nalar-text bg-nalar-card p-2 rounded-lg border border-nalar-border">
                    --- HALAMAN 1 --- Pasal 4: Jangka waktu pemeliharaan ditetapkan 12 bulan...
                  </p>
                </div>
              </div>

              {/* Bento 3 (5 Cols): Studio 8 Formats + Podcast Waveform */}
              <div className="md:col-span-5 floating-island rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 group hover:border-nalar-accent transition-all">
                <div className="space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-nalar-citationBg text-nalar-accent border border-nalar-citationBorder">
                    <Radio className="w-3 h-3" />
                    Studio 8 Format & Audio
                  </span>
                  <h3 className="font-serif font-bold text-xl text-nalar-text">
                    AI Podcast 2 Pembicara & Laporan 1-Klik
                  </h3>
                  <p className="text-xs text-nalar-muted leading-relaxed">
                    Ubah dokumen tebal menjadi obrolan audio interaktif antara Host & Analis, atau hasilkan Briefing Eksekutif, FAQ, Linimasa, dan Action Items.
                  </p>
                </div>

                {/* Mini Equalizer Card */}
                <div className="p-3.5 rounded-2xl bg-nalar-surface border border-nalar-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-nalar-accent text-white flex items-center justify-center font-bold text-[11px]">
                      M&B
                    </div>
                    <div>
                      <p className="text-xs font-bold text-nalar-text">Maya & Budi</p>
                      <p className="text-[10px] text-nalar-muted">Transkrip Karaoke Live</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-6" aria-hidden="true">
                    {[50, 95, 65, 100, 45, 80, 90, 55, 75, 40].map((h, idx) => (
                      <span
                        key={idx}
                        style={{ height: `${h}%`, animationDelay: `${idx * 0.1}s` }}
                        className="w-1 rounded-full bg-nalar-accent animate-waveform"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bento 4 (7 Cols): Word DOCX Export with Real Tables */}
              <div className="md:col-span-7 floating-island rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 group hover:border-nalar-accent transition-all">
                <div className="space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-nalar-citationBg text-nalar-accent border border-nalar-citationBorder">
                    <FileText className="w-3 h-3" />
                    Native Word (.docx) Generator
                  </span>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-nalar-text">
                    Ekspor Laporan & Tabel Komparasi ke Microsoft Word
                  </h3>
                  <p className="text-xs sm:text-sm text-nalar-muted leading-relaxed">
                    Tidak perlu merapikan ulang format secara manual. Heading, daftar poin, hingga tabel perbandingan multi-dokumen langsung terkonversi menjadi tabel Word asli yang siap dipresentasikan.
                  </p>
                </div>

                {/* Mini Word Document Sheet Preview */}
                <div className="p-4 rounded-2xl bg-nalar-surface border border-nalar-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 w-full">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">
                        DOCX
                      </span>
                      <span className="font-serif font-bold text-xs text-nalar-text">
                        Matriks-Komparasi-Vendor-2026.docx
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
                      <div className="p-1.5 rounded bg-nalar-citationBg text-nalar-accent font-semibold border border-nalar-citationBorder">
                        Aspek Kontrak
                      </div>
                      <div className="p-1.5 rounded bg-nalar-card border border-nalar-border text-nalar-muted">
                        Vendor A: 90 Hari
                      </div>
                      <div className="p-1.5 rounded bg-nalar-card border border-nalar-border text-nalar-muted">
                        Vendor B: 60 Hari
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/signup"
                    className="px-4 py-2 rounded-xl bg-nalar-accent text-white text-xs font-semibold hover:bg-nalar-accentHover transition shrink-0 shadow-xs"
                  >
                    Coba Ekspor →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Step Workflow */}
        <section id="alur-kerja" className="py-20 bg-nalar-bg relative">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-nalar-accent mb-2 block">
              Alur Kerja Efisien
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-nalar-text">
              Dari Tumpukan Berkas ke Keputusan Tajam dalam 3 Langkah
            </h2>
            <p className="text-xs sm:text-sm text-nalar-muted mb-12 max-w-xl mx-auto">
              Tanpa konfigurasi rumit. Setiap ruang notebook terisolasi aman untuk masing-masing proyek Anda.
            </p>

            <div className="grid md:grid-cols-3 gap-5 text-left">
              {[
                {
                  num: '01',
                  title: 'Unggah Berkas atau Tautan',
                  desc: 'Tarik berkas PDF, Word, Excel, CSV, atau tempel tautan Google Drive & halaman web ke dalam notebook proyek.',
                },
                {
                  num: '02',
                  title: 'Tanya AI & Inspeksi Sitasi',
                  desc: 'Ajukan pertanyaan spesifik. Klik sitasi [S#] untuk melompat langsung ke halaman PDF asli beserta sorotan kalimat.',
                },
                {
                  num: '03',
                  title: 'Sintesis Studio & Unduh .docx',
                  desc: 'Hasilkan 8 format laporan eksekutif, matriks perbandingan, atau dengarkan podcast diskusi lalu bagikan tautan baca.',
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="p-6 rounded-2xl floating-island flex flex-col justify-between gap-4 hover:border-nalar-accent/60 transition-colors"
                >
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-nalar-citationBg text-nalar-accent border border-nalar-citationBorder w-fit">
                    LANGKAH {step.num}
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg mb-1.5 text-nalar-text">
                      {step.title}
                    </h3>
                    <p className="text-xs text-nalar-muted leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Callout Banner */}
        <section className="py-16 px-4 bg-nalar-surface/80 border-t border-nalar-border">
          <div className="container mx-auto max-w-4xl">
            <div className="floating-island rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 ambient-mesh pointer-events-none" aria-hidden="true" />
              <div className="relative z-10">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 text-nalar-text">
                  Siap Mengubah Cara Anda Menelaah Dokumen?
                </h2>
                <p className="text-xs sm:text-sm text-nalar-muted max-w-lg mx-auto mb-7 leading-relaxed">
                  Mulai ruang riset pribadi Anda sekarang. Gratis, terenkripsi dengan isolasi multi-tenant, dan siap mengekspor laporan dalam hitungan detik.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-nalar-accent text-white font-semibold px-7 py-3 rounded-xl shadow-xs hover:bg-nalar-accentHover transition-all text-xs sm:text-sm"
                >
                  Mulai Riset Sekarang Gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-nalar-border bg-nalar-card py-8 text-xs text-nalar-muted relative z-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-icon.png"
              alt="Nalar Logo"
              width={20}
              height={20}
              className="w-5 h-5 object-contain"
            />
            <span className="font-serif font-bold text-nalar-text">Nalar</span>
            <span>• AI Document Synthesis</span>
          </div>

          <p>© {new Date().getFullYear()} Nalar. Hak cipta dilindungi undang-undang.</p>

          <div className="flex items-center gap-2 text-[11px] text-nalar-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Seluruh Sistem Operasional</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
