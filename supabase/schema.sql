-- ============================================================
-- 待辦事項追蹤 App — Supabase 資料庫初始化腳本
-- 使用方式：於 Supabase 專案的 SQL Editor 貼上並執行（一次即可）
-- ============================================================

-- 1. 建立資料表
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (
    category in ('裝潢家電', '法律醫療', '日本事務', '公司營運', '日常生活')
  ),
  budget text,
  deadline date,
  notes text,
  status text not null default 'todo' check (
    status in ('todo', 'in_progress', 'done', 'cancelled')
  ),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. 每次 UPDATE 自動刷新 updated_at，方便顯示「最後編輯時間」避免互相覆蓋
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_todos_updated_at on public.todos;
create trigger trg_todos_updated_at
  before update on public.todos
  for each row
  execute function public.set_updated_at();

-- 3. 開啟 RLS，並允許任何持有 anon key 的使用者（也就是拿到公開網址的人）
--    自由讀寫。這是刻意設計：此工具走「知道連結即可協作」模式、無登入機制，
--    請勿放置機密資訊，且不要把連結公開分享給不信任的對象。
alter table public.todos enable row level security;

drop policy if exists "public read" on public.todos;
create policy "public read" on public.todos
  for select using (true);

drop policy if exists "public insert" on public.todos;
create policy "public insert" on public.todos
  for insert with check (true);

drop policy if exists "public update" on public.todos;
create policy "public update" on public.todos
  for update using (true) with check (true);

drop policy if exists "public delete" on public.todos;
create policy "public delete" on public.todos
  for delete using (true);

-- 4. 啟用 Realtime（讓多人端點能即時收到 INSERT / UPDATE / DELETE 廣播）
alter publication supabase_realtime add table public.todos;

-- 5. 種子資料：首次建置時寫入 13 筆初始清單（使用固定 id，重覆執行不會產生重複資料）
insert into public.todos (id, title, category, budget, deadline, notes, status, sort_order)
values
  ('00000000-0000-0000-0000-000000000001', '充電樁線路報竣', '裝潢家電', '2w', null, '建議先不用做，不影響房價', 'cancelled', 1),
  ('00000000-0000-0000-0000-000000000002', '沙發採購', '裝潢家電', '18w', null, '預算先抓 18w，看誰比較快比較方便', 'todo', 2),
  ('00000000-0000-0000-0000-000000000003', '床板', '裝潢家電', '5w', null, 'IKEA 2F，金額 5w，確認可以購買', 'in_progress', 3),
  ('00000000-0000-0000-0000-000000000004', '偵訊庭', '法律醫療', null, null, '目前先沒有調衛生局資料（律師建議不用）。檢察官通常不會不客氣，當天請律師陪同', 'todo', 4),
  ('00000000-0000-0000-0000-000000000005', '看醫生', '法律醫療', null, null, '辛苦一下，若不想開車就叫車', 'todo', 5),
  ('00000000-0000-0000-0000-000000000006', '裝潢預算管控', '裝潢家電', null, null, '請廠商不要邊做邊加預算，務必一筆預算估清楚再施作', 'in_progress', 6),
  ('00000000-0000-0000-0000-000000000007', '燈飾選購', '裝潢家電', null, null, '先找便宜的，後續再依需求修正替換', 'todo', 7),
  ('00000000-0000-0000-0000-000000000008', '床墊試躺', '裝潢家電', null, null, '還要另外找時間去門市試躺', 'todo', 8),
  ('00000000-0000-0000-0000-000000000009', '日本公司稅金繳納', '日本事務', null, make_date(extract(year from now())::int, 9, 30), '需在 9/30 前繳完，目前無法代繳。確認是否請日本朋友協助處理？', 'todo', 9),
  ('00000000-0000-0000-0000-000000000010', '日本房地產處理', '日本事務', null, null, '處理方式及具體時間待定', 'todo', 10),
  ('00000000-0000-0000-0000-000000000011', '後續細清與保護拆除', '裝潢家電', null, null, '可找「澄塘」處理，包含電梯與停車位的保護板拆除', 'todo', 11),
  ('00000000-0000-0000-0000-000000000012', '公司網站更換與網域到期', '公司營運', null, null, '需找新網域；主視覺顏色與版面配置需你決定，細節執行請護理師幫忙', 'in_progress', 12),
  ('00000000-0000-0000-0000-000000000013', '中西藥服用排程', '法律醫療', null, null, '維持現狀，早上吃西藥；中午與晚上吃中藥', 'in_progress', 13)
on conflict (id) do nothing;
