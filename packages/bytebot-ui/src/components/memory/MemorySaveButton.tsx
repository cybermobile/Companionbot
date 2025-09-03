"use client";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type Props = {
  taskId: string;
  getSnippet: () => string;
  className?: string;
};

export function MemorySaveButton({ taskId, getSnippet, className }: Props) {
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<null | "ok" | "err">(null);

  const save = async (scope: "task" | "user") => {
    const text = getSnippet().trim().slice(0, 500);
    if (!text) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, scope, taskId }),
      });
      setStatus(res.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 1500);
    }
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded border border-bytebot-bronze-light-7 px-2 py-1 text-xs hover:bg-bytebot-bronze-light-a1 disabled:opacity-60"
            disabled={saving}
            title="Save to memory"
          >
            {saving ? "Saving…" : status === "ok" ? "Saved" : "Save to Memory"}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => save("task")}>Save to Task</DropdownMenuItem>
          <DropdownMenuItem onClick={() => save("user")}>Save to User</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

