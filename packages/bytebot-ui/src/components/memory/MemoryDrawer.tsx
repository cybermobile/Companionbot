"use client";
import React from "react";
import { MemoryChip } from "./MemoryChip";

type MemoryItem = {
  id: string;
  scope: "task" | "user" | "project";
  snippet: string;
  score?: number;
  updatedAt?: string;
};

type Props = {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MemoryDrawer({ taskId, open, onOpenChange }: Props) {
  const [items, setItems] = React.useState<MemoryItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/memory?taskId=${encodeURIComponent(taskId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [taskId, open]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/memory/${encodeURIComponent(id)}`, { method: "DELETE" });
      setItems((s) => s.filter((i) => i.id !== id));
    } catch {}
  };

  const handlePromote = async (id: string) => {
    try {
      await fetch(`/api/memory/${encodeURIComponent(id)}/promote`, { method: "POST" });
    } catch {}
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1" onClick={() => onOpenChange(false)} />
      <div className="w-full max-w-md bg-white shadow-xl border-l border-black/10 h-full p-4 overflow-y-auto">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Memories</h2>
          <button
            className="text-sm text-bytebot-bronze-light-11 hover:text-bytebot-bronze-dark-7"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>
        {loading && <div className="text-sm">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && items.length === 0 && (
          <div className="text-sm text-bytebot-bronze-light-11">No memories yet.</div>
        )}
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.id} className="rounded-lg border p-2">
              <MemoryChip
                scope={m.scope}
                snippet={m.snippet}
                score={m.score}
                updatedAt={m.updatedAt}
              />
              <div className="mt-2 flex gap-2">
                <button
                  className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                  onClick={() => handlePromote(m.id)}
                >
                  Promote
                </button>
                <button
                  className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(m.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

