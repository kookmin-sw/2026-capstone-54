import { apiRequest } from "@/shared/api/client";

// ── Backend response shape (snake_case) ──────────────────────────────────────
interface BackendNotification {
  id: number;
  message: string;
  category: "interview" | "resume" | "jd" | "system";
  is_read: boolean;
  notifiable_type_label: string | null;
  notifiable_id: string | null;
  created_at: string;
}

type PaginatedResponse = {
  results: BackendNotification[];
  count: number;
  next: string | null;
  previous: string | null;
};

// ── Time formatter (standalone — avoids circular dep with store) ──────────────
function formatTime(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 172800) return "어제";
  return `${Math.floor(diff / 86400)}일 전`;
}

// ── snake_case → camelCase mapper ─────────────────────────────────────────────
export function toStoreNotification(b: BackendNotification) {
  return {
    id: b.id,
    message: b.message,
    time: formatTime(b.created_at),
    read: b.is_read,
    category: b.category,
    notifiableType: b.notifiable_type_label,
    notifiableId: b.notifiable_id,
  };
}

// ── API functions ──────────────────────────────────────────────────────────────

/**
 * GET /api/v1/notifications/
 * 페이지네이션 응답과 단순 배열 응답 모두 처리
 */
export async function fetchNotifications() {
  const data = await apiRequest<PaginatedResponse | BackendNotification[]>(
    "/api/v1/notifications/",
    { auth: true },
  );
  const list = Array.isArray(data) ? data : data.results;
  return list.map(toStoreNotification);
}

/**
 * PATCH /api/v1/notifications/{id}/read/
 */
export async function markNotificationRead(id: number) {
  const data = await apiRequest<BackendNotification>(
    `/api/v1/notifications/${id}/read/`,
    { method: "PATCH", auth: true },
  );
  return toStoreNotification(data);
}

/**
 * PATCH /api/v1/notifications/mark-all-read/
 */
export async function markAllNotificationsRead() {
  return apiRequest<{ updated: number }>(
    "/api/v1/notifications/mark-all-read/",
    { method: "PATCH", auth: true },
  );
}

/**
 * DELETE /api/v1/notifications/{id}/
 */
export async function deleteNotification(id: number) {
  return apiRequest<void>(`/api/v1/notifications/${id}/`, {
    method: "DELETE",
    auth: true,
  });
}

/**
 * DELETE /api/v1/notifications/clear/
 */
export async function clearAllNotifications() {
  return apiRequest<{ deleted: number }>("/api/v1/notifications/clear/", {
    method: "DELETE",
    auth: true,
  });
}
