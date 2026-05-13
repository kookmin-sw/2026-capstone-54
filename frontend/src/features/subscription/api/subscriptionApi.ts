import { apiRequest } from "@/shared/api/client";

export type PlanType = "free" | "pro";
export type BillingCycle = "monthly" | "yearly";

export interface SubscriptionPolicyLimits {
  maxActiveResumes: number | null;
  maxActiveJobDescriptions: number | null;
  interviewSessionHistoryDays: number | null;
}

export interface SubscriptionPolicyFeatures {
  fullProcessInterview: boolean;
  realModeInterview: boolean;
  eyeTrackingAnalysis: boolean;
  reportRecordingPlayback: boolean;
  unlimitedInterviewSessionAccess: boolean;
}

export interface SubscriptionPolicy {
  limits: SubscriptionPolicyLimits;
  features: SubscriptionPolicyFeatures;
}

export interface SubscriptionStatus {
  id: number;
  planType: PlanType;
  planTypeDisplay: string;
  status: string;
  isCancelled: boolean;
  policy: SubscriptionPolicy;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
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

const SUBSCRIPTION_BASE = "/api/v1/subscriptions";

export async function fetchSubscriptionApi(): Promise<{
  success: boolean;
  data?: SubscriptionStatus;
  error?: string;
}> {
  try {
    const data = await apiRequest<SubscriptionStatus>(`${SUBSCRIPTION_BASE}/me/`, { auth: true });
    return { success: true, data };
  } catch {
    return { success: false, error: "요금제 정보를 불러오지 못했습니다." };
  }
}

export async function createCheckoutApi(payload: {
  plan: PlanType;
  billingCycle: BillingCycle;
}): Promise<CheckoutResult> {
  void payload;
  return { success: false, message: "결제 연동은 준비 중입니다." };
}

export async function cancelSubscriptionApi(): Promise<CancelResult> {
  return { success: false, message: "구독 변경 API 연동은 준비 중입니다." };
}
