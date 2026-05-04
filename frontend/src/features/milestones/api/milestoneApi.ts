import { apiRequest } from "@/shared/api/client";
import type { Milestone } from "./types";

/**
 * 마일스톤 목록을 Backend API에서 조회한다.
 * 인증 실패(401) 또는 네트워크 에러 시 에러를 반환한다.
 */
export async function fetchMilestonesApi(): Promise<{
  success: boolean;
  data?: Milestone[];
  error?: string;
}> {
  try {
    const data = await apiRequest<Milestone[]>("/api/v1/achievements/milestones/", {
      auth: true,
    });
    return { success: true, data };
  } catch {
    return { success: false, error: "마일스톤을 불러오지 못했습니다." };
  }
}
