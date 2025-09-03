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
  items: MemoryItem[];
};

export function MemoryBanner({ items }: Props) {
  const [open, setOpen] = React.useState(false);
  const count = items.length;

  if (count === 0) return null;

  return (
    <div className="mb-2 rounded-lg border border-bytebot-bronze-light-7 bg-white/70 p-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-bytebot-bronze-light-12">
          Using {count} memor{count === 1 ? "y" : "ies"}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-bytebot-bronze-light-11 hover:text-bytebot-bronze-dark-7"
        >
          {open ? "Hide" : "View"}
        </button>
      </div>
      {open && (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((m) => (
            <MemoryChip
              key={m.id}
              scope={m.scope}
              snippet={m.snippet}
              score={m.score}
              updatedAt={m.updatedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}

