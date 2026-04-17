import { apiRequest } from "@/shared/api/client";
import type { Achievement, ClaimResponse, RefreshResponse } from "../model/types";

export async function fetchAchievementsApi(): Promise<{
  success: boolean;
  data?: Achievement[];
  error?: string;
}> {
  try {
    const data = await apiRequest<Achievement[]>("/api/v1/achievements/", { auth: true });
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
    // 429 Too Many Requests
    if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 429) {
      const retryAfter =
        "retry_after" in err ? (err as { retry_after?: number }).retry_after : undefined;
      return { success: false, error: "잠시 후 다시 시도해주세요.", retryAfter };
    }
    return { success: false, error: "평가 새로고침에 실패했습니다." };
  }
}
