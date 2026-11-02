import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createNotebookSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').max(100, 'Maksimal 100 karakter'),
  description: z.string().max(500).optional().nullable(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: notebooks, error } = await supabase
    .from('notebooks')
    .select(`
      *,
      sources:sources(count)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formattedNotebooks = notebooks.map((nb: any) => ({
    ...nb,
    sources_count: nb.sources?.[0]?.count || 0,
  }));

  return NextResponse.json({ data: formattedNotebooks });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = createNotebookSchema.parse(json);

    // Check notebook limit (e.g. 20 notebooks)
    const { count } = await supabase
      .from('notebooks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count && count >= 20) {
      return NextResponse.json(
        { error: 'Batas maksimum notebook (20) telah tercapai' },
        { status: 400 }
      );
    }

    const { data: notebook, error } = await supabase
      .from('notebooks')
      .insert({
        user_id: user.id,
        title: parsed.title,
        description: parsed.description || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: notebook }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
