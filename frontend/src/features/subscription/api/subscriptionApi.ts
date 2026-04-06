// Subscription API — Mocked (set USE_MOCK = false when backend is ready)

const USE_MOCK = true;

/* ── Types ── */
export type PlanType = "free" | "pro";
export type BillingCycle = "monthly" | "yearly";

export interface SubscriptionStatus {
  currentPlan: PlanType;
  billingCycle: BillingCycle | null;
  nextBillingDate: string | null;
  trialEndsAt: string | null;
  resumeUsed: number;
  resumeMax: number;
  jdUsed: number;
  jdMax: number;
}

export interface CheckoutResult {
  success: boolean;
  redirectUrl?: string;
  message: string;
}

export interface CancelResult {
  success: boolean;
  message: string;
}

/* ── Mock Data ── */
const getMockStatus = (): SubscriptionStatus => ({
  currentPlan: "free",
  billingCycle: null,
  nextBillingDate: null,
  trialEndsAt: null,
  resumeUsed: 1,
  resumeMax: 3,
  jdUsed: 2,
  jdMax: 5,
});

/* ── Fetch Subscription Status ── */
export async function fetchSubscriptionApi(): Promise<{
  success: boolean;
  data?: SubscriptionStatus;
  error?: string;
}> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 350));
    return { success: true, data: getMockStatus() };
  }
  try {
    const res = await fetch("/api/v1/subscription/", { method: "GET", credentials: "include" });
    if (!res.ok) return { success: true, data: getMockStatus() };
    return { success: true, data: await res.json() };
  } catch {
    return { success: true, data: getMockStatus() };
  }
}

/* ── Create Checkout Session (Pro 구독 시작) ── */
export async function createCheckoutApi(payload: {
  plan: PlanType;
  billingCycle: BillingCycle;
}): Promise<CheckoutResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 900));
    return {
      success: true,
      redirectUrl: "#",
      message: "결제 페이지로 이동합니다. (목 모드)",
    };
  }
  try {
    const res = await fetch("/api/v1/subscription/checkout/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ plan: payload.plan, billing_cycle: payload.billingCycle }),
    });
    if (!res.ok) return { success: false, message: "결제 세션 생성에 실패했습니다." };
    const json = await res.json();
    return { success: true, redirectUrl: json.redirect_url, message: "결제 페이지로 이동합니다." };
  } catch {
    return { success: false, message: "네트워크 오류가 발생했습니다." };
  }
}

/* ── Cancel Subscription ── */
export async function cancelSubscriptionApi(): Promise<CancelResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return { success: true, message: "구독이 취소되었습니다." };
  }
  try {
    const res = await fetch("/api/v1/subscription/cancel/", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return { success: false, message: "구독 취소에 실패했습니다." };
    return { success: true, message: "구독이 취소되었습니다." };
  } catch {
    return { success: false, message: "네트워크 오류가 발생했습니다." };
  }
}
