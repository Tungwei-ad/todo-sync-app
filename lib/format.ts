export function formatDeadline(deadline: string | null): string {
  if (!deadline) return "";
  const d = new Date(deadline + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deadline + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function isUrgent(deadline: string | null): boolean {
  const days = daysUntil(deadline);
  return days !== null && days <= 14;
}

export function isOverdue(deadline: string | null): boolean {
  const days = daysUntil(deadline);
  return days !== null && days < 0;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 30) return "剛剛更新";
  if (diffSec < 60) return `${diffSec} 秒前更新`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} 分鐘前更新`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小時前更新`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} 天前更新`;

  const d = new Date(then);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} 更新`;
}
