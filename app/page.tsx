import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-icon.png"
              alt="Nalar Logo"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
              priority
            />
            <span className="font-bold text-xl tracking-tight">Nalar</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
            >
              Mulai Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-28 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            AI Notebook dengan Dual Provider Fallback
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Pahami Dokumen Kompleks <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Hanya Berdasarkan Fakta
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Upload PDF, Word, Excel, hingga gambar. Tanyakan apa saja dengan jaminan jawaban
            disertai sitasi kutipan ke nomor halaman sumber aslinya.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-lg shadow-md hover:bg-primary/90 transition-all"
            >
              Coba Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center font-medium px-6 py-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              Buka Akun Saya
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 bg-muted/30 border-t">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-12">Fitur Utama</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">Grounded & Bersitasi</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Setiap klaim dilengkapi tautan chip referensi ke halaman dokumen yang relevan. Bebas halusinasi liar.
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-primary flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">Rantai AI Fallback</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bekerja dengan Google Gemini dan fallback otomatis ke Groq saat batas kuota atau kendala jaringan terjadi.
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-primary flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">Multi-Format Sumber</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dukung PDF digital, hasil pindaian OCR, DOCX, spreadsheet Excel, hingga file teks dalam satu wadah notebook.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Nalar — Personal AI Notebook.</p>
        </div>
      </footer>
    </div>
  );
}

