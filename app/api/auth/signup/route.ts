import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

function mapSignupErrorMessage(rawMessage: string): { status: number; message: string } {
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

  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return {
      status: 409,
      message: 'Alamat email ini sudah terdaftar. Silakan langsung masuk di halaman Login.',
    };
  }

  if (lower.includes('error sending confirmation email') || lower.includes('email rate limit')) {
    return {
      status: 429,
      message:
        'Batas pengiriman email verifikasi bawaan Supabase telah tercapai. Nonaktifkan opsi "Confirm email" di Supabase Dashboard → Authentication → Providers → Email agar pendaftaran langsung aktif.',
    };
  }

  if (lower.includes('password should be at least')) {
    return {
      status: 400,
      message: 'Kata sandi minimal harus terdiri dari 6 karakter.',
    };
  }

  return {
    status: 400,
    message: rawMessage || 'Gagal mendaftarkan akun baru.',
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Alamat email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Kata sandi minimal harus 6 karakter.' },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
        emailRedirectTo: `${origin}/auth/callback?next=/notebooks`,
      },
    });

    if (error) {
      const mapped = mapSignupErrorMessage(error.message || 'Gagal mendaftar');
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    // Supabase returns a user with empty identities array when email is already registered and obfuscation is on
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return NextResponse.json(
        { error: 'Alamat email ini sudah terdaftar. Silakan masuk melalui halaman Login.' },
        { status: 409 }
      );
    }

    if (data.user) {
      try {
        const admin = createAdminClient();
        await admin
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              display_name: fullName || email.split('@')[0],
            },
            { onConflict: 'id' }
          );
      } catch {
        // Non-fatal fallback
      }
    }

    return NextResponse.json({
      ok: true,
      hasSession: Boolean(data.session),
      requiresEmailConfirmation: !data.session,
    });
  } catch (err: any) {
    const rawMsg =
      err?.cause?.code === 'ENOTFOUND'
        ? `ENOTFOUND ${err?.cause?.hostname || ''}`
        : err?.message || 'Internal signup error';
    const mapped = mapSignupErrorMessage(rawMsg);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
