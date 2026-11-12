import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { chat, embed } from '@/lib/ai/router';
import { SYSTEM_GROUNDING_PROMPT } from '@/lib/ai/prompts';
import { hybridSearch } from '@/lib/retrieval/search';
import { buildContextAndCitations } from '@/lib/retrieval/context';
import crypto from 'crypto';

export const maxDuration = 60;

export async function POST(request: Request) {
  const startTime = Date.now();
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const json = await request.json();
  const { notebookId, threadId: requestedThreadId, question, sourceIds, options } = json;

  if (!notebookId || !question) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'notebookId dan question wajib diisi' } },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // 1. Check daily chat quota
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count: chatCount } = await admin
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('kind', 'chat')
    .gte('created_at', startOfDay.toISOString());

  const { data: profile } = await admin
    .from('profiles')
    .select('daily_chat_limit')
    .eq('id', user.id)
    .single();

  const dailyLimit = profile?.daily_chat_limit ?? 100;
  if (chatCount !== null && chatCount >= dailyLimit) {
    return NextResponse.json(
      { error: { code: 'QUOTA_EXCEEDED', message: 'Batas kuota chat harian telah tercapai' } },
      { status: 429 }
    );
  }

  // 2. Fetch notebook & active sources
  const { data: notebook } = await admin
    .from('notebooks')
    .select('id, title')
    .eq('id', notebookId)
    .eq('user_id', user.id)
    .single();

  if (!notebook) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Notebook tidak ditemukan' } },
      { status: 404 }
    );
  }

  // Find enabled & ready sources
  let query = admin
    .from('sources')
    .select('id, file_name')
    .eq('notebook_id', notebookId)
    .eq('user_id', user.id)
    .eq('status', 'ready')
    .eq('enabled', true);

  if (Array.isArray(sourceIds) && sourceIds.length > 0) {
    query = query.in('id', sourceIds);
  }

  const { data: sources } = await query;
  const targetSources = sources || [];
  const enabledIds = targetSources.map((s) => s.id);
  const sourcesMap = new Map<string, { fileName: string }>();
  targetSources.forEach((s) => sourcesMap.set(s.id, { fileName: s.file_name }));

  // 3. Thread resolution
  let threadId = requestedThreadId;
  if (!threadId) {
    const { data: existingThread } = await admin
      .from('chat_threads')
      .select('id')
      .eq('notebook_id', notebookId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingThread?.id) {
      threadId = existingThread.id;
    } else {
      const { data: newThread } = await admin
        .from('chat_threads')
        .insert({
          notebook_id: notebookId,
          user_id: user.id,
          title: question.slice(0, 50),
        })
        .select()
        .single();
      threadId = newThread?.id || crypto.randomUUID();
    }
  }

  // Insert user message to thread
  await admin.from('chat_messages').insert({
    thread_id: threadId,
    user_id: user.id,
    role: 'user',
    content: question,
  });

  // 4. Retrieve context via Hybrid Search
  let queryEmbedding: number[] | null = null;
  try {
    const embeddings = await embed([question]);
    if (embeddings.length > 0) {
      queryEmbedding = embeddings[0];
    }
  } catch (err) {
    console.warn('Query embedding failed, falling back to full-text only search');
  }

  const adaptiveLimit = Math.min(64, Math.max(36, enabledIds.length * 3));
  const retrievedChunks = await hybridSearch({
    notebookId,
    queryText: question,
    queryEmbedding,
    enabledSourceIds: enabledIds,
    limit: adaptiveLimit,
  });

  const { contextText, citationsList } = buildContextAndCitations(retrievedChunks, sourcesMap);

  // 5. Construct conversation prompt
  const fullSystemPrompt = `${SYSTEM_GROUNDING_PROMPT}\n\n=== DOKUMEN SUMBER TERSEDIA ===\n${contextText}`;

  // Fetch recent messages in this thread for conversation history
  const { data: history } = await admin
    .from('chat_messages')
    .select('role, content')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(4);

  const formattedHistory = (history || [])
    .reverse()
    .slice(0, -1) // exclude the current question we just inserted
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const messagesPayload = [
    { role: 'system', content: fullSystemPrompt },
    ...formattedHistory,
    { role: 'user', content: question },
  ];

  // 6. Call AI Router
  let chatResult: Awaited<ReturnType<typeof chat>>;
  try {
    chatResult = await chat({
      messages: messagesPayload,
      temperature: options?.temperature ?? 0.2,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: 'ALL_PROVIDERS_FAILED',
          message: 'Semua layanan AI sedang tidak tersedia atau mengalami kendala. Coba lagi sebentar.',
          detail: err.message,
        },
      },
      { status: 503 }
    );
  }

  // 7. Setup SSE Response Stream
  const assistantMessageId = crypto.randomUUID();
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream({
    async start(controller) {
      let fullAssistantText = '';

      // Send initial meta event
      const metaEvent = `event: meta\ndata: ${JSON.stringify({
        messageId: assistantMessageId,
        threadId,
        provider: chatResult.provider,
        model: chatResult.model,
      })}\n\n`;
      controller.enqueue(encoder.encode(metaEvent));

      const reader = chatResult.stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          fullAssistantText += value;
          const deltaEvent = `event: delta\ndata: ${JSON.stringify({ text: value })}\n\n`;
          controller.enqueue(encoder.encode(deltaEvent));
        }

        // Determine which citations were actually referenced in the response (e.g. [S1], [S2])
        const usedCitations = citationsList.filter((cit) =>
          fullAssistantText.includes(`[${cit.marker}]`)
        );

        // Send citations event
        const citationsEvent = `event: citations\ndata: ${JSON.stringify({
          citations: usedCitations.length > 0 ? usedCitations : citationsList.slice(0, 3),
        })}\n\n`;
        controller.enqueue(encoder.encode(citationsEvent));

        // Get usage & send done event
        const usage = await chatResult.getUsage();
        const latencyMs = Date.now() - startTime;

        const doneEvent = `event: done\ndata: ${JSON.stringify({
          finish: 'stop',
          usage,
          latencyMs,
        })}\n\n`;
        controller.enqueue(encoder.encode(doneEvent));

        // Persist assistant message in DB
        await admin.from('chat_messages').insert({
          id: assistantMessageId,
          thread_id: threadId,
          user_id: user.id,
          role: 'assistant',
          content: fullAssistantText,
          citations: usedCitations,
          provider: chatResult.provider,
          model: chatResult.model,
          input_tokens: usage.inputTokens,
          output_tokens: usage.outputTokens,
          latency_ms: latencyMs,
          finish_reason: 'stop',
        });

        // Record usage event
        await admin.from('usage_events').insert({
          user_id: user.id,
          kind: 'chat',
          provider: chatResult.provider,
          model: chatResult.model,
          input_tokens: usage.inputTokens,
          output_tokens: usage.outputTokens,
          latency_ms: latencyMs,
          outcome: 'ok',
        });

        controller.close();
      } catch (streamErr: any) {
        console.error('Stream error:', streamErr);
        const errEvent = `event: error\ndata: ${JSON.stringify({
          code: 'STREAM_INTERRUPTED',
          message: streamErr.message || 'Koneksi ke model terputus.',
          partial: true,
        })}\n\n`;
        controller.enqueue(encoder.encode(errEvent));
        controller.close();
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const notebookId = searchParams.get('notebookId');
  if (!notebookId) {
    return NextResponse.json({ error: { message: 'notebookId is required' } }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find latest thread for this notebook
  const { data: thread } = await admin
    .from('chat_threads')
    .select('id, title, created_at')
    .eq('notebook_id', notebookId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!thread) {
    return NextResponse.json({ data: { threadId: null, messages: [] } });
  }

  const { data: messages, error: msgError } = await admin
    .from('chat_messages')
    .select('*')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: { message: msgError.message } }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      threadId: thread.id,
      messages: messages || [],
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const notebookId = searchParams.get('notebookId');
  if (!notebookId) {
    return NextResponse.json({ error: { message: 'notebookId is required' } }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: threads } = await admin
    .from('chat_threads')
    .select('id')
    .eq('notebook_id', notebookId)
    .eq('user_id', user.id);

  if (threads && threads.length > 0) {
    const threadIds = threads.map((t) => t.id);
    await admin.from('chat_messages').delete().in('thread_id', threadIds);
    await admin.from('chat_threads').delete().in('id', threadIds);
  }

  return NextResponse.json({ ok: true });
}

