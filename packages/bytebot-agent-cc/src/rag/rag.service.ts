import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';

export interface RagRetrieveItem {
  id: string;
  title?: string;
  snippet: string;
  url?: string;
  score?: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private ensured = false;
  private readonly enabled: boolean;
  private readonly model: string;
  private readonly topK: number;
  private openai?: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const flag = this.config.get<string>('ENABLE_RAG');
    this.enabled = flag === 'true' || flag === '1';
    this.model = this.config.get<string>('RAG_EMBED_MODEL') ?? 'text-embedding-3-small';
    this.topK = Number(this.config.get<string>('RAG_TOPK') ?? '8');
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    if (this.enabled && openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    } else if (this.enabled) {
      this.logger.warn('RAG enabled but OPENAI_API_KEY not set; disabling embeddings.');
    }
  }

  isEnabled(): boolean {
    return this.enabled && !!this.openai;
  }

  private async ensureSchema(): Promise<void> {
    if (this.ensured) return;
    try {
      await this.prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS rag_document (
          id TEXT PRIMARY KEY,
          title TEXT,
          source_type TEXT,
          url TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT now()
        )`);
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS rag_chunk (
          id TEXT PRIMARY KEY,
          document_id TEXT REFERENCES rag_document(id) ON DELETE CASCADE,
          chunk_index INT,
          text TEXT,
          embedding vector(1536),
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT now()
        )`);
    } catch (e) {
      this.logger.warn(`ensureSchema failed: ${(e as Error).message}`);
    }
    this.ensured = true;
  }

  private async embed(texts: string[]): Promise<number[][]> {
    if (!this.openai) throw new Error('OpenAI client not configured');
    const res = await this.openai.embeddings.create({
      model: this.model,
      input: texts,
    } as any);
    return res.data.map((d: any) => d.embedding as number[]);
  }

  async indexText(params: {
    text: string;
    title?: string;
    url?: string;
    metadata?: Record<string, any>;
    chunkSize?: number;
    overlap?: number;
  }): Promise<{ documentId: string; chunks: number } | null> {
    if (!this.isEnabled()) return null;
    await this.ensureSchema();

    const { text, title, url } = params;
    const chunkSize = params.chunkSize ?? 1200; // chars approx
    const overlap = params.overlap ?? 150;
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      const end = Math.min(text.length, i + chunkSize);
      chunks.push(text.slice(i, end));
      if (end >= text.length) break;
      i = end - overlap;
    }

    const embeddings = await this.embed(chunks);
    const docId = randomUUID();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO rag_document (id, title, source_type, url, metadata) VALUES ($1, $2, $3, $4, $5)`,
      docId,
      title ?? null,
      'text',
      url ?? null,
      JSON.stringify(params.metadata ?? {}),
    );

    for (let idx = 0; idx < chunks.length; idx++) {
      const id = randomUUID();
      const emb = `[${embeddings[idx].join(',')}]`;
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO rag_chunk (id, document_id, chunk_index, text, embedding, metadata) VALUES ($1, $2, $3, $4, $5::vector, $6)`,
        id,
        docId,
        idx,
        chunks[idx],
        emb,
        JSON.stringify({}),
      );
    }
    return { documentId: docId, chunks: chunks.length };
  }

  async retrieve(params: {
    query: string;
    topK?: number;
  }): Promise<RagRetrieveItem[]> {
    if (!this.isEnabled()) return [];
    await this.ensureSchema();
    const [queryEmb] = await this.embed([params.query]);
    const emb = `[${queryEmb.join(',')}]`;
    const k = params.topK ?? this.topK;
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT c.id, c.text, d.title, d.url, 1 - (c.embedding <=> ${emb}::vector) AS score
       FROM rag_chunk c
       JOIN rag_document d ON d.id = c.document_id
       ORDER BY c.embedding <=> ${emb}::vector
       LIMIT ${k}`,
    );
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      title: (r.title ?? undefined) as string | undefined,
      snippet: (r.text as string).slice(0, 400),
      url: (r.url ?? undefined) as string | undefined,
      score: typeof r.score === 'number' ? (r.score as number) : undefined,
    }));
  }
}

