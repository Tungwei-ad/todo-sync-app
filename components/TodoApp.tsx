"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, TODOS_TABLE } from "@/lib/supabase";
import { SEED_TODOS } from "@/lib/seedData";
import {
  CATEGORY_TABS,
  STATUS_ORDER,
  Todo,
  TodoCategory,
} from "@/lib/types";
import { daysUntil } from "@/lib/format";
import CategoryTabs from "./CategoryTabs";
import TodoItem from "./TodoItem";
import AddTodoForm from "./AddTodoForm";

type ViewMode = "list" | "card";
type SortMode = "default" | "deadline" | "urgency";

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  // 初次載入 + 資料庫為空時寫入保底種子資料
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data, error } = await supabase
        .from(TODOS_TABLE)
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.error(error);
        showToast("讀取資料失敗，請確認 Supabase 設定");
        setLoading(false);
        return;
      }

      if (!cancelled && (!data || data.length === 0)) {
        const { error: seedError } = await supabase
          .from(TODOS_TABLE)
          .upsert(SEED_TODOS, { onConflict: "id", ignoreDuplicates: true });
        if (seedError) console.error(seedError);

        const { data: seeded } = await supabase
          .from(TODOS_TABLE)
          .select("*")
          .order("sort_order", { ascending: true });
        if (!cancelled) setTodos((seeded as Todo[]) ?? []);
      } else if (!cancelled) {
        setTodos((data as Todo[]) ?? []);
      }

      if (!cancelled) setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // 即時訂閱：任何人新增/修改/刪除都會廣播給所有連線中的瀏覽器
  useEffect(() => {
    const channel = supabase
      .channel("todos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TODOS_TABLE },
        (payload) => {
          setTodos((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Todo;
              if (prev.some((t) => t.id === row.id)) return prev;
              return [...prev, row];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Todo;
              return prev.map((t) => (t.id === row.id ? row : t));
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as Todo;
              return prev.filter((t) => t.id !== row.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateTodo = useCallback(
    async (id: string, patch: Partial<Todo>) => {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      const { error } = await supabase.from(TODOS_TABLE).update(patch).eq("id", id);
      if (error) {
        console.error(error);
        showToast("更新失敗，請檢查網路連線");
      }
    },
    [showToast]
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      const { error } = await supabase.from(TODOS_TABLE).delete().eq("id", id);
      if (error) {
        console.error(error);
        showToast("刪除失敗，請檢查網路連線");
      } else {
        showToast("已刪除");
      }
    },
    [showToast]
  );

  const addTodo = useCallback(
    async (title: string, category: TodoCategory) => {
      const maxOrder = todos.reduce((m, t) => Math.max(m, t.sort_order), 0);
      const { data, error } = await supabase
        .from(TODOS_TABLE)
        .insert({
          title,
          category,
          status: "todo",
          budget: null,
          deadline: null,
          notes: null,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        showToast("新增失敗，請檢查網路連線");
        return;
      }
      if (data) {
        setTodos((prev) =>
          prev.some((t) => t.id === (data as Todo).id) ? prev : [...prev, data as Todo]
        );
        showToast("已新增");
      }
    },
    [todos, showToast]
  );

  function copyShareLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => showToast("已複製分享連結！"))
      .catch(() => showToast("複製失敗，請手動複製網址"));
  }

  const filtered = useMemo(() => {
    const tab = CATEGORY_TABS.find((t) => t.key === activeTab);
    const byCategory = !tab?.categories
      ? todos
      : todos.filter((t) => tab.categories!.includes(t.category));

    const sorted = [...byCategory].sort((a, b) => {
      if (sortMode === "deadline") {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      }
      if (sortMode === "urgency") {
        const score = (t: Todo) => {
          if (t.status === "done" || t.status === "cancelled") return 1000 + STATUS_ORDER[t.status];
          const d = daysUntil(t.deadline);
          if (d === null) return 500;
          return d;
        };
        return score(a) - score(b);
      }
      return a.sort_order - b.sort_order;
    });

    return sorted;
  }, [todos, activeTab, sortMode]);

  const counts = useMemo(() => {
    const total = todos.length;
    const done = todos.filter((t) => t.status === "done").length;
    return { total, done };
  }, [todos]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              待辦事項追蹤
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {counts.done} / {counts.total} 已完成 · 多人即時同步編輯
            </p>
          </div>
          <button
            onClick={copyShareLink}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm active:scale-95"
          >
            🔗 複製連結
          </button>
        </div>

        <CategoryTabs active={activeTab} onChange={setActiveTab} />

        <div className="flex items-center justify-between gap-2">
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none"
          >
            <option value="default">預設排序</option>
            <option value="urgency">依緊急程度排序</option>
            <option value="deadline">依截止日排序</option>
          </select>

          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-500"
              }`}
            >
              清單
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "card" ? "bg-slate-900 text-white" : "text-slate-500"
              }`}
            >
              卡片
            </button>
          </div>
        </div>
      </header>

      <div className="mb-4">
        <AddTodoForm onAdd={addTodo} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-slate-400">
          <span className="text-3xl">📭</span>
          <span className="text-sm">這個分類目前沒有項目</span>
        </div>
      ) : (
        <div
          className={
            viewMode === "card"
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-3"
          }
        >
          {filtered.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              variant={viewMode}
              onUpdate={updateTodo}
              onDelete={deleteTodo}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="rounded-full bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
