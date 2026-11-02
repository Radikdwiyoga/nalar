import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile for limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  // Fetch usage events since start of UTC day
  const { data: events, error } = await supabase
    .from('usage_events')
    .select('kind, input_tokens, output_tokens')
    .eq('user_id', user.id)
    .gte('created_at', startOfDay.toISOString());

  let chats = 0;
  let artifacts = 0;
  let uploads = 0;
  let tokens = 0;

  if (events) {
    for (const ev of events) {
      if (ev.kind === 'chat') chats++;
      else if (ev.kind === 'artifact') artifacts++;
      else if (ev.kind === 'upload') uploads++;
      tokens += (ev.input_tokens || 0) + (ev.output_tokens || 0);
    }
  }

  return NextResponse.json({
    usage: {
      chats,
      artifacts,
      uploads,
      tokens,
    },
    limits: {
      daily_chat_limit: profile?.daily_chat_limit ?? 100,
      daily_artifact_limit: profile?.daily_artifact_limit ?? 20,
      daily_upload_limit: profile?.daily_upload_limit ?? 50,
      daily_token_limit: profile?.daily_token_limit ?? 300000,
    },
    profile,
  });
}

