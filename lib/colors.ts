import { TodoCategory, TodoStatus } from "./types";

export const CATEGORY_COLORS: Record<
  TodoCategory,
  { bg: string; text: string; dot: string }
> = {
  裝潢家電: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  法律醫療: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400" },
  日本事務: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-400" },
  公司營運: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-400",
  },
  日常生活: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-400",
  },
};

export const STATUS_COLORS: Record<
  TodoStatus,
  { bg: string; text: string; ring: string }
> = {
  todo: { bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-300" },
  in_progress: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    ring: "ring-blue-300",
  },
  done: {
    bg: "bg-green-100",
    text: "text-green-700",
    ring: "ring-green-300",
  },
  cancelled: {
    bg: "bg-slate-100",
    text: "text-slate-400",
    ring: "ring-slate-200",
  },
};
