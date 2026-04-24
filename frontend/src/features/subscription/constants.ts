import type { SubscriptionPolicy } from "./api/subscriptionApi";

/** Free 플랜 기본 정책 (API 미응답 시 fallback) */
export const DEFAULT_FREE_POLICY: SubscriptionPolicy = {
  limits: {
    maxActiveResumes: 3,
    maxActiveJobDescriptions: 5,
    interviewSessionHistoryDays: 7,
  },
  features: {
    fullProcessInterview: false,
    realModeInterview: false,
    eyeTrackingAnalysis: true,
    reportRecordingPlayback: false,
    unlimitedInterviewSessionAccess: false,
  },
};

/** Pro 플랜 월간 가격 표시 */
export const PRO_MONTHLY_PRICE = "₩9,900";
