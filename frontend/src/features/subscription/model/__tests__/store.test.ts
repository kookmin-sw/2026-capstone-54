import { act } from "@testing-library/react";

jest.mock("../../api/subscriptionApi", () => ({
  fetchSubscriptionApi: jest.fn(),
  createCheckoutApi: jest.fn(),
  cancelSubscriptionApi: jest.fn(),
}));

import {
  fetchSubscriptionApi,
  createCheckoutApi,
  cancelSubscriptionApi,
} from "../../api/subscriptionApi";
import { useSubscriptionStore } from "../store";

const mockFetch = fetchSubscriptionApi as jest.Mock;
const mockCheckout = createCheckoutApi as jest.Mock;
const mockCancel = cancelSubscriptionApi as jest.Mock;

const FAKE_STATUS = {
  plan: "free",
  expiresAt: null,
  cancelledAt: null,
};

function resetStore() {
  act(() => {
    useSubscriptionStore.setState({
      status: null,
      loading: false,
      processing: false,
      error: null,
      successMessage: null,
      billingCycle: "monthly",
      openFaqIndex: null,
      redirectUrl: null,
    });
  });
}

describe("useSubscriptionStore — 초기 상태", () => {
  beforeEach(resetStore);

  it("status=null, billingCycle=monthly, 모든 flag false, 메시지 null", () => {
    const state = useSubscriptionStore.getState();
    expect(state.status).toBeNull();
    expect(state.billingCycle).toBe("monthly");
    expect(state.loading).toBe(false);
    expect(state.processing).toBe(false);
    expect(state.error).toBeNull();
    expect(state.successMessage).toBeNull();
    expect(state.openFaqIndex).toBeNull();
    expect(state.redirectUrl).toBeNull();
  });
});

describe("useSubscriptionStore — billing toggle", () => {
  beforeEach(resetStore);

  it("setBillingCycle 이 cycle 설정", () => {
    act(() => useSubscriptionStore.getState().setBillingCycle("yearly"));
    expect(useSubscriptionStore.getState().billingCycle).toBe("yearly");

    act(() => useSubscriptionStore.getState().setBillingCycle("monthly"));
    expect(useSubscriptionStore.getState().billingCycle).toBe("monthly");
  });

  it("toggleBilling 이 monthly ↔ yearly 토글", () => {
    expect(useSubscriptionStore.getState().billingCycle).toBe("monthly");

    act(() => useSubscriptionStore.getState().toggleBilling());
    expect(useSubscriptionStore.getState().billingCycle).toBe("yearly");

    act(() => useSubscriptionStore.getState().toggleBilling());
    expect(useSubscriptionStore.getState().billingCycle).toBe("monthly");
  });
});

describe("useSubscriptionStore — FAQ", () => {
  beforeEach(resetStore);

  it("toggleFaq(idx) 가 동일 idx 면 close, 다른 idx 면 switch", () => {
    act(() => useSubscriptionStore.getState().toggleFaq(0));
    expect(useSubscriptionStore.getState().openFaqIndex).toBe(0);

    act(() => useSubscriptionStore.getState().toggleFaq(0));
    expect(useSubscriptionStore.getState().openFaqIndex).toBeNull();

    act(() => useSubscriptionStore.getState().toggleFaq(2));
    expect(useSubscriptionStore.getState().openFaqIndex).toBe(2);

    act(() => useSubscriptionStore.getState().toggleFaq(3));
    expect(useSubscriptionStore.getState().openFaqIndex).toBe(3);
  });
});

describe("useSubscriptionStore — clearMessages / clearRedirectUrl", () => {
  beforeEach(resetStore);

  it("clearMessages 가 error + successMessage 둘 다 null 화 (다른 상태 유지)", () => {
    act(() => useSubscriptionStore.setState({
      error: "에러",
      successMessage: "성공",
      loading: true,
      billingCycle: "yearly",
    }));

    act(() => useSubscriptionStore.getState().clearMessages());

    const state = useSubscriptionStore.getState();
    expect(state.error).toBeNull();
    expect(state.successMessage).toBeNull();
    expect(state.loading).toBe(true);
    expect(state.billingCycle).toBe("yearly");
  });

  it("clearRedirectUrl 이 redirectUrl 만 null 화", () => {
    act(() => useSubscriptionStore.setState({
      redirectUrl: "https://example.com",
      successMessage: "유지",
    }));

    act(() => useSubscriptionStore.getState().clearRedirectUrl());

    const state = useSubscriptionStore.getState();
    expect(state.redirectUrl).toBeNull();
    expect(state.successMessage).toBe("유지");
  });
});

describe("useSubscriptionStore — fetchStatus", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 status 저장 + loading=false", async () => {
    mockFetch.mockResolvedValue({ success: true, data: FAKE_STATUS });

    await act(async () => useSubscriptionStore.getState().fetchStatus());

    const state = useSubscriptionStore.getState();
    expect(state.status).toEqual(FAKE_STATUS);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("실패 시 error 설정 + loading=false", async () => {
    mockFetch.mockResolvedValue({ success: false, error: "권한 없음" });

    await act(async () => useSubscriptionStore.getState().fetchStatus());

    expect(useSubscriptionStore.getState().error).toBe("권한 없음");
    expect(useSubscriptionStore.getState().loading).toBe(false);
  });

  it("error 없으면 기본 메시지 사용", async () => {
    mockFetch.mockResolvedValue({ success: false });

    await act(async () => useSubscriptionStore.getState().fetchStatus());

    expect(useSubscriptionStore.getState().error).toMatch(/불러오지 못했습니다/);
  });
});

describe("useSubscriptionStore — checkout", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 + https + mefit.kr 도메인이면 redirectUrl 저장", async () => {
    mockCheckout.mockResolvedValue({
      success: true,
      redirectUrl: "https://billing.mefit.kr/checkout",
      message: "결제 페이지로 이동",
    });

    await act(async () => useSubscriptionStore.getState().checkout());

    const state = useSubscriptionStore.getState();
    expect(state.redirectUrl).toBe("https://billing.mefit.kr/checkout");
    expect(state.successMessage).toBe("결제 페이지로 이동");
    expect(state.processing).toBe(false);
  });

  it("성공이지만 http 도메인이면 redirectUrl null (보안 검증)", async () => {
    mockCheckout.mockResolvedValue({
      success: true,
      redirectUrl: "http://insecure.mefit.kr",
      message: "ok",
    });

    await act(async () => useSubscriptionStore.getState().checkout());

    expect(useSubscriptionStore.getState().redirectUrl).toBeNull();
  });

  it("성공이지만 mefit.kr 외 도메인이면 redirectUrl null", async () => {
    mockCheckout.mockResolvedValue({
      success: true,
      redirectUrl: "https://evil.com/checkout",
      message: "ok",
    });

    await act(async () => useSubscriptionStore.getState().checkout());

    expect(useSubscriptionStore.getState().redirectUrl).toBeNull();
  });

  it("성공이지만 redirectUrl='#' 이면 null", async () => {
    mockCheckout.mockResolvedValue({ success: true, redirectUrl: "#", message: "ok" });

    await act(async () => useSubscriptionStore.getState().checkout());

    expect(useSubscriptionStore.getState().redirectUrl).toBeNull();
  });

  it("잘못된 URL 형식이면 redirectUrl null (URL 파싱 실패)", async () => {
    mockCheckout.mockResolvedValue({
      success: true,
      redirectUrl: "not-a-url",
      message: "ok",
    });

    await act(async () => useSubscriptionStore.getState().checkout());

    expect(useSubscriptionStore.getState().redirectUrl).toBeNull();
  });

  it("실패 시 error 설정 + processing=false", async () => {
    mockCheckout.mockResolvedValue({ success: false, message: "결제 실패" });

    await act(async () => useSubscriptionStore.getState().checkout());

    expect(useSubscriptionStore.getState().error).toBe("결제 실패");
    expect(useSubscriptionStore.getState().processing).toBe(false);
  });

  it("checkout 시작 시 이전 error/successMessage clear", async () => {
    act(() => useSubscriptionStore.setState({ error: "이전", successMessage: "이전 성공" }));
    let resolvePromise: (value: { success: boolean; message: string }) => void;
    mockCheckout.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));

    act(() => { void useSubscriptionStore.getState().checkout(); });

    expect(useSubscriptionStore.getState().processing).toBe(true);
    expect(useSubscriptionStore.getState().error).toBeNull();
    expect(useSubscriptionStore.getState().successMessage).toBeNull();

    await act(async () => {
      resolvePromise!({ success: true, message: "ok" });
    });
  });

  it("checkout 호출 시 billingCycle 을 plan='pro' 와 함께 전달", async () => {
    act(() => useSubscriptionStore.getState().setBillingCycle("yearly"));
    mockCheckout.mockResolvedValue({ success: true, message: "ok" });

    await act(async () => useSubscriptionStore.getState().checkout());

    expect(mockCheckout).toHaveBeenCalledWith({ plan: "pro", billingCycle: "yearly" });
  });
});

describe("useSubscriptionStore — cancelSubscription", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 fetchStatus 재호출 + successMessage 설정", async () => {
    mockCancel.mockResolvedValue({ success: true, message: "해지 완료" });
    mockFetch.mockResolvedValue({
      success: true,
      data: { ...FAKE_STATUS, cancelledAt: "2026-05-10" },
    });

    await act(async () => useSubscriptionStore.getState().cancelSubscription());

    const state = useSubscriptionStore.getState();
    expect(state.successMessage).toBe("해지 완료");
    expect(state.status?.cancelledAt).toBe("2026-05-10");
    expect(mockFetch).toHaveBeenCalled();
  });

  it("실패 시 error 설정 + fetchStatus 미호출", async () => {
    mockCancel.mockResolvedValue({ success: false, message: "이미 해지됨" });

    await act(async () => useSubscriptionStore.getState().cancelSubscription());

    expect(useSubscriptionStore.getState().error).toBe("이미 해지됨");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
