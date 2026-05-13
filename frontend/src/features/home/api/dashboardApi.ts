import { apiRequest } from "@/shared/api/client";

export interface DashboardStatistics {
  totalCompletedInterviews: number;
  averageScore: number | null;
  averageScoreSampleSize: number;
  currentStreakDays: number;
  totalPracticeTimeSeconds: number;
  lastParticipatedDate: string | null;
}

export async function fetchDashboardStatisticsApi(): Promise<DashboardStatistics> {
  const data = await apiRequest<Record<string, unknown>>(
    "/api/v1/dashboard/statistics/",
    { method: "GET", auth: true },
  );

  return {
    totalCompletedInterviews: (data.totalCompletedInterviews ?? data.total_completed_interviews ?? 0) as number,
    averageScore: (data.averageScore ?? data.average_score ?? null) as number | null,
    averageScoreSampleSize: (data.averageScoreSampleSize ?? data.average_score_sample_size ?? 0) as number,
    currentStreakDays: (data.currentStreakDays ?? data.current_streak_days ?? 0) as number,
    totalPracticeTimeSeconds: (data.totalPracticeTimeSeconds ?? data.total_practice_time_seconds ?? 0) as number,
    lastParticipatedDate: (data.lastParticipatedDate ?? data.last_participated_date ?? null) as string | null,
  };
}
