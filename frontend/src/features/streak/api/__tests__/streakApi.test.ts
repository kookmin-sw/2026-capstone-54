const mockApiRequest = jest.fn();

jest.mock("@/shared/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { fetchStreakApi } from "../streakApi";

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2025-05-15T10:00:00Z"));
});

afterEach(() => {
  jest.useRealTimers();
});

describe("fetchStreakApi — 정상 경로", () => {
  it("statistics + logs 두 API 호출 + StreakData 매핑", async () => {
    mockApiRequest.mockImplementation((path: string) => {
      if (path === "/api/v1/streaks/statistics/") {
        return Promise.resolve({
          currentStreak: 5,
          longestStreak: 10,
          lastParticipatedDate: "2025-05-15",
          totalDays: 30,
        });
      }
      if (path.startsWith("/api/v1/streaks/logs/")) {
        return Promise.resolve({
          startDate: "2024-06-01",
          endDate: "2025-05-15",
          logs: [
            { date: "2025-05-15", interviewResultsCount: 2 },
            { date: "2025-05-14", interviewResultsCount: 1 },
          ],
        });
      }
      return Promise.resolve({});
    });

    const result = await fetchStreakApi();

    expect(result.success).toBe(true);
    expect(result.data?.currentStreak).toBe(5);
    expect(result.data?.bestStreak).toBe(10);
    expect(result.data?.totalDays).toBe(30);
    expect(result.data?.todayCompleted).toBe(true);
  });

  it("logs 기반 calendarDoneMap 빌드 ('YYYY-M' 키 + day → count)", async () => {
    mockApiRequest.mockImplementation((path: string) => {
      if (path === "/api/v1/streaks/statistics/") {
        return Promise.resolve({
          currentStreak: 1,
          longestStreak: 1,
          lastParticipatedDate: "2025-05-15",
          totalDays: 1,
        });
      }
      return Promise.resolve({
        startDate: "x",
        endDate: "y",
        logs: [
          { date: "2025-05-15", interviewResultsCount: 3 },
          { date: "2025-04-10", interviewResultsCount: 1 },
          { date: "2025-05-15", interviewResultsCount: 0 },
        ],
      });
    });

    const result = await fetchStreakApi();

    expect(result.data?.calendarDoneMap).toEqual({
      "2025-5": { 15: 3 },
      "2025-4": { 10: 1 },
    });
  });

  it("currentStreak=0 → todayCompleted=false (log 없을 때)", async () => {
    mockApiRequest.mockImplementation((path: string) => {
      if (path === "/api/v1/streaks/statistics/") {
        return Promise.resolve({
          currentStreak: 0,
          longestStreak: 0,
          lastParticipatedDate: null,
          totalDays: 0,
        });
      }
      return Promise.resolve({ startDate: "", endDate: "", logs: [] });
    });

    const result = await fetchStreakApi();

    expect(result.data?.todayCompleted).toBe(false);
  });

  it("milestones 빌드: currentStreak=0 → 모두 locked, daysRemaining 정상", async () => {
    mockApiRequest.mockImplementation((path: string) => {
      if (path === "/api/v1/streaks/statistics/") {
        return Promise.resolve({
          currentStreak: 0,
          longestStreak: 0,
          lastParticipatedDate: null,
          totalDays: 0,
        });
      }
      return Promise.resolve({ startDate: "", endDate: "", logs: [] });
    });

    const result = await fetchStreakApi();
    const milestones = result.data!.milestones;

    expect(milestones).toHaveLength(6);
    expect(milestones[0]).toMatchObject({ days: 3, daysRemaining: 3 });
    expect(milestones.every((m) => m.status === "locked" || m.status === "next")).toBe(true);
  });

  it("milestones: currentStreak=14 → 3/7/14 일 acheived 됨", async () => {
    mockApiRequest.mockImplementation((path: string) => {
      if (path === "/api/v1/streaks/statistics/") {
        return Promise.resolve({
          currentStreak: 14,
          longestStreak: 14,
          lastParticipatedDate: "2025-05-15",
          totalDays: 14,
        });
      }
      return Promise.resolve({ startDate: "", endDate: "", logs: [] });
    });

    const result = await fetchStreakApi();
    const ms = result.data!.milestones;

    expect(ms.find((m) => m.days === 3)?.status).toBe("achieved");
    expect(ms.find((m) => m.days === 7)?.status).toBe("achieved");
    expect(ms.find((m) => m.days === 14)?.status).toBe("achieved");
    expect(ms.find((m) => m.days === 30)?.status).toBe("locked");
  });

  it("nextReward: currentStreak=5 → target=7, progress 71, daysRemaining=2", async () => {
    mockApiRequest.mockImplementation((path: string) => {
      if (path === "/api/v1/streaks/statistics/") {
        return Promise.resolve({
          currentStreak: 5,
          longestStreak: 5,
          lastParticipatedDate: "2025-05-15",
          totalDays: 5,
        });
      }
      return Promise.resolve({ startDate: "", endDate: "", logs: [] });
    });

    const result = await fetchStreakApi();
    const nr = result.data!.nextReward;

    expect(nr.targetDays).toBe(7);
    expect(nr.daysRemaining).toBe(2);
    expect(nr.progress).toBeCloseTo(71, 0);
    expect(nr.reward).toBe("티켓 7개");
  });

  it("nextReward: currentStreak >= 100 → 마지막 target 사용", async () => {
    mockApiRequest.mockImplementation((path: string) => {
      if (path === "/api/v1/streaks/statistics/") {
        return Promise.resolve({
          currentStreak: 150,
          longestStreak: 150,
          lastParticipatedDate: "2025-05-15",
          totalDays: 150,
        });
      }
      return Promise.resolve({ startDate: "", endDate: "", logs: [] });
    });

    const result = await fetchStreakApi();
    const nr = result.data!.nextReward;

    expect(nr.targetDays).toBe(100);
    expect(nr.daysRemaining).toBe(0);
    expect(nr.progress).toBe(100);
  });
});

describe("fetchStreakApi — 에러 경로", () => {
  it("API throw → success=false + 에러 메시지", async () => {
    mockApiRequest.mockRejectedValue(new Error("network fail"));

    const result = await fetchStreakApi();

    expect(result.success).toBe(false);
    expect(result.error).toContain("스트릭 정보");
    expect(result.data).toBeUndefined();
  });

  it("logs 가 null/배열 아님 → 빈 배열로 안전 처리", async () => {
    mockApiRequest.mockImplementation((path: string) => {
      if (path === "/api/v1/streaks/statistics/") {
        return Promise.resolve({
          currentStreak: 0,
          longestStreak: 0,
          lastParticipatedDate: null,
          totalDays: 0,
        });
      }
      return Promise.resolve({ startDate: "", endDate: "", logs: null });
    });

    const result = await fetchStreakApi();
    expect(result.success).toBe(true);
    expect(result.data?.calendarDoneMap).toEqual({});
  });
});
