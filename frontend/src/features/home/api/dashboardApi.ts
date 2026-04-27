import { apiRequest } from "@/shared/api/client";

export interface DashboardStatistics {
  totalCompletedInterviews: number;
  averageScore: number | null;
  averageScoreSampleSize: number;
  currentStreakDays: number;
  totalPracticeTimeSeconds: number;
}

export async function fetchDashboardStatisticsApi(): Promise<DashboardStatistics> {
  const data = await apiRequest<DashboardStatistics>(
    "/api/v1/dashboard/statistics/",
    { method: "GET", auth: true },
  );

  return {
    totalCompletedInterviews: data.totalCompletedInterviews ?? 0,
    averageScore: data.averageScore ?? null,
    averageScoreSampleSize: data.averageScoreSampleSize ?? 0,
    currentStreakDays: data.currentStreakDays ?? 0,
    totalPracticeTimeSeconds: data.totalPracticeTimeSeconds ?? 0,
  };
}
