import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  FileText,
  Download,
  CheckCircle2,
  Cpu,
  Share2,
  ScanText,
  Scale,
  Radio,
  Bookmark,
  Check,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-nalar-bg text-nalar-text relative overflow-hidden">
      {/* Editorial Header */}
      <header className="sticky top-0 z-50 border-b border-[#E5E0D5] bg-[#FAF8F5]/90 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-1 rounded-xl bg-[#F3EAE2] border border-[#DFC9B8]/60 group-hover:scale-105 transition-transform">
              <Image
                src="/logo-icon.png"
                alt="Nalar Logo"
                width={30}
                height={30}
                className="w-7 h-7 object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg sm:text-xl tracking-tight leading-none text-nalar-text">
                Nalar
              </span>
              <span className="text-[10px] text-nalar-muted font-medium tracking-wide">
                AI Document Synthesis
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-medium text-nalar-muted hover:text-nalar-text px-3 py-1.5 rounded-lg hover:bg-[#F3F0EA] transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/signup"
              className="text-xs sm:text-sm font-semibold bg-nalar-accent text-white hover:bg-nalar-accentHover px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Mulai Gratis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="pt-14 pb-16 md:pt-20 md:pb-24 px-4 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#DFC9B8] bg-[#F3EAE2] text-xs font-semibold text-[#A6421D] mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Editorial Warmth • Multi-Document RAG & Fact Grounding</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.18] max-w-4xl mx-auto text-nalar-text">
            Pahami & Sintesis Dokumen Kompleks <br className="hidden sm:inline" />
            <span className="gradient-text italic font-normal">Hanya Berdasarkan Fakta</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-nalar-muted mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload hingga belasan PDF (termasuk hasil scan fisik), Word, dan Excel. Tanyakan apa saja dengan jaminan jawaban bersitasi halaman asli, dan ekspor rangkuman ke Word (.docx) dalam 1 klik.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto mb-14">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-nalar-accent text-white font-semibold px-6 py-3 rounded-xl shadow-xs hover:bg-nalar-accentHover hover:scale-[1.01] active:scale-[0.99] transition-all text-xs sm:text-sm"
            >
              Mulai Sekarang Gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center font-semibold px-6 py-3 rounded-xl border border-[#E5E0D5] bg-white hover:bg-[#F3F0EA] transition-all text-xs sm:text-sm text-nalar-text shadow-2xs"
            >
              Buka Notebook Saya
            </Link>
          </div>

          {/* 3-Column UI Mockup Showcase (Editorial Warmth Style) */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-4 border border-[#E5E0D5] shadow-sm max-w-5xl mx-auto text-left overflow-hidden">
            {/* Mockup Header Bar */}
            <div className="flex items-center justify-between pb-3 px-2 border-b border-[#E5E0D5] text-xs text-nalar-muted">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5E0D5]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5E0D5]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5E0D5]" />
                <span className="ml-2 font-serif font-bold text-nalar-text truncate">
                  Project 2026 • Analisis Dokumen & Kontrak Kerja
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F3EAE2] text-[#A6421D] font-semibold text-[11px] border border-[#DFC9B8]">
                8 Dokumen Aktif
              </span>
            </div>

            {/* 3-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 text-xs">
              {/* Column 1 (3 Cols): Sumber Dokumen */}
              <div className="hidden md:flex md:col-span-3 flex-col gap-2 p-3 rounded-xl bg-[#F3F0EA] border border-[#E5E0D5]">
                <p className="font-bold text-[10px] uppercase tracking-wider text-nalar-muted">
                  Sumber Dokumen (3/8)
                </p>
                <div className="p-2 rounded-lg bg-white border border-[#E5E0D5] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-nalar-accent shrink-0" />
                    <span className="font-medium text-[11px] truncate text-nalar-text">SPK_Pengadaan_2026.pdf</span>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <div className="p-2 rounded-lg bg-white border border-[#E5E0D5] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-nalar-accent shrink-0" />
                    <span className="font-medium text-[11px] truncate text-nalar-text">RAB_Alokasi_Biaya.xlsx</span>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <div className="p-2 rounded-lg bg-white border border-[#E5E0D5] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-nalar-accent shrink-0" />
                    <span className="font-medium text-[11px] truncate text-nalar-text">TOR_Spesifikasi_Teknis.docx</span>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <p className="text-[10px] text-nalar-muted text-center pt-1 italic">+ 5 dokumen lainnya aktif</p>
              </div>

              {/* Column 2 (5 Cols): Chat Sintesis & Word Export Card */}
              <div className="md:col-span-5 flex flex-col gap-2.5 p-3 rounded-xl bg-white border border-[#E5E0D5] shadow-2xs">
                {/* User Message */}
                <div className="self-end max-w-[90%] bg-nalar-accent text-white p-2.5 rounded-xl rounded-tr-xs text-[11px] font-medium shadow-2xs">
                  Rangkum klausul utama SPK dan komparasikan dengan alokasi RAB ke format Word.
                </div>

                {/* AI Assistant Paper Response */}
                <div className="space-y-2 text-xs">
                  {/* Generated Word Card */}
                  <div className="flex items-center justify-between p-2 rounded-xl border border-[#E5E0D5] bg-[#FAF8F5]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#F3EAE2] text-[#C25127] flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] truncate text-nalar-text">Rangkuman-SPK-dan-RAB.docx</p>
                        <p className="text-[10px] text-nalar-muted">Microsoft Word • Lengkap</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-nalar-accent text-white text-[10px] font-semibold shrink-0">
                      <Download className="w-2.5 h-2.5" />
                      Unduh .docx
                    </span>
                  </div>

                  {/* Synthesized Text with Interactive Citation Pills */}
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D5] leading-relaxed space-y-1.5 text-nalar-text text-[11px]">
                    <p className="font-serif font-bold text-xs text-nalar-text"># Ringkasan Eksekutif Analisis</p>
                    <p>
                      Berdasarkan ketentuan Pasal 4 ayat 2{' '}
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-[#F3EAE2] text-[#A6421D] border border-[#DFC9B8] text-[10px] font-semibold cursor-pointer">
                        [S1 Hal. 4]
                      </span>
                      , jadwal implementasi disepakati 90 hari kalender dengan termin pencairan bertahap sesuai capaian milestone di lembar RAB{' '}
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-[#F3EAE2] text-[#A6421D] border border-[#DFC9B8] text-[10px] font-semibold cursor-pointer">
                        [S2 Sheet. 1]
                      </span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Column 3 (4 Cols): Highlight Kutipan Dokumen Asli */}
              <div className="hidden md:flex md:col-span-4 flex-col gap-2 p-3 rounded-xl bg-[#F3F0EA] border border-[#E5E0D5]">
                <div className="flex items-center justify-between pb-1 border-b border-[#E5E0D5]/70">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-nalar-text">
                    <Bookmark className="w-3.5 h-3.5 text-nalar-accent" />
                    <span>Inspeksi Sitasi [S1]</span>
                  </div>
                  <span className="text-[10px] font-mono text-nalar-muted">Hal. 4</span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#E5E0D5] space-y-1 text-[11px]">
                  <p className="font-semibold text-nalar-text truncate">SPK_Pengadaan_2026.pdf</p>
                  <p className="text-[10px] text-nalar-muted">Chunk #14 • Terverifikasi</p>
                </div>

                {/* Highlighted Quote Box */}
                <div className="p-2.5 rounded-xl bg-[#FEF3C7] border-l-4 border-[#C25127] border-y border-r border-[#E5E0D5] text-[11px] leading-relaxed text-nalar-text space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-[#A6421D] uppercase block">
                    Kutipan Asli Dokumen:
                  </span>
                  <p className="font-mono text-[10px] italic text-nalar-text/90">
                    &quot;Pihak kedua wajib menyelesaikan seluruh instalasi sistem dan menyerahkan Berita Acara Serah Terima dalam waktu 90 hari kalender sejak SPMK terbit.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Bento Grid */}
        <section className="py-20 border-t border-[#E5E0D5] bg-[#F3F0EA]">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-nalar-accent mb-2 block">
                Kapabilitas Inti
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 text-nalar-text">
                Fitur Unggulan Riset Cerdas
              </h2>
              <p className="text-xs sm:text-sm text-nalar-muted leading-relaxed">
                Dirancang dengan arsitektur multi-tenant aman, RAG hybrid search, dan antarmuka editorial yang nyaman untuk riset mendalam.
              </p>
            </div>

            {/* Asymmetrical Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* Bento 1: Multi-Source Synthesis (Large: md:col-span-2) */}
              <div className="md:col-span-2 bg-white border border-[#E5E0D5] p-6 sm:p-8 rounded-2xl flex flex-col justify-between shadow-2xs group hover:border-[#C25127] transition-all">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3EAE2] text-[#C25127] flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-nalar-text">
                    Multi-Source Balanced Synthesis
                  </h3>
                  <p className="text-xs sm:text-sm text-nalar-muted leading-relaxed max-w-xl">
                    Sintesis hingga belasan dokumen secara seimbang. Sistem RAG kami memastikan setiap dokumen sumber aktif mendapatkan porsi representasi yang proporsional tanpa ada berkas penting yang terlewatkan.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#E5E0D5]/70 flex items-center justify-between text-xs text-nalar-muted">
                  <span className="font-medium text-nalar-accent">Hingga 64 konteks chunk aktif</span>
                  <span>Hybrid Vector + FTS RRF →</span>
                </div>
              </div>

              {/* Bento 2: Auto OCR Scan Fisik (md:col-span-1) */}
              <div className="md:col-span-1 bg-white border border-[#E5E0D5] p-6 rounded-2xl flex flex-col justify-between shadow-2xs group hover:border-[#C25127] transition-all">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3EAE2] text-[#C25127] flex items-center justify-center">
                    <ScanText className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-nalar-text">
                    Auto OCR Scan Fisik
                  </h3>
                  <p className="text-xs text-nalar-muted leading-relaxed">
                    Dokumen hasil scan foto atau lembaran fisik ditranskripsikan otomatis oleh Gemini Vision OCR ke teks terstruktur.
                  </p>
                </div>
                <span className="text-xs font-semibold text-nalar-accent pt-4 border-t border-[#E5E0D5]/70 block">
                  Presisi Teks Tinggi →
                </span>
              </div>

              {/* Bento 3: Ekspor Word (.docx) & Studio (md:col-span-1) */}
              <div className="md:col-span-1 bg-white border border-[#E5E0D5] p-6 rounded-2xl flex flex-col justify-between shadow-2xs group hover:border-[#C25127] transition-all">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3EAE2] text-[#C25127] flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-nalar-text">
                    Ekspor Word (.docx) Instan
                  </h3>
                  <p className="text-xs text-nalar-muted leading-relaxed">
                    Ubah rangkuman eksekutif, tabel komparasi, atau jawaban chat menjadi file Microsoft Word rapi dalam 1 klik.
                  </p>
                </div>
                <span className="text-xs font-semibold text-nalar-accent pt-4 border-t border-[#E5E0D5]/70 block">
                  Format Dokumen Standar →
                </span>
              </div>

              {/* Bento 4: In-App Split Viewer & Sitasi Presisi (Large: md:col-span-2) */}
              <div className="md:col-span-2 bg-white border border-[#E5E0D5] p-6 sm:p-8 rounded-2xl flex flex-col justify-between shadow-2xs group hover:border-[#C25127] transition-all">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3EAE2] text-[#C25127] flex items-center justify-center">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-nalar-text">
                    In-App Split Viewer & Smart Citation Highlight
                  </h3>
                  <p className="text-xs sm:text-sm text-nalar-muted leading-relaxed max-w-xl">
                    Periksa kebenaran jawaban AI secara berdampingan tanpa perlu membuka aplikasi terpisah. Klik sitasi [S#] dan dokumen PDF akan melompat langsung ke halaman yang bersangkutan dengan kutipan kalimat tersorot.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#E5E0D5]/70 flex items-center justify-between text-xs text-nalar-muted">
                  <span className="font-medium text-nalar-accent">Zero Hallucination Proof</span>
                  <span>Interactive Split View 50% →</span>
                </div>
              </div>

              {/* Bento 5: Matriks Komparasi & Audio Overview (md:col-span-3) */}
              <div className="md:col-span-3 bg-white border border-[#E5E0D5] p-6 sm:p-7 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs group hover:border-[#C25127] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3EAE2] text-[#C25127] flex items-center justify-center shrink-0">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-nalar-text">
                      Matriks Komparasi Dokumen & Audio Overview AI Podcast
                    </h3>
                    <p className="text-xs text-nalar-muted mt-0.5">
                      Bandingkan 2+ kontrak secara berdampingan dalam tabel aspek, atau dengarkan pembahasan dokumen via audio obrolan 2 karakter.
                    </p>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl bg-nalar-accent text-white text-xs font-semibold hover:bg-nalar-accentHover transition shrink-0 shadow-xs"
                >
                  Coba Sekarang
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Step Workflow */}
        <section className="py-20 bg-nalar-bg relative">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-nalar-text">
              Cara Kerja Sederhana dalam 3 Langkah
            </h2>
            <p className="text-xs sm:text-sm text-nalar-muted mb-12 max-w-xl mx-auto">
              Langsung bekerja tanpa setup yang rumit.
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-2xs relative">
                <span className="w-7 h-7 rounded-full bg-[#F3EAE2] text-[#A6421D] font-bold flex items-center justify-center text-xs mb-3 border border-[#DFC9B8]">
                  1
                </span>
                <h3 className="font-serif font-bold text-base mb-1.5 text-nalar-text">Unggah Dokumen</h3>
                <p className="text-xs text-nalar-muted leading-relaxed">
                  Drag and drop berkas PDF, Word, Excel, CSV, atau masukkan tautan Google Drive ke notebook Anda.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-2xs relative">
                <span className="w-7 h-7 rounded-full bg-[#F3EAE2] text-[#A6421D] font-bold flex items-center justify-center text-xs mb-3 border border-[#DFC9B8]">
                  2
                </span>
                <h3 className="font-serif font-bold text-base mb-1.5 text-nalar-text">Tanya & Analisis</h3>
                <p className="text-xs text-nalar-muted leading-relaxed">
                  Ajukan pertanyaan spesifik atau minta AI merangkum dan membandingkan dokumen. Riwayat percakapan tersimpan permanen.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-2xs relative">
                <span className="w-7 h-7 rounded-full bg-[#F3EAE2] text-[#A6421D] font-bold flex items-center justify-center text-xs mb-3 border border-[#DFC9B8]">
                  3
                </span>
                <h3 className="font-serif font-bold text-base mb-1.5 text-nalar-text">Ekspor Word & Bagikan</h3>
                <p className="text-xs text-nalar-muted leading-relaxed">
                  Unduh hasil sintesis langsung ke format Microsoft Word (.docx) atau bagikan notebook melalui link publik.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Callout Banner */}
        <section className="py-16 px-4 bg-[#F3F0EA] border-t border-[#E5E0D5]">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#E5E0D5] shadow-sm relative overflow-hidden">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-nalar-text">
                Siap Meningkatkan Produktivitas Riset Anda?
              </h2>
              <p className="text-xs sm:text-sm text-nalar-muted max-w-lg mx-auto mb-7 leading-relaxed">
                Tinggalkan cara manual membaca ratusan halaman dokumen. Biarkan Nalar menyintesis fakta penting dengan kutipan asli terverifikasi.
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
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E0D5] bg-white py-8 text-xs text-nalar-muted relative z-10">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
            <span>Sistem Berjalan Normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
