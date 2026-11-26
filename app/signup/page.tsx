'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle, CheckCircle2, Sparkles, ShieldCheck, Layers } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          if (j?.message) setError(j.message);
        }
      })
      .catch(() => {});
  }, []);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const healthRes = await fetch('/api/health').catch(() => null);
      if (healthRes && !healthRes.ok) {
        const j = await healthRes.json().catch(() => null);
        throw new Error(
          j?.message ||
            'Database Supabase sedang tidak aktif (Paused). Aktifkan kembali di Supabase Dashboard.'
        );
      }

      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/notebooks`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar dengan Google');
      setGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Kata sandi minimal harus 6 karakter');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || 'Gagal mendaftarkan akun baru.');
        return;
      }

      if (json?.hasSession) {
        router.push('/notebooks');
        router.refresh();
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Tidak dapat terhubung ke server aplikasi. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-nalar-bg text-nalar-text">
      {/* Left Column (5 Cols) - Form & Brand */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-nalar-card border-r border-nalar-border">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5 group w-fit">
            <div className="p-1 rounded-xl bg-nalar-citationBg border border-nalar-citationBorder group-hover:scale-105 transition-transform">
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
          <ThemeToggle compact />
        </div>

        <div className="py-8 my-auto w-full max-w-sm mx-auto space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-nalar-text">
              Buat Akun Baru
            </h1>
            <p className="text-xs sm:text-sm text-nalar-muted">
              Mulai ruang riset terisolasi & sintesis multi-dokumen Anda
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4 py-6 px-4 rounded-2xl border border-nalar-border bg-nalar-bg">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-nalar-text">Cek Email Anda</h3>
              <p className="text-xs text-nalar-muted leading-relaxed">
                Tautan verifikasi telah dikirim ke <strong>{email}</strong>. Silakan konfirmasi untuk mulai menggunakan Nalar.
              </p>
              <Link
                href="/login"
                className="inline-block text-xs text-nalar-accent font-semibold hover:underline pt-1"
              >
                Kembali ke Halaman Masuk →
              </Link>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-nalar-border bg-nalar-card hover:bg-nalar-surface text-xs font-semibold text-nalar-text transition-all shadow-2xs cursor-pointer disabled:opacity-50"
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
                <span>Daftar dengan Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-nalar-border w-full" />
                <span className="bg-nalar-card px-3 text-[11px] uppercase tracking-wider text-nalar-muted font-medium absolute">
                  atau dengan email
                </span>
              </div>

              <form onSubmit={handleSignup} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-nalar-text" htmlFor="fullName">
                    Nama Lengkap
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-nalar-border bg-nalar-bg text-xs text-nalar-text focus:outline-none focus:ring-2 focus:ring-nalar-accent/30 focus:border-nalar-accent transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-nalar-text" htmlFor="email">
                    Alamat Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-nalar-border bg-nalar-bg text-xs text-nalar-text focus:outline-none focus:ring-2 focus:ring-nalar-accent/30 focus:border-nalar-accent transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-nalar-text" htmlFor="password">
                    Kata Sandi
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-nalar-border bg-nalar-bg text-xs text-nalar-text focus:outline-none focus:ring-2 focus:ring-nalar-accent/30 focus:border-nalar-accent transition-all shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full flex items-center justify-center gap-2 bg-nalar-accent text-white font-semibold py-2.5 rounded-xl hover:bg-nalar-accentHover focus:outline-none focus:ring-2 focus:ring-nalar-accent/30 disabled:opacity-60 transition-all text-xs shadow-xs cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Daftar Akun Gratis'}
                </button>
              </form>

              <p className="text-center text-xs text-nalar-muted pt-1">
                Sudah memiliki akun?{' '}
                <Link href="/login" className="text-nalar-accent font-semibold hover:underline">
                  Masuk di sini
                </Link>
              </p>
            </>
          )}
        </div>

        <div className="text-[11px] text-nalar-muted pt-4 border-t border-nalar-border/60 flex items-center justify-between">
          <span>© 2026 Nalar — AI Document Synthesis</span>
          <Link href="/" className="hover:text-nalar-text transition">
            Kembali ke Beranda
          </Link>
        </div>
      </div>

      {/* Right Column (7 Cols) - Editorial Highlights */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-center p-12 xl:p-16 bg-nalar-surface relative overflow-hidden">
        <div className="absolute inset-0 editorial-grid-fade opacity-70 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 ambient-mesh pointer-events-none" aria-hidden="true" />
        <div className="max-w-xl mx-auto space-y-8 relative z-10">
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-nalar-accent">
              Ruang Riset Privat & Terisolasi
            </span>
            <h2 className="font-serif text-2xl xl:text-3xl font-bold text-nalar-text leading-snug">
              Kelola puluhan berkas kompleks dalam satu ruang analisis cerdas.
            </h2>
            <p className="text-xs text-nalar-muted leading-relaxed">
              Setiap notebook Anda terlindungi dengan isolasi keamanan Row-Level Security (RLS), sitasi halaman asli, dan ekspor dokumen Word (.docx) profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            <div className="floating-island p-4 rounded-2xl flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-nalar-citationBg text-nalar-accent flex items-center justify-center shrink-0 border border-nalar-citationBorder">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-nalar-text">Multi-Format & OCR Otomatis</h4>
                <p className="text-xs text-nalar-muted mt-0.5 leading-relaxed">
                  Unggah PDF digital maupun hasil scan fisik, dokumen Word, tabel Excel, CSV, hingga tautan Google Drive & artikel web.
                </p>
              </div>
            </div>

            <div className="floating-island p-4 rounded-2xl flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-nalar-citationBg text-nalar-accent flex items-center justify-center shrink-0 border border-nalar-citationBorder">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-nalar-text">8 Format Studio Sintesis & Podcast AI</h4>
                <p className="text-xs text-nalar-muted mt-0.5 leading-relaxed">
                  Buat Matriks Komparasi tabel, Ringkasan Eksekutif, Briefing, Linimasa, hingga diskusi Audio Podcast dua pembicara dalam 1 klik.
                </p>
              </div>
            </div>

            <div className="floating-island p-4 rounded-2xl flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-nalar-citationBg text-nalar-accent flex items-center justify-center shrink-0 border border-nalar-citationBorder">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-nalar-text">Privasi Penuh & Sitasi Terverifikasi</h4>
                <p className="text-xs text-nalar-muted mt-0.5 leading-relaxed">
                  Dokumen tidak pernah bocor antar akun, dan setiap klaim AI terhubung langsung ke halaman sumber aslinya.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
