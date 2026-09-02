# 待辦事項追蹤 · 多人即時同步

一個公開網址即可多人即時協作的待辦事項看板：任何拿到連結的人都能新增、編輯、打勾完成、刪除，變更會即時同步到所有正在瀏覽的裝置，不需重新整理、不需登入。

技術棧：**Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres + Realtime)**。

---

## 3 分鐘部署指南

### 步驟 1：建立 Supabase 專案（約 1 分鐘）

1. 前往 [supabase.com](https://supabase.com) 註冊並建立一個新專案（免費方案即可）。
2. 進入專案後，左側選單點 **SQL Editor** → **New query**。
3. 貼上專案內的 [supabase/schema.sql](supabase/schema.sql) 全部內容，點 **Run**。
   - 這會建立 `todos` 資料表、開啟即時同步（Realtime）、設定公開讀寫權限，並自動寫入 13 筆初始待辦事項。
4. 到左側選單 **Project Settings → API**，複製：
   - `Project URL`
   - `anon public` API Key

### 步驟 2：設定環境變數

複製 `.env.example` 為 `.env.local`，填入剛剛取得的兩個值：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 步驟 3：部署到 Vercel（約 1 分鐘）

**方式 A：透過 Vercel 網站**

1. 將此專案推送到你的 GitHub（或直接用 [vercel.com/new](https://vercel.com/new) 上傳資料夾）。
2. 在 Vercel 匯入該 repo，Framework 會自動偵測為 Next.js。
3. 在 **Environment Variables** 貼上 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
4. 點 **Deploy**，完成後即取得公開網址，例如 `https://your-app.vercel.app`。

**方式 B：透過 CLI**

```bash
npm install -g vercel
vercel               # 依提示登入、建立專案
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

部署完成後，把網址分享給所有需要協作的人即可 —— 大家開啟同一個連結，就能即時看到彼此的新增、編輯、打勾與刪除。

> 也可以改用 Cloudflare Pages：連接同一個 GitHub repo，Build command 設為 `npm run build`，Output directory 設為 `.next`（需搭配 `@cloudflare/next-on-pages` adapter），並同樣設定上述兩個環境變數。

---

## 本機開發

```bash
npm install
cp .env.example .env.local   # 填入 Supabase 資訊
npm run dev
```

開啟 http://localhost:3000。

---

## 專案結構

```
app/
  layout.tsx          # 全站版型、meta
  page.tsx            # 首頁，掛載 TodoApp
  globals.css          # Tailwind 樣式
components/
  TodoApp.tsx          # 主邏輯：讀取、即時訂閱、篩選、排序、新增/刪除
  TodoItem.tsx          # 單一待辦項目（清單/卡片皆共用），就地編輯
  AddTodoForm.tsx        # 新增待辦表單
  CategoryTabs.tsx        # 分類篩選 Tab
lib/
  types.ts             # 型別、狀態/分類定義、分類 Tab 對應
  supabase.ts           # Supabase client
  seedData.ts            # 前端保底種子資料（與 SQL 種子資料共用固定 id）
  colors.ts              # 分類/狀態配色
  format.ts               # 日期、緊急程度、相對時間格式化
supabase/
  schema.sql            # 資料表、RLS 權限、Realtime、SQL 種子資料
```

## 功能重點

- **多人即時同步**：透過 Supabase Realtime 訂閱 `todos` 資料表的 `INSERT` / `UPDATE` / `DELETE`，任何人操作都會廣播給所有連線中的瀏覽器，不需重新整理。
- **就地編輯（Inline Edit）**：點擊標題、備註、預算即可直接編輯，失焦或按 Enter 自動儲存；分類與狀態則用下拉選單即點即改。
- **分類篩選**：全部 / 裝潢採購 / 日本事務 / 法律醫療 / 公司與日常。
- **排序**：預設 / 依緊急程度 / 依截止日。
- **視覺標記**：「先不做」項目會淡化＋刪除線；即將到期（14 天內）以橘色標籤提示，已逾期以紅色標籤提示。
- **清單／卡片雙模式**：右上角可切換，卡片模式在桌機呈多欄網格，手機自動收合為單欄。
- **一鍵複製分享連結**：右上角按鈕複製目前網址到剪貼簿。
- **最後編輯時間**：每筆項目顯示「X 分鐘前更新」，資料庫觸發器會在每次 `UPDATE` 自動刷新 `updated_at`，方便判斷是否被別人剛改過，避免互相覆蓋。

## 安全性說明（重要）

此工具刻意設計為「知道連結即可協作」，**沒有登入機制**，Supabase 的 `anon` key 對 `todos` 資料表開放公開讀寫（見 `supabase/schema.sql` 的 RLS policy）。這代表：

- 請勿放置密碼、身分證字號等機密資訊在待辦內容中。
- 只把網址分享給信任的協作對象；連結外流等同給予完整編輯權限。
- 若未來需要更嚴謹的權限控管，可在 Supabase 加上 Email/Magic Link 登入，並將 RLS policy 改為僅允許特定使用者存取。
