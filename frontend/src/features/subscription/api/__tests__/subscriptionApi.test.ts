const mockApiRequest = jest.fn();

jest.mock("@/shared/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import {
  fetchSubscriptionApi,
  createCheckoutApi,
  cancelSubscriptionApi,
} from "../subscriptionApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchSubscriptionApi", () => {
  it("성공 → data 반환 + auth=true 요청", async () => {
    const data = {
      id: 1,
      planType: "pro",
      planTypeDisplay: "Pro",
      status: "active",
      isCancelled: false,
      policy: {
        limits: { maxActiveResumes: null, maxActiveJobDescriptions: null, interviewSessionHistoryDays: null },
        features: {
          fullProcessInterview: true,
          realModeInterview: true,
          eyeTrackingAnalysis: true,
          reportRecordingPlayback: true,
          unlimitedInterviewSessionAccess: true,
        },
      },
      startedAt: "x", expiresAt: null, cancelledAt: null, createdAt: "", updatedAt: "",
    };
    mockApiRequest.mockResolvedValue(data);

    const result = await fetchSubscriptionApi();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/subscriptions/me/",
      expect.objectContaining({ auth: true }),
    );
    expect(result.success).toBe(true);
    expect(result.data).toEqual(data);
  });

  it("실패 → success=false + 한국어 에러 메시지", async () => {
    mockApiRequest.mockRejectedValue(new Error("server"));
    const result = await fetchSubscriptionApi();
    expect(result.success).toBe(false);
    expect(result.error).toContain("요금제");
  });
});

describe("createCheckoutApi / cancelSubscriptionApi (준비 중 placeholder)", () => {
  it("createCheckoutApi → success=false + '결제 연동은 준비 중'", async () => {
    const result = await createCheckoutApi({ plan: "pro", billingCycle: "monthly" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("결제 연동");
  });

  it("cancelSubscriptionApi → success=false + '구독 변경 API 연동' 메시지", async () => {
    const result = await cancelSubscriptionApi();
    expect(result.success).toBe(false);
    expect(result.message).toContain("구독 변경");
  });
});
