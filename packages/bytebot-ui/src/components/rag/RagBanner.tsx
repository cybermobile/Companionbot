import React from "react";

type Item = {
  id: string;
  title?: string;
  snippet: string;
  url?: string;
  score?: number;
};

export function RagBanner({ items }: { items: Item[] }) {
  const [open, setOpen] = React.useState(false);
  const count = items.length;
  if (count === 0) return null;
  return (
    <div className="mb-2 rounded-lg border border-bytebot-bronze-light-7 bg-white/70 p-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-bytebot-bronze-light-12">
          Using {count} source{count === 1 ? "" : "s"}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-bytebot-bronze-light-11 hover:text-bytebot-bronze-dark-7"
        >
          {open ? "Hide" : "View"}
        </button>
      </div>
      {open && (
        <ul className="mt-2 space-y-1">
          {items.map((m) => (
            <li key={m.id} className="text-xs text-bytebot-bronze-light-12">
              <span className="font-medium">{m.title ?? "Source"}</span>
              {m.url && (
                <a
                  className="ml-2 text-blue-600 hover:underline"
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  link
                </a>
              )}
              <div className="line-clamp-2 opacity-80">{m.snippet}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

