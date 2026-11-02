import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { extractPdf } from '@/lib/ingest/extract/pdf';
import { extractDocx } from '@/lib/ingest/extract/docx';
import { extractXlsx } from '@/lib/ingest/extract/xlsx';
import { extractPlainText, extractCsv } from '@/lib/ingest/extract/text';
import { createChunks, ChunkInputItem } from '@/lib/ingest/chunk';
import { embed } from '@/lib/ai/router';

export const maxDuration = 60; // 60 seconds Vercel hobby timeout

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Unauthorized' } }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: source, error: sourceError } = await admin
    .from('sources')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Sumber tidak ditemukan' } }, { status: 404 });
  }

  try {
    // 1. Update status to processing
    await admin
      .from('sources')
      .update({ status: 'processing', stage: 'extract', progress: 10 })
      .eq('id', id);

    // 2. Download file buffer from storage
    const { data: fileBlob, error: downloadError } = await admin.storage
      .from('sources')
      .download(source.storage_path);

    if (downloadError || !fileBlob) {
      throw new Error(`Gagal mengunduh file dari storage: ${downloadError?.message}`);
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Extract text according to format
    const chunkInputs: ChunkInputItem[] = [];
    let pageCount: number | null = null;
    let charCount = 0;
    const ext = source.file_name.split('.').pop()?.toLowerCase() || '';

    if (ext === 'pdf') {
      const pdfRes = await extractPdf(new Uint8Array(arrayBuffer));
      pageCount = pdfRes.pageCount;
      charCount = pdfRes.charCount;
      for (const p of pdfRes.pages) {
        chunkInputs.push({
          text: p.content,
          pageNumber: p.pageNumber,
        });
      }
    } else if (ext === 'docx') {
      const docxRes = await extractDocx(buffer);
      charCount = docxRes.charCount;
      chunkInputs.push({
        text: docxRes.content,
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const xlsxRes = extractXlsx(buffer);
      charCount = xlsxRes.charCount;
      for (const s of xlsxRes.sheets) {
        chunkInputs.push({
          text: s.content,
          sheetName: s.sheetName,
        });
      }
    } else if (ext === 'csv') {
      const text = buffer.toString('utf-8');
      const csvRes = extractCsv(text);
      charCount = csvRes.charCount;
      chunkInputs.push({
        text: csvRes.content,
      });
    } else {
      // Plain text or Markdown
      const text = buffer.toString('utf-8');
      const txtRes = extractPlainText(text);
      charCount = txtRes.charCount;
      chunkInputs.push({
        text: txtRes.content,
      });
    }

    // 4. Chunking
    await admin
      .from('sources')
      .update({ stage: 'chunk', progress: 40 })
      .eq('id', id);

    const chunks = createChunks(chunkInputs);

    // Clear any previous chunks if re-ingesting
    await admin.from('source_chunks').delete().eq('source_id', id);

    // 5. Embedding
    await admin
      .from('sources')
      .update({ stage: 'embed', progress: 60 })
      .eq('id', id);

    let embeddings: number[][] | null = null;
    let embeddingModelName: string | null = null;

    if (chunks.length > 0) {
      try {
        const textsToEmbed = chunks.map((c) => c.content);
        embeddings = await embed(textsToEmbed);
        embeddingModelName = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
      } catch (embErr) {
        console.warn('Embedding failed, will fallback to full-text only search:', embErr);
      }
    }

    // 6. Indexing & saving chunks
    await admin
      .from('sources')
      .update({ stage: 'index', progress: 85 })
      .eq('id', id);

    if (chunks.length > 0) {
      const rowsToInsert = chunks.map((c, i) => ({
        source_id: id,
        notebook_id: source.notebook_id,
        user_id: user.id,
        chunk_index: c.chunkIndex,
        content: c.content,
        page_number: c.pageNumber,
        sheet_name: c.sheetName,
        heading_path: c.headingPath,
        char_start: c.charStart,
        char_end: c.charEnd,
        embedding: embeddings ? embeddings[i] : null,
      }));

      // Insert in batches of 50
      for (let i = 0; i < rowsToInsert.length; i += 50) {
        const batch = rowsToInsert.slice(i, i + 50);
        const { error: chunkInsertErr } = await admin.from('source_chunks').insert(batch);
        if (chunkInsertErr) {
          throw new Error(`Gagal menyimpan chunk: ${chunkInsertErr.message}`);
        }
      }
    }

    // 7. Mark as ready
    await admin
      .from('sources')
      .update({
        status: 'ready',
        stage: 'done',
        progress: 100,
        page_count: pageCount,
        char_count: charCount,
        chunk_count: chunks.length,
        embedding_model: embeddingModelName,
        error_code: null,
        error_message: null,
      })
      .eq('id', id);

    return NextResponse.json({
      stage: 'done',
      done: true,
      progress: 100,
      chunkCount: chunks.length,
    });
  } catch (err: any) {
    console.error('Ingestion error:', err);
    await admin
      .from('sources')
      .update({
        status: 'failed',
        error_code: 'INGEST_FAILED',
        error_message: err.message || 'Ingestion failed',
      })
      .eq('id', id);

    return NextResponse.json(
      { error: { code: 'INGEST_FAILED', message: err.message } },
      { status: 500 }
    );
  }
}

