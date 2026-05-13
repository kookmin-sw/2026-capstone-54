const mockApiRequest = jest.fn();

jest.mock("@/shared/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import {
  fetchAchievementsApi,
  claimAchievementApi,
  refreshAchievementsApi,
} from "../achievementsApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchAchievementsApi", () => {
  it("기본 호출 → limit=20, offset=0 쿼리스트링", async () => {
    mockApiRequest.mockResolvedValue({ count: 0, results: [] });
    await fetchAchievementsApi();

    expect(mockApiRequest.mock.calls[0][0]).toMatch(/limit=20/);
    expect(mockApiRequest.mock.calls[0][0]).toMatch(/offset=0/);
  });

  it("filters 모두 있음 → category/status/reward_claim 쿼리 포함", async () => {
    mockApiRequest.mockResolvedValue({});
    await fetchAchievementsApi(
      { category: "interview", status: "completed", rewardClaim: "claimable" },
      10,
      30,
    );

    const url = mockApiRequest.mock.calls[0][0] as string;
    expect(url).toContain("category=interview");
    expect(url).toContain("status=completed");
    expect(url).toContain("reward_claim=claimable");
    expect(url).toContain("limit=10");
    expect(url).toContain("offset=30");
  });

  it("filters null 값 → 해당 쿼리 미포함", async () => {
    mockApiRequest.mockResolvedValue({});
    await fetchAchievementsApi({ category: null, status: "in_progress", rewardClaim: null });

    const url = mockApiRequest.mock.calls[0][0] as string;
    expect(url).toContain("status=in_progress");
    expect(url).not.toContain("category=");
    expect(url).not.toContain("reward_claim=");
  });

  it("API 실패 → success=false + 에러 메시지", async () => {
    mockApiRequest.mockRejectedValue(new Error("server"));
    const result = await fetchAchievementsApi();
    expect(result.success).toBe(false);
    expect(result.error).toContain("도전과제");
  });
});

describe("claimAchievementApi", () => {
  it("성공 → POST + auth + data 반환", async () => {
    mockApiRequest.mockResolvedValue({ code: "ACH-1", reward: "ticket" });
    const result = await claimAchievementApi("ACH-1");

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/achievements/ACH-1/claim/",
      expect.objectContaining({ method: "POST", auth: true }),
    );
    expect(result.success).toBe(true);
  });

  it("실패 → 에러 메시지", async () => {
    mockApiRequest.mockRejectedValue(new Error("forbidden"));
    const result = await claimAchievementApi("X");
    expect(result.success).toBe(false);
    expect(result.error).toContain("보상 수령");
  });
});

describe("refreshAchievementsApi", () => {
  it("성공 → success=true + data 반환", async () => {
    mockApiRequest.mockResolvedValue({ updated: 3 });
    const result = await refreshAchievementsApi();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/achievements/refresh/",
      expect.objectContaining({ method: "POST", auth: true }),
    );
    expect(result.success).toBe(true);
  });

  it("429 rate limit → '잠시 후 다시 시도' + retryAfter 추출", async () => {
    mockApiRequest.mockRejectedValue({ status: 429, retry_after: 60 });
    const result = await refreshAchievementsApi();

    expect(result.success).toBe(false);
    expect(result.error).toContain("잠시 후 다시 시도");
    expect(result.retryAfter).toBe(60);
  });

  it("일반 실패 → '평가 새로고침에 실패'", async () => {
    mockApiRequest.mockRejectedValue(new Error("server"));
    const result = await refreshAchievementsApi();
    expect(result.success).toBe(false);
    expect(result.error).toContain("평가 새로고침");
  });
});
