import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type MemoryScope = 'task' | 'user' | 'project';

export interface AddMemoryInput {
  text: string;
  scope: MemoryScope;
  taskId?: string;
  userId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface RetrievedMemoryItem {
  id: string;
  scope: MemoryScope;
  snippet: string;
  score?: number;
  updatedAt?: string; // ISO
}

@Injectable()
export class Mem0Service {
  private readonly logger = new Logger(Mem0Service.name);
  private readonly enabled: boolean;
  private readonly apiKey?: string;
  private readonly baseUrl?: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('MEM0_API_KEY');
    this.baseUrl = this.config.get<string>('MEM0_BASE_URL');
    const flag = this.config.get<string>('ENABLE_MEM0');
    this.enabled = !!this.apiKey && (flag === 'true' || flag === '1');
    this.timeoutMs = Number(this.config.get<string>('MEM0_TIMEOUT_MS') ?? '1500');
    if (!this.enabled) {
      this.logger.log('Mem0 disabled or missing API key. Running in no-op mode.');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async addMemory(input: AddMemoryInput): Promise<{ id?: string } | void> {
    if (!this.enabled) return; // no-op in disabled mode
    try {
      const body: any = {
        text: input.text,
        scope: input.scope,
        tags: input.tags ?? [],
        metadata: input.metadata ?? {},
      };
      if (input.taskId) body.taskId = input.taskId;
      if (input.userId) body.userId = input.userId;

      const res = await this.request('POST', '/memories', body);
      if (res && typeof res === 'object') {
        // Accept common shapes {id: string} or {data: {id}}
        const id = (res as any).id ?? (res as any).data?.id;
        return { id };
      }
      return {};
    } catch (err) {
      this.logger.warn(`addMemory failed: ${(err as Error).message}`);
    }
  }

  async retrieve(params: {
    query: string;
    taskId?: string;
    userId?: string;
    topKTask?: number;
    topKUser?: number;
  }): Promise<RetrievedMemoryItem[]> {
    if (!this.enabled) return [];
    try {
      const results: RetrievedMemoryItem[] = [];
      const { query, taskId, userId } = params;
      const topKTask = params.topKTask ?? 8;
      const topKUser = params.topKUser ?? 3;

      // Query task-scoped
      if (topKTask > 0 && (taskId || true)) {
        const taskItems = await this.searchMemories({
          query,
          scope: 'task',
          taskId,
          limit: topKTask,
        });
        results.push(...taskItems);
      }

      // Query user-scoped
      if (topKUser > 0 && (userId || true)) {
        const userItems = await this.searchMemories({
          query,
          scope: 'user',
          userId,
          limit: topKUser,
        });
        results.push(...userItems);
      }

      return results;
    } catch (err) {
      this.logger.warn(`retrieve failed: ${(err as Error).message}`);
      return [];
    }
  }

  async promote(id: string): Promise<boolean> {
    if (!this.enabled) return true;
    try {
      await this.request('POST', `/memories/${encodeURIComponent(id)}/promote`);
      return true;
    } catch (err) {
      this.logger.warn(`promote failed: ${(err as Error).message}`);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!this.enabled) return true;
    try {
      await this.request('DELETE', `/memories/${encodeURIComponent(id)}`);
      return true;
    } catch (err) {
      this.logger.warn(`delete failed: ${(err as Error).message}`);
      return false;
    }
  }

  // --- Private helpers ---

  private async searchMemories(args: {
    query: string;
    scope: MemoryScope;
    taskId?: string;
    userId?: string;
    limit?: number;
  }): Promise<RetrievedMemoryItem[]> {
    const { query, scope, taskId, userId, limit = 8 } = args;

    // Preferred endpoint (POST search)
    const payload: any = {
      query,
      limit,
      filters: { scope },
    };
    if (taskId) (payload.filters as any).taskId = taskId;
    if (userId) (payload.filters as any).userId = userId;

    try {
      const res = await this.request('POST', '/memories/search', payload);
      return this.normalizeSearchResponse(res, scope);
    } catch (err) {
      // Fallback to GET list with query params
      try {
        const q = new URLSearchParams({ q: query, scope, limit: String(limit) });
        if (taskId) q.set('taskId', taskId);
        if (userId) q.set('userId', userId);
        const res = await this.request('GET', `/memories?${q.toString()}`);
        return this.normalizeSearchResponse(res, scope);
      } catch (err2) {
        this.logger.debug(`searchMemories fallback failed: ${(err2 as Error).message}`);
        return [];
      }
    }
  }

  private normalizeSearchResponse(res: any, defaultScope: MemoryScope): RetrievedMemoryItem[] {
    if (!res) return [];
    const list = Array.isArray(res) ? res : Array.isArray((res as any).data) ? (res as any).data : [];
    return list
      .map((it: any) => {
        const id = it.id ?? it._id ?? it.uuid;
        const scope = (it.scope as MemoryScope) ?? defaultScope;
        const snippet = it.snippet ?? it.text ?? it.content ?? '';
        const score = typeof it.score === 'number' ? it.score : undefined;
        const updatedAt = (it.updatedAt ?? it.updated_at ?? it.timestamp) as string | undefined;
        if (!id || !snippet) return null;
        return { id, scope, snippet, score, updatedAt } as RetrievedMemoryItem;
      })
      .filter(Boolean) as RetrievedMemoryItem[];
  }

  private async request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: any): Promise<any> {
    if (!this.baseUrl) throw new Error('MEM0_BASE_URL not set');
    const url = `${this.baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
        signal: ac.signal,
      } as any);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text?.slice(0, 200)}`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return res.json();
      }
      return res.text();
    } finally {
      clearTimeout(t);
    }
  }
}
