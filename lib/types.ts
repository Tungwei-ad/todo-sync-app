export type TodoStatus = "todo" | "in_progress" | "done" | "cancelled";

export type TodoCategory =
  | "裝潢家電"
  | "法律醫療"
  | "日本事務"
  | "公司營運"
  | "日常生活";

export interface Todo {
  id: string;
  title: string;
  category: TodoCategory;
  budget: string | null;
  deadline: string | null; // YYYY-MM-DD
  notes: string | null;
  status: TodoStatus;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

export type NewTodo = Omit<Todo, "id" | "created_at" | "updated_at">;

export const STATUS_LABELS: Record<TodoStatus, string> = {
  todo: "待處理",
  in_progress: "進行中",
  done: "已完成",
  cancelled: "先不做",
};

export const STATUS_ORDER: Record<TodoStatus, number> = {
  in_progress: 0,
  todo: 1,
  done: 2,
  cancelled: 3,
};

export const CATEGORY_LIST: TodoCategory[] = [
  "裝潢家電",
  "法律醫療",
  "日本事務",
  "公司營運",
  "日常生活",
];

export interface CategoryTab {
  key: string;
  label: string;
  categories: TodoCategory[] | null; // null = 全部
}

export const CATEGORY_TABS: CategoryTab[] = [
  { key: "all", label: "全部", categories: null },
  { key: "reno", label: "裝潢採購", categories: ["裝潢家電"] },
  { key: "japan", label: "日本事務", categories: ["日本事務"] },
  { key: "legal", label: "法律醫療", categories: ["法律醫療"] },
  { key: "biz", label: "公司與日常", categories: ["公司營運", "日常生活"] },
];
