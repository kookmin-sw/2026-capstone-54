import { apiRequest } from "@/shared/api/client";
import type { ClaimResponse, FilterState, PaginatedAchievements, RefreshResponse } from "../model/types";

/** 필터 + 페이지네이션 파라미터를 쿼리 스트링으로 변환 */
function buildQueryString(filters: FilterState, limit: number, offset: number): string {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.rewardClaim) params.set("reward_claim", filters.rewardClaim);
  return params.toString();
}

export async function fetchAchievementsApi(
  filters: FilterState = { category: null, status: null, rewardClaim: null },
  limit = 20,
  offset = 0,
): Promise<{
  success: boolean;
  data?: PaginatedAchievements;
  error?: string;
}> {
  try {
    const qs = buildQueryString(filters, limit, offset);
    const data = await apiRequest<PaginatedAchievements>(`/api/v1/achievements/?${qs}`, { auth: true });
    return { success: true, data };
  } catch {
    return { success: false, error: "도전과제를 불러오지 못했습니다." };
  }
}

export async function claimAchievementApi(code: string): Promise<{
  success: boolean;
  data?: ClaimResponse;
  error?: string;
}> {
  try {
    const data = await apiRequest<ClaimResponse>(`/api/v1/achievements/${code}/claim/`, {
      auth: true,
      method: "POST",
    });
    return { success: true, data };
  } catch {
    return { success: false, error: "보상 수령에 실패했습니다." };
  }
}

export async function refreshAchievementsApi(): Promise<{
  success: boolean;
  data?: RefreshResponse;
  error?: string;
  retryAfter?: number;
}> {
  try {
    const data = await apiRequest<RefreshResponse>("/api/v1/achievements/refresh/", {
      auth: true,
      method: "POST",
    });
    return { success: true, data };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 429) {
      const retryAfter =
        "retry_after" in err ? (err as { retry_after?: number }).retry_after : undefined;
      return { success: false, error: "잠시 후 다시 시도해주세요.", retryAfter };
    }
    return { success: false, error: "평가 새로고침에 실패했습니다." };
  }
}
