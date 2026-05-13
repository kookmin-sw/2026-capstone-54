const mockApiRequest = jest.fn();

jest.mock("../client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { fetchTicketPolicyApi, fetchUserTicketApi } from "../ticketsApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchTicketPolicyApi", () => {
  it("성공 → success=true + data (비인증)", async () => {
    const policy = {
      freeDailyTicketAmount: 3,
      proDailyTicketAmount: 10,
      ticketCostFollowupInterview: 1,
      ticketCostFullProcessInterview: 3,
      ticketCostAnalysisReport: 1,
      maxRewardedInterviewsPerDay: 5,
      ticketRewardPerInterviewOrder: [],
    };
    mockApiRequest.mockResolvedValue(policy);

    const result = await fetchTicketPolicyApi();
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/tickets/policies/");
    expect(result.success).toBe(true);
    expect(result.data).toEqual(policy);
  });

  it("실패 (Error 인스턴스) → success=false + error.message", async () => {
    mockApiRequest.mockRejectedValue(new Error("server fail"));
    const result = await fetchTicketPolicyApi();
    expect(result.success).toBe(false);
    expect(result.error).toBe("server fail");
  });

  it("실패 (non-Error) → 기본 한국어 메시지", async () => {
    mockApiRequest.mockRejectedValue({ status: 500 });
    const result = await fetchTicketPolicyApi();
    expect(result.error).toContain("정책 조회 실패");
  });
});

describe("fetchUserTicketApi", () => {
  it("성공 → auth=true + data 매핑", async () => {
    mockApiRequest.mockResolvedValue({ dailyCount: 3, purchasedCount: 5, totalCount: 8 });

    const result = await fetchUserTicketApi();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/tickets/me/",
      expect.objectContaining({ auth: true }),
    );
    expect(result.data?.totalCount).toBe(8);
  });

  it("실패 → '티켓 조회 실패' fallback", async () => {
    mockApiRequest.mockRejectedValue({});
    const result = await fetchUserTicketApi();
    expect(result.error).toContain("티켓 조회 실패");
  });
});
