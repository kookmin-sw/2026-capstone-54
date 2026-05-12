const mockApiRequest = jest.fn();

jest.mock("@/shared/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { fetchDashboardStatisticsApi } from "../dashboardApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchDashboardStatisticsApi", () => {
  it("camelCase 응답 → 그대로 매핑", async () => {
    mockApiRequest.mockResolvedValue({
      totalCompletedInterviews: 5,
      averageScore: 85,
      averageScoreSampleSize: 4,
      currentStreakDays: 3,
      totalPracticeTimeSeconds: 7200,
      lastParticipatedDate: "2025-05-15",
    });

    const result = await fetchDashboardStatisticsApi();

    expect(result).toEqual({
      totalCompletedInterviews: 5,
      averageScore: 85,
      averageScoreSampleSize: 4,
      currentStreakDays: 3,
      totalPracticeTimeSeconds: 7200,
      lastParticipatedDate: "2025-05-15",
    });
  });

  it("snake_case 응답 → camelCase 로 fallback 매핑", async () => {
    mockApiRequest.mockResolvedValue({
      total_completed_interviews: 10,
      average_score: 90,
      average_score_sample_size: 8,
      current_streak_days: 7,
      total_practice_time_seconds: 14400,
      last_participated_date: "2025-05-14",
    });

    const result = await fetchDashboardStatisticsApi();

    expect(result.totalCompletedInterviews).toBe(10);
    expect(result.averageScore).toBe(90);
    expect(result.currentStreakDays).toBe(7);
  });

  it("필드 없음 → 기본값 (0, null) 매핑", async () => {
    mockApiRequest.mockResolvedValue({});

    const result = await fetchDashboardStatisticsApi();

    expect(result).toEqual({
      totalCompletedInterviews: 0,
      averageScore: null,
      averageScoreSampleSize: 0,
      currentStreakDays: 0,
      totalPracticeTimeSeconds: 0,
      lastParticipatedDate: null,
    });
  });

  it("auth=true + GET 메서드 옵션 전달", async () => {
    mockApiRequest.mockResolvedValue({});
    await fetchDashboardStatisticsApi();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/dashboard/statistics/",
      expect.objectContaining({ method: "GET", auth: true }),
    );
  });

  it("API throw → propagate (caller 가 처리)", async () => {
    mockApiRequest.mockRejectedValue(new Error("server fail"));
    await expect(fetchDashboardStatisticsApi()).rejects.toThrow("server fail");
  });
});
