import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

function mapAuthErrorMessage(rawMessage: string): { status: number; message: string } {
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('enotfound') ||
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout')
  ) {
    return {
      status: 503,
      message:
        'Server database Supabase tidak dapat dihubungi (kemungkinan proyek Supabase berstatus Paused karena tidak aktif >7 hari). Silakan buka Dashboard Supabase lalu klik "Restore Project".',
    };
  }

  if (lower.includes('invalid login credentials')) {
    return {
      status: 401,
      message: 'Alamat email atau kata sandi tidak sesuai. Pastikan akun sudah terdaftar.',
    };
  }

  if (lower.includes('email not confirmed')) {
    return {
      status: 403,
      message:
        'Alamat email Anda belum diverifikasi. Silakan cek kotak masuk/folder Spam email Anda, atau nonaktifkan "Confirm email" di Supabase Dashboard → Authentication → Providers → Email.',
    };
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return {
      status: 429,
      message: 'Terlalu banyak percobaan dalam waktu singkat. Silakan tunggu sekitar 1 menit lalu coba kembali.',
    };
  }

  return {
    status: 400,
    message: rawMessage || 'Gagal melakukan autentikasi.',
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Alamat email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const mapped = mapAuthErrorMessage(error.message || 'Gagal masuk');
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    // Ensure user profile row exists in `profiles` table so foreign keys never fail
    if (data.user) {
      try {
        const admin = createAdminClient();
        const fallbackName =
          data.user.user_metadata?.full_name ||
          data.user.email?.split('@')[0] ||
          'Pengguna';
        await admin
          .from('profiles')
          .upsert(
            { id: data.user.id, display_name: fallbackName },
            { onConflict: 'id', ignoreDuplicates: true }
          );
      } catch {
        // Non-fatal if service role key is not configured
      }
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (err: any) {
    const rawMsg =
      err?.cause?.code === 'ENOTFOUND'
        ? `ENOTFOUND ${err?.cause?.hostname || ''}`
        : err?.message || 'Internal auth error';
    const mapped = mapAuthErrorMessage(rawMsg);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
