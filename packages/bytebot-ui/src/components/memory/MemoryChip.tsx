import React from "react";

type Props = {
  scope: "task" | "user" | "project";
  snippet: string;
  score?: number;
  updatedAt?: string;
};

export function MemoryChip({ scope, snippet, score, updatedAt }: Props) {
  const scopeColor =
    scope === "task"
      ? "bg-orange-100 text-orange-800"
      : scope === "user"
      ? "bg-green-100 text-green-800"
      : "bg-blue-100 text-blue-800";

  const age = updatedAt ? timeAgo(updatedAt) : undefined;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs ${scopeColor} border border-black/5`}
      title={snippet}
    >
      <span className="capitalize">{scope}</span>
      <span className="line-clamp-1 max-w-[220px]">{snippet}</span>
      {typeof score === "number" && (
        <span className="opacity-60">{score.toFixed(2)}</span>
      )}
      {age && <span className="opacity-60">· {age}</span>}
    </span>
  );
}

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diff = Math.max(0, Date.now() - date.getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}

