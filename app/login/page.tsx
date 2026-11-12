'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle, FileText, Bookmark, CheckCircle2, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/notebooks';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || 'Gagal masuk dengan Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-nalar-text">
          Masuk ke Nalar
        </h1>
        <p className="text-xs sm:text-sm text-nalar-muted">
          Akses ruang riset, dokumen, dan sintesis cerdas Anda
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Google Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#E5E0D5] bg-white hover:bg-[#F3F0EA] text-xs font-semibold text-nalar-text transition-all shadow-2xs cursor-pointer disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-nalar-accent" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Lanjutkan dengan Google</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-[#E5E0D5] w-full" />
        <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-nalar-muted font-medium absolute">
          atau dengan email
        </span>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-nalar-text" htmlFor="email">
            Alamat Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D5] bg-white text-xs text-nalar-text focus:outline-none focus:ring-2 focus:ring-nalar-accent/30 focus:border-nalar-accent transition-all shadow-2xs"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-nalar-text" htmlFor="password">
              Kata Sandi
            </label>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D5] bg-white text-xs text-nalar-text focus:outline-none focus:ring-2 focus:ring-nalar-accent/30 focus:border-nalar-accent transition-all shadow-2xs"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-nalar-accent text-white font-semibold py-2.5 rounded-xl hover:bg-nalar-accentHover focus:outline-none focus:ring-2 focus:ring-nalar-accent/30 disabled:opacity-60 transition-all text-xs shadow-xs cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Masuk ke Ruang Riset'}
        </button>
      </form>

      <p className="text-center text-xs text-nalar-muted pt-1">
        Belum memiliki akun?{' '}
        <Link href="/signup" className="text-nalar-accent font-semibold hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-nalar-bg">
      {/* Left Column (5 Cols) - Form & Brand */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-white border-r border-[#E5E0D5]">
        <Link href="/" className="inline-flex items-center gap-2.5 group w-fit">
          <div className="p-1 rounded-xl bg-[#F3EAE2] border border-[#DFC9B8]/60 group-hover:scale-105 transition-transform">
            <Image
              src="/logo-icon.png"
              alt="Nalar Logo"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
              priority
            />
          </div>
          <span className="font-serif font-bold text-lg text-nalar-text tracking-tight">Nalar</span>
        </Link>

        <div className="py-8 my-auto">
          <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-nalar-accent mx-auto" />}>
            <LoginForm />
          </Suspense>
        </div>

        <div className="text-[11px] text-nalar-muted pt-4 border-t border-[#E5E0D5]/60 flex items-center justify-between">
          <span>© 2026 Nalar — AI Document Synthesis</span>
          <Link href="/" className="hover:text-nalar-text transition">
            Kembali ke Beranda
          </Link>
        </div>
      </div>

      {/* Right Column (7 Cols) - Editorial Value Proposition & Citation Simulation */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-center p-12 xl:p-16 bg-[#F3F0EA] relative overflow-hidden">
        <div className="max-w-xl mx-auto space-y-8 relative z-10">
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-nalar-accent">
              Editorial Warmth & Fact Grounding
            </span>
            <blockquote className="font-serif italic text-2xl xl:text-3xl text-nalar-text leading-snug">
              &ldquo;Sintesis pengetahuan yang jernih, terstruktur, dan berpijak hanya pada fakta asli dari berkas Anda.&rdquo;
            </blockquote>
            <p className="text-xs text-nalar-muted leading-relaxed">
              Mulai dari berkas kontrak SPK, dokumen teknis TOR, laporan keuangan Excel, hingga scan fisik yang diekstrak dengan OCR presisi tinggi.
            </p>
          </div>

          {/* Interactive Citation Card Simulation */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E0D5]/70">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-nalar-accent" />
                <span className="font-serif font-bold text-nalar-text">Hasil Sintesis Multi-Sumber</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% Terverifikasi
              </span>
            </div>

            <p className="text-xs text-nalar-text leading-relaxed">
              Berdasarkan klausul pelaksanaan pekerjaan{' '}
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 mx-0.5 rounded-md bg-[#F3EAE2] text-[#A6421D] border border-[#DFC9B8] text-[11px] font-semibold">
                [S1 Hal. 4]
              </span>
              , seluruh kewajiban penyerahan laporan kemajuan mingguan wajib diselesaikan paling lambat 7 hari kerja sebelum termin pencairan kedua{' '}
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 mx-0.5 rounded-md bg-[#F3EAE2] text-[#A6421D] border border-[#DFC9B8] text-[11px] font-semibold">
                [S3]
              </span>.
            </p>

            {/* Highlighted Quote Box */}
            <div className="p-3 rounded-xl bg-[#FEF3C7] border-l-4 border-[#C25127] text-xs text-nalar-text space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#A6421D] font-bold">
                <span>Kutipan Langsung dari Berkas</span>
                <span>Pasal 8 Ayat 2</span>
              </div>
              <p className="font-mono text-[11px] leading-relaxed text-nalar-text/90 italic">
                &quot;...penyedia jasa wajib melampirkan Berita Acara Pemeriksaan Pekerjaan (BAPP) dan bukti serah terima parsial.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
