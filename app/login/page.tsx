'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/notebooks';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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

  return (
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
        <h1 className="text-2xl font-bold tracking-tight">Selamat Datang di Nalar</h1>
        <p className="text-sm text-muted-foreground">
          Masuk ke akun Anda untuk mengakses notebook & dokumen
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground/80" htmlFor="password">
              Password
            </label>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 transition-all text-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Masuk'}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground pt-2">
        Belum punya akun?{' '}
        <Link href="/signup" className="text-primary font-semibold hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/20">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-primary" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
