'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Password minimal harus 6 karakter');
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If confirmation is required
    if (data?.session) {
      router.push('/notebooks');
      router.refresh();
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-2xl border shadow-sm">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo-icon.png"
              alt="Nalar Logo"
              width={56}
              height={56}
              className="w-14 h-14 object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Buat Akun Baru</h1>
          <p className="text-sm text-muted-foreground">
            Mulai eksplorasi dokumen riset dengan Nalar AI
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-base">Cek Email Anda</h3>
            <p className="text-sm text-muted-foreground">
              Tautan konfirmasi telah dikirim ke <strong>{email}</strong>. Silakan verifikasi untuk mulai menggunakan Nalar.
            </p>
            <Link
              href="/login"
              className="inline-block text-sm text-primary font-medium hover:underline pt-2"
            >
              Kembali ke Halaman Masuk
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80" htmlFor="fullName">
                  Nama Lengkap
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 transition-all text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Daftar Akun'}
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground pt-2">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

