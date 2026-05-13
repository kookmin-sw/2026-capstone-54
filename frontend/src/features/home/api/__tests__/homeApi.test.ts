const mockGetMe = jest.fn();
const mockFetchDashboard = jest.fn();

jest.mock("@/shared/api/userApi", () => ({
  userApi: { getMe: (...args: unknown[]) => mockGetMe(...args) },
}));

jest.mock("../dashboardApi", () => ({
  fetchDashboardStatisticsApi: (...args: unknown[]) => mockFetchDashboard(...args),
}));

jest.mock("@/shared/lib/format/greeting", () => ({
  getTimeBasedGreeting: () => "Good day",
}));

import { fetchHomeDataApi } from "../homeApi";

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2025-05-15T10:00:00Z"));
});

afterEach(() => {
  jest.useRealTimers();
});

describe("fetchHomeDataApi — 정상 경로", () => {
  it("user + dashboard 모두 성공 → success=true + stats 매핑", async () => {
    mockGetMe.mockResolvedValue({ name: "홍길동" });
    mockFetchDashboard.mockResolvedValue({
      totalCompletedInterviews: 12,
      averageScore: 85,
      averageScoreSampleSize: 10,
      currentStreakDays: 5,
      totalPracticeTimeSeconds: 7200,
      lastParticipatedDate: "2025-05-13",
    });

    const result = await fetchHomeDataApi();

    expect(result.success).toBe(true);
    expect(result.data?.user.name).toBe("홍길동");
    expect(result.data?.currentStreak).toBe(5);
    expect(result.data?.stats[0].value).toBe(12);
    expect(result.data?.stats[1].value).toBe(85);
    expect(result.data?.stats[2].value).toBe(5);
    expect(result.data?.stats[3]).toMatchObject({ value: 2, unit: "h" });
  });

  it("lastParticipatedDate 2 일 전 → lastInterviewDaysAgo=2", async () => {
    mockGetMe.mockResolvedValue({ name: "홍" });
    mockFetchDashboard.mockResolvedValue({
      totalCompletedInterviews: 0,
      averageScore: null,
      averageScoreSampleSize: 0,
      currentStreakDays: 0,
      totalPracticeTimeSeconds: 0,
      lastParticipatedDate: "2025-05-13T10:00:00Z",
    });

    const result = await fetchHomeDataApi();

    expect(result.data?.user.lastInterviewDaysAgo).toBe(2);
  });

  it("lastParticipatedDate=null → lastInterviewDaysAgo=null", async () => {
    mockGetMe.mockResolvedValue({ name: "x" });
    mockFetchDashboard.mockResolvedValue({
      totalCompletedInterviews: 0,
      averageScore: null,
      averageScoreSampleSize: 0,
      currentStreakDays: 0,
      totalPracticeTimeSeconds: 0,
      lastParticipatedDate: null,
    });

    const result = await fetchHomeDataApi();

    expect(result.data?.user.lastInterviewDaysAgo).toBeNull();
  });

  it("practice time < 3600s → 분 단위 (Math.round(s/60))", async () => {
    mockGetMe.mockResolvedValue({ name: "x" });
    mockFetchDashboard.mockResolvedValue({
      totalCompletedInterviews: 0,
      averageScore: null,
      averageScoreSampleSize: 0,
      currentStreakDays: 0,
      totalPracticeTimeSeconds: 1800,
      lastParticipatedDate: null,
    });

    const result = await fetchHomeDataApi();

    expect(result.data?.stats[3]).toMatchObject({ value: 30, unit: "분" });
  });

  it("practice time = 0 → 0h", async () => {
    mockGetMe.mockResolvedValue({ name: "x" });
    mockFetchDashboard.mockResolvedValue({
      totalCompletedInterviews: 0,
      averageScore: null,
      averageScoreSampleSize: 0,
      currentStreakDays: 0,
      totalPracticeTimeSeconds: 0,
      lastParticipatedDate: null,
    });

    const result = await fetchHomeDataApi();

    expect(result.data?.stats[3]).toMatchObject({ value: 0, unit: "h" });
  });

  it("user.name=빈 문자열 → mock data 의 '사용자' fallback", async () => {
    mockGetMe.mockResolvedValue({ name: "" });
    mockFetchDashboard.mockResolvedValue({
      totalCompletedInterviews: 0,
      averageScore: null,
      averageScoreSampleSize: 0,
      currentStreakDays: 0,
      totalPracticeTimeSeconds: 0,
      lastParticipatedDate: null,
    });

    const result = await fetchHomeDataApi();

    expect(result.data?.user.name).toBe("사용자");
  });
});

describe("fetchHomeDataApi — 에러 경로", () => {
  it("getMe throw → success=false + 에러 메시지, dashboard 는 정상 처리", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetMe.mockRejectedValue(new Error("user fetch fail"));
    mockFetchDashboard.mockResolvedValue({
      totalCompletedInterviews: 1,
      averageScore: 80,
      averageScoreSampleSize: 1,
      currentStreakDays: 2,
      totalPracticeTimeSeconds: 600,
      lastParticipatedDate: null,
    });

    const result = await fetchHomeDataApi();

    expect(result.success).toBe(false);
    expect(result.error).toContain("user fetch fail");
    expect(result.data?.currentStreak).toBe(2);
    errSpy.mockRestore();
  });

  it("dashboard throw → user 는 정상 + placeholder stats 사용", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetMe.mockResolvedValue({ name: "홍" });
    mockFetchDashboard.mockRejectedValue(new Error("dashboard fail"));

    const result = await fetchHomeDataApi();

    expect(result.success).toBe(false);
    expect(result.error).toContain("dashboard fail");
    expect(result.data?.user.name).toBe("홍");
    expect(result.data?.stats[0].value).toBe(0);
    errSpy.mockRestore();
  });

  it("둘 다 throw → 에러 메시지 합쳐서 ' / ' 구분", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetMe.mockRejectedValue(new Error("e1"));
    mockFetchDashboard.mockRejectedValue(new Error("e2"));

    const result = await fetchHomeDataApi();

    expect(result.success).toBe(false);
    expect(result.error).toContain("e1");
    expect(result.error).toContain("e2");
    expect(result.error).toContain(" / ");
    errSpy.mockRestore();
  });
});
