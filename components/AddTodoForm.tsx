"use client";

import { useState } from "react";
import { CATEGORY_LIST, TodoCategory } from "@/lib/types";

export default function AddTodoForm({
  onAdd,
}: {
  onAdd: (title: string, category: TodoCategory) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TodoCategory>("裝潢家電");
  const [expanded, setExpanded] = useState(false);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, category);
    setTitle("");
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-3">
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="+ 新增待辦事項..."
          className="min-w-0 flex-1 rounded-lg border-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
        />
        <button
          onClick={submit}
          disabled={!title.trim()}
          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-30"
        >
          新增
        </button>
      </div>
      {expanded && (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 px-2 pt-2">
          {CATEGORY_LIST.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                category === c
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
