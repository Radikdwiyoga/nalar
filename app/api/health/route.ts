import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.json(
      {
        ok: false,
        code: 'MISSING_ENV',
        message: 'Konfigurasi NEXT_PUBLIC_SUPABASE_URL belum diatur.',
      },
      { status: 503 }
    );
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('ai_routes').select('id').limit(1);

    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes('enotfound') || lower.includes('fetch failed')) {
        return NextResponse.json(
          {
            ok: false,
            code: 'SUPABASE_PAUSED_OR_UNREACHABLE',
            message:
              'Database Supabase tidak dapat dijangkau (kemungkinan berstatus Paused karena tidak aktif >7 hari). Silakan klik Restore Project di Supabase Dashboard.',
          },
          { status: 503 }
        );
      }

      // Connected to Supabase, even if ai_routes table hasn't been migrated yet
      return NextResponse.json({
        ok: true,
        database: 'reachable',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        code: 'SUPABASE_PAUSED_OR_UNREACHABLE',
        message:
          'Database Supabase tidak dapat dijangkau (kemungkinan proyek Supabase sedang Paused). Silakan klik Restore Project di Supabase Dashboard.',
        detail: err?.cause?.code || err?.message,
      },
      { status: 503 }
    );
  }
}
