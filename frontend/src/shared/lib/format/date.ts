/**
 * Parse a date-like value into a Date object.
 * Accepts Date, ISO string, or Unix timestamp (ms).
 */
function toDate(value: string | number | Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  return new Date(value);
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

/** "2024.03.05" */
export function formatDateShort(value: string | number | Date): string {
  const d = toDate(value);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** "2024.03.05 14:30" */
export function formatDateTime(value: string | number | Date): string {
  const d = toDate(value);
  return `${formatDateShort(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "2024.03.05 14:30:09" */
export function formatDateTimeFull(value: string | number | Date): string {
  const d = toDate(value);
  return `${formatDateTime(d)}:${pad(d.getSeconds())}`;
}

/** "3월 5일" */
export function formatMonthDay(value: string | number | Date): string {
  const d = toDate(value);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** "2024년 3월 5일" */
export function formatDateKorean(value: string | number | Date): string {
  const d = toDate(value);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** Relative time: "방금 전", "3분 전", "2시간 전", "어제", "3일 전" etc. */
export function formatRelativeTime(value: string | number | Date): string {
  const d = toDate(value);
  const now = Date.now();
  const diff = now - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return "어제";
  if (days < 30) return `${days}일 전`;
  return formatDateShort(d);
}
