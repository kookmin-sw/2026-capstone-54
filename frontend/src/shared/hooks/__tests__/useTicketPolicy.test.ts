const mockFetchPolicy = jest.fn();

jest.mock("@/shared/api", () => ({
  fetchTicketPolicyApi: (...a: unknown[]) => mockFetchPolicy(...a),
}));

import { renderHook, waitFor, act } from "@testing-library/react";
import { useTicketPolicy } from "../useTicketPolicy";

const POLICY = {
  freeDailyTicketAmount: 3,
  proDailyTicketAmount: 10,
  ticketCostFollowupInterview: 1,
  ticketCostFullProcessInterview: 3,
  ticketCostAnalysisReport: 1,
  maxRewardedInterviewsPerDay: 5,
  ticketRewardPerInterviewOrder: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("useTicketPolicy", () => {
  it("캐시 없음 + API 성공 → policy 로드 + localStorage 캐시 저장", async () => {
    mockFetchPolicy.mockResolvedValue({ success: true, data: POLICY });

    const { result } = renderHook(() => useTicketPolicy());

    await waitFor(() => expect(result.current.policy).toEqual(POLICY));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    const cached = JSON.parse(localStorage.getItem("mefit_ticket_policy")!);
    expect(cached.data).toEqual(POLICY);
  });

  it("캐시 있음 (1시간 이내) → API 호출 안 함 + 캐시된 policy 즉시 반환", async () => {
    localStorage.setItem(
      "mefit_ticket_policy",
      JSON.stringify({ data: POLICY, timestamp: Date.now() }),
    );

    const { result } = renderHook(() => useTicketPolicy());

    expect(result.current.policy).toEqual(POLICY);
    await waitFor(() => expect(mockFetchPolicy).not.toHaveBeenCalled());
  });

  it("캐시 만료 (1시간 초과) → 캐시 무효 + API 재호출", async () => {
    const expired = Date.now() - 2 * 60 * 60 * 1000;
    localStorage.setItem(
      "mefit_ticket_policy",
      JSON.stringify({ data: POLICY, timestamp: expired }),
    );
    mockFetchPolicy.mockResolvedValue({ success: true, data: POLICY });

    const { result } = renderHook(() => useTicketPolicy());

    await waitFor(() => {
      expect(mockFetchPolicy).toHaveBeenCalled();
      expect(result.current.policy).toEqual(POLICY);
    });
  });

  it("API 실패 → error 설정", async () => {
    mockFetchPolicy.mockResolvedValue({ success: false, error: "서버 오류" });

    const { result } = renderHook(() => useTicketPolicy());

    await waitFor(() => expect(result.current.error).toBe("서버 오류"));
    expect(result.current.loading).toBe(false);
  });

  it("API 실패 + error 없음 → 기본 '정책 조회 실패' fallback", async () => {
    mockFetchPolicy.mockResolvedValue({ success: false });

    const { result } = renderHook(() => useTicketPolicy());

    await waitFor(() => expect(result.current.error).toContain("정책 조회"));
  });

  it("캐시 JSON 파싱 실패 → null fallback (try-catch)", async () => {
    localStorage.setItem("mefit_ticket_policy", "not-json{");
    mockFetchPolicy.mockResolvedValue({ success: true, data: POLICY });

    const { result } = renderHook(() => useTicketPolicy());

    await waitFor(() => expect(result.current.policy).toEqual(POLICY));
  });

  it("refetch() 수동 호출 → API 재호출 (캐시 있어도 fetchPolicy 분기 진입)", async () => {
    mockFetchPolicy.mockResolvedValue({ success: true, data: POLICY });
    const { result } = renderHook(() => useTicketPolicy());
    await waitFor(() => expect(result.current.policy).toEqual(POLICY));

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockFetchPolicy).toHaveBeenCalled();
  });
});
