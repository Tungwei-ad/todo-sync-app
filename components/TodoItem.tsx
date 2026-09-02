"use client";

import { useEffect, useRef, useState } from "react";
import { Todo, TodoStatus, STATUS_LABELS, CATEGORY_LIST } from "@/lib/types";
import { CATEGORY_COLORS, STATUS_COLORS } from "@/lib/colors";
import { formatDeadline, isUrgent, isOverdue, relativeTime } from "@/lib/format";

type Field = "title" | "notes" | "budget" | "deadline" | "category" | null;

export default function TodoItem({
  todo,
  variant,
  onUpdate,
  onDelete,
}: {
  todo: Todo;
  variant: "list" | "card";
  onUpdate: (id: string, patch: Partial<Todo>) => void;
  onDelete: (id: string) => void;
}) {
  const [editingField, setEditingField] = useState<Field>(null);
  const [draftTitle, setDraftTitle] = useState(todo.title);
  const [draftNotes, setDraftNotes] = useState(todo.notes ?? "");
  const [draftBudget, setDraftBudget] = useState(todo.budget ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingField !== "title") setDraftTitle(todo.title);
  }, [todo.title, editingField]);
  useEffect(() => {
    if (editingField !== "notes") setDraftNotes(todo.notes ?? "");
  }, [todo.notes, editingField]);
  useEffect(() => {
    if (editingField !== "budget") setDraftBudget(todo.budget ?? "");
  }, [todo.budget, editingField]);

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      if ("select" in inputRef.current) inputRef.current.select();
    }
  }, [editingField]);

  const isDone = todo.status === "done";
  const isCancelled = todo.status === "cancelled";
  const faded = isCancelled;
  const struck = isDone || isCancelled;
  const categoryColor = CATEGORY_COLORS[todo.category];
  const statusColor = STATUS_COLORS[todo.status];
  const urgent = !struck && isUrgent(todo.deadline);
  const overdue = !struck && isOverdue(todo.deadline);

  function toggleDone() {
    onUpdate(todo.id, { status: isDone ? "todo" : "done" });
  }

  function commitTitle() {
    setEditingField(null);
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== todo.title) onUpdate(todo.id, { title: trimmed });
    else setDraftTitle(todo.title);
  }

  function commitNotes() {
    setEditingField(null);
    if (draftNotes !== (todo.notes ?? "")) onUpdate(todo.id, { notes: draftNotes || null });
  }

  function commitBudget() {
    setEditingField(null);
    if (draftBudget !== (todo.budget ?? ""))
      onUpdate(todo.id, { budget: draftBudget || null });
  }

  return (
    <div
      className={`group relative rounded-2xl border bg-white p-4 shadow-sm transition-opacity ${
        variant === "card" ? "flex h-full flex-col gap-3" : "flex items-start gap-3"
      } ${faded ? "opacity-60" : ""} ${
        overdue ? "border-red-200" : urgent ? "border-amber-200" : "border-slate-200"
      }`}
    >
      {/* checkbox */}
      <button
        aria-label={isDone ? "標記為未完成" : "標記為已完成"}
        onClick={toggleDone}
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-colors ${
          isDone
            ? "border-green-500 bg-green-500 text-white"
            : "border-slate-300 bg-white text-transparent hover:border-slate-400"
        }`}
      >
        ✓
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {editingField === "title" ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") {
                  setDraftTitle(todo.title);
                  setEditingField(null);
                }
              }}
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-base font-medium outline-none focus:border-slate-500"
            />
          ) : (
            <h3
              onClick={() => setEditingField("title")}
              className={`cursor-text break-words text-base font-medium leading-snug ${
                struck ? "text-slate-400 line-through decoration-slate-300" : "text-slate-900"
              }`}
            >
              {todo.title}
            </h3>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <select
            value={todo.category}
            onChange={(e) => onUpdate(todo.id, { category: e.target.value as Todo["category"] })}
            className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${categoryColor.bg} ${categoryColor.text} outline-none`}
          >
            {CATEGORY_LIST.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={todo.status}
            onChange={(e) => onUpdate(todo.id, { status: e.target.value as TodoStatus })}
            className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${statusColor.bg} ${statusColor.text} outline-none`}
          >
            {(Object.keys(STATUS_LABELS) as TodoStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          {todo.deadline && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                overdue
                  ? "bg-red-600 text-white"
                  : urgent
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {overdue ? "⚠ 已逾期 " : urgent ? "🔥 " : "📅 "}
              {formatDeadline(todo.deadline)} 截止
            </span>
          )}

          {editingField === "budget" ? (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={draftBudget}
              placeholder="金額"
              onChange={(e) => setDraftBudget(e.target.value)}
              onBlur={commitBudget}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitBudget();
                if (e.key === "Escape") {
                  setDraftBudget(todo.budget ?? "");
                  setEditingField(null);
                }
              }}
              className="w-20 rounded-full border border-slate-300 px-2.5 py-1 text-xs outline-none focus:border-slate-500"
            />
          ) : todo.budget ? (
            <span
              onClick={() => setEditingField("budget")}
              className="cursor-text rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
            >
              💰 {todo.budget}
            </span>
          ) : (
            <button
              onClick={() => setEditingField("budget")}
              className="rounded-full px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-100"
            >
              + 預算
            </button>
          )}
        </div>

        {editingField === "notes" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
            onBlur={commitNotes}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraftNotes(todo.notes ?? "");
                setEditingField(null);
              }
            }}
            rows={3}
            placeholder="備註與詳細說明..."
            className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-600 outline-none focus:border-slate-500"
          />
        ) : (
          <p
            onClick={() => setEditingField("notes")}
            className={`mt-2 cursor-text whitespace-pre-wrap break-words text-sm leading-relaxed ${
              todo.notes ? "text-slate-500" : "text-slate-300"
            }`}
          >
            {todo.notes || "點此新增備註..."}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">{relativeTime(todo.updated_at)}</span>

          {confirmingDelete ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">確定刪除？</span>
              <button
                onClick={() => onDelete(todo.id)}
                className="rounded-md bg-red-600 px-2 py-1 font-medium text-white"
              >
                刪除
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded-md bg-slate-100 px-2 py-1 text-slate-500"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              刪除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
