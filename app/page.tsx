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
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="gradient-glow w-[500px] h-[500px] bg-blue-500/15 top-[-100px] left-[-100px]" />
      <div className="gradient-glow w-[600px] h-[600px] bg-indigo-500/15 top-[20%] right-[-150px]" />
      <div className="gradient-glow w-[500px] h-[500px] bg-purple-500/10 bottom-[10%] left-[10%]" />

      {/* Glass Header */}
      <header className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-1 rounded-xl bg-primary/10 border border-primary/20 group-hover:scale-105 transition-transform">
              <Image
                src="/logo-icon.png"
                alt="Nalar Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight leading-none">Nalar</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">Personal NotebookLM</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/signup"
              className="text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-1.5"
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
        <section className="pt-16 pb-20 md:pt-24 md:pb-28 px-4 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary mb-6 shadow-xs animate-in fade-in slide-in-from-top-4 duration-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Notebook Cerdas • Multi-Dokumen RAG & Auto OCR</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-[1.15] max-w-4xl mx-auto">
            Pahami & Sintesis Dokumen Kompleks <br className="hidden sm:inline" />
            <span className="gradient-text">Hanya Berdasarkan Fakta</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload hingga belasan PDF (termasuk hasil scan fisik), Word, dan Excel. Tanyakan apa saja dengan jaminan jawaban bersitasi halaman asli, dan ekspor rangkuman ke Word (.docx) dalam 1 klik.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto mb-16">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
            >
              Mulai Sekarang Gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center font-semibold px-6 py-3.5 rounded-xl border bg-card/60 backdrop-blur hover:bg-muted/60 transition-all text-sm text-foreground"
            >
              Buka Notebook Saya
            </Link>
          </div>

          {/* Interactive UI Mockup Showcase */}
          <div className="glass-card rounded-2xl p-2 sm:p-4 border shadow-2xl max-w-4xl mx-auto text-left overflow-hidden">
            <div className="flex items-center justify-between pb-3 px-2 border-b text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="ml-2 font-semibold text-foreground truncate">Riset Pasar & Inovasi 2026</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-[11px]">
                8 Dokumen Aktif
              </span>
            </div>

            <div className="grid md:grid-cols-12 gap-3 pt-3">
              {/* Left Column: Sample Source Documents */}
              <div className="hidden md:flex md:col-span-4 flex-col gap-2 p-2.5 rounded-xl bg-muted/30 border text-xs">
                <p className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Sumber Dokumen</p>
                <div className="p-2 rounded-lg bg-card border flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium truncate">Laporan_Industri_AI_2026.pdf</span>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                </div>
                <div className="p-2 rounded-lg bg-card border flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium truncate">Analisis_Pasar_Global.xlsx</span>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                </div>
                <div className="p-2 rounded-lg bg-card border flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium truncate">Strategi_Transformasi.docx</span>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                </div>
                <p className="text-[10px] text-muted-foreground text-center pt-1">+ 5 dokumen lainnya aktif</p>
              </div>

              {/* Right Column: Chat QA & Word Download Card */}
              <div className="md:col-span-8 flex flex-col gap-2.5 p-2 sm:p-3 rounded-xl bg-card border shadow-xs">
                {/* User Message */}
                <div className="self-end max-w-[85%] bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-xs text-xs font-medium">
                  Rangkum temuan utama dari dokumen riset ke format Word secara detail.
                </div>

                {/* Assistant Message with Word Card */}
                <div className="self-start w-full space-y-2 text-xs">
                  {/* Generated Word Card */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate">Rangkuman-Riset-Pasar-2026.docx</p>
                        <p className="text-[10px] text-muted-foreground">Microsoft Word • Format Lengkap</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold">
                      <Download className="w-3 h-3" />
                      Unduh .docx
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border leading-relaxed space-y-1.5 text-foreground">
                    <p className="font-bold text-primary"># Rangkuman Eksekutif Riset 2026</p>
                    <p>
                      Berdasarkan analisis terhadap dokumen yang diunggah, berikut ringkasan temuan utama:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                      <li><strong>Adopsi Teknologi AI:</strong> Terjadi peningkatan efisiensi operasional sebesar 35% pada berbagai sektor industri <span className="text-[10px] bg-primary/10 text-primary px-1 rounded font-mono">[S1 Hal. 4]</span>.</li>
                      <li><strong>Efisiensi Anggaran:</strong> Fokus investasi pada otomatisasi alur kerja dan keamanan data perusahaan <span className="text-[10px] bg-primary/10 text-primary px-1 rounded font-mono">[S2 Hal. 12]</span>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-20 border-t bg-muted/20 relative">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                Fitur Unggulan Riset Cerdas
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Dirancang khusus untuk profesional, akademisi, dan tim yang mengelola tumpukan dokumen penting setiap hari.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {/* Feature 1 */}
              <div className="glass-card p-6 rounded-2xl flex flex-col gap-3.5 group hover:border-primary/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base sm:text-lg">Multi-Source Synthesis</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Analisis hingga puluhan dokumen sekaligus dengan kapasitas konteks hingga 64 chunk. Tidak ada berkas yang ditinggalkan atau diabaikan.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card p-6 rounded-2xl flex flex-col gap-3.5 group hover:border-primary/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ScanText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base sm:text-lg">Auto OCR PDF Scan</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Dokumen fisik atau PDF hasil scan otomatis ditranskripsikan menggunakan teknologi Gemini Vision OCR tanpa perlu alat konversi pihak ketiga.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card p-6 rounded-2xl flex flex-col gap-3.5 group hover:border-primary/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base sm:text-lg">Ekspor Word (.docx) Instan</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Ubah rangkuman, laporan perbandingan, atau sintesis jawaban menjadi file Microsoft Word siap pakai lengkap dengan format heading dan tabel.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="glass-card p-6 rounded-2xl flex flex-col gap-3.5 group hover:border-primary/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base sm:text-lg">Sitasi Presisi [S#]</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Setiap klaim yang dihasilkan AI disertai chip sitasi yang mengarahkan langsung ke nomor halaman dokumen sumber aslinya. Bebas halusinasi.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="glass-card p-6 rounded-2xl flex flex-col gap-3.5 group hover:border-primary/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base sm:text-lg">Dual AI Fallback</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Mengandalkan Google Gemini dengan sistem auto-fallback cerdas ke Groq saat batas kuota atau kendala jaringan serverless terjadi.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="glass-card p-6 rounded-2xl flex flex-col gap-3.5 group hover:border-primary/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base sm:text-lg">Berbagi Publik & Kolaborasi</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Bagikan notebook hasil riset kepada rekan kerja atau klien melalui tautan publik yang aman, rapi, dan mudah dibaca di smartphone.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Step Workflow */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
              Cara Kerja Sederhana dalam 3 Langkah
            </h2>
            <p className="text-sm text-muted-foreground mb-14 max-w-xl mx-auto">
              Tidak perlu konfigurasi rumit. Mulai dalam hitungan detik.
            </p>

            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="p-6 rounded-2xl bg-card border relative">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm mb-4">
                  1
                </span>
                <h3 className="font-bold text-base mb-2">Unggah Dokumen</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Drag and drop file PDF, Word, Excel, CSV, atau masukkan link web / Google Drive ke dalam notebook Anda.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border relative">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm mb-4">
                  2
                </span>
                <h3 className="font-bold text-base mb-2">Tanya & Analisis</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ajukan pertanyaan spesifik atau minta AI merangkum seluruh dokumen yang ada. Riwayat chat otomatis tersimpan.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border relative">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm mb-4">
                  3
                </span>
                <h3 className="font-bold text-base mb-2">Ekspor Word & Bagikan</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Unduh hasil jawaban langsung menjadi dokumen Word (.docx) atau bagikan link notebook kepada tim Anda.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="glass-card rounded-3xl p-8 sm:p-12 text-center border relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-blue-500/10">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Siap Meningkatkan Produktivitas Riset Anda?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-8">
                Tinggalkan cara lama membaca ratusan halaman dokumen secara manual. Biarkan Nalar mengekstrak dan menyintesis data untuk Anda.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] transition-all text-sm"
              >
                Mulai Riset Sekarang Gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass border-t py-8 text-xs text-muted-foreground relative z-10">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-icon.png"
              alt="Nalar Logo"
              width={20}
              height={20}
              className="w-5 h-5 object-contain"
            />
            <span className="font-bold text-foreground">Nalar</span>
            <span>• Personal AI Notebook</span>
          </div>

          <p>© {new Date().getFullYear()} Nalar. Hak cipta dilindungi undang-undang.</p>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Semua Layanan Berjalan Normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
