import { useEffect, useRef } from "react";
import { useSubscriptionStore } from "@/features/subscription";
import { DEFAULT_FREE_POLICY } from "@/features/subscription/constants";
import { TicketPolicyInfo } from "@/features/subscription/ui/TicketPolicyInfo";
import { PlanCards } from "./PlanCards";
import { FeatureComparison } from "./FeatureComparison";
import { PaymentMethods } from "./PaymentMethods";
import { TrustRow } from "./TrustRow";
import { FaqAccordion } from "./FaqAccordion";

export function SubscriptionPage() {
  const {
    status,
    loading,
    processing,
    error,
    successMessage,
    billingCycle,
    openFaqIndex,
    redirectUrl,
    fetchStatus,
    toggleBilling,
    checkout,
    cancelSubscription,
    toggleFaq,
    clearMessages,
    clearRedirectUrl,
  } = useSubscriptionStore();

  const proCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (successMessage || error) {
      const t = setTimeout(clearMessages, 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage, error, clearMessages]);

  useEffect(() => {
    if (redirectUrl) {
      clearRedirectUrl();
      window.location.href = redirectUrl;
    }
  }, [redirectUrl, clearRedirectUrl]);

  const isYearly = billingCycle === "yearly";
  const isPro = status?.planType === "pro";
  const policy = status?.policy;
  const proCtaText = isYearly ? "Pro 연간 결제 시작" : "Pro 시작하기";

  const scrollToPro = (e: React.MouseEvent) => {
    e.preventDefault();
    proCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <div className="bg-white min-h-[calc(100vh-60px)] pb-20">
        <div className="max-w-[900px] mx-auto px-4 sm:px-8">
          <div className="animate-[subFadeUp_.45s_ease_both]">
            <TicketPolicyInfo
              currentPlan={status?.planType ?? "free"}
              maxActiveResumes={policy?.limits.maxActiveResumes}
              maxActiveJobDescriptions={policy?.limits.maxActiveJobDescriptions}
            />
          </div>

          <div className="text-center pt-2 sm:pt-[32px] pb-8 sm:pb-11 animate-[subFadeUp_.45s_ease_.05s_both]">
            <div className="inline-flex items-center gap-[5px] text-[11px] font-bold tracking-[1.2px] uppercase text-[#0991B2] bg-[#E6F7FA] px-3 py-1 rounded-full mb-4">
              💎 요금제
            </div>
            <h1 className="text-[clamp(32px,5vw,52px)] font-black tracking-[-2px] leading-[1.05] text-[#0A0A0A] mb-[14px]">
              나에게 맞는 플랜을<br />선택하세요
            </h1>
            <p className="text-base text-[#6B7280] leading-[1.65] max-w-content mx-auto mb-8">
              숨겨진 비용 없이, 언제든 취소 가능합니다.<br />
              스트릭 보상으로 Pro 기능을 무료로 체험해보세요.
            </p>

            <div className="flex items-center justify-center gap-3">
              <span
                className={`text-sm font-${!isYearly ? "bold text-[#0A0A0A]" : "semibold text-[#9CA3AF]"} transition-colors cursor-pointer`}
                onClick={() => !isYearly || toggleBilling()}
              >
                월간 결제
              </span>
              <button
                className="w-[52px] h-7 rounded-full border-none cursor-pointer relative flex-shrink-0 transition-[background] duration-[250ms]"
                style={{ background: isYearly ? "#0991B2" : "#E5E7EB" }}
                onClick={toggleBilling}
                aria-label="결제 주기 전환"
              >
                <div
                  className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,.15)] transition-transform duration-300"
                  style={{
                    transform: isYearly ? "translateX(27px)" : "translateX(3px)",
                    transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)",
                  }}
                />
              </button>
              <span
                className={`text-sm font-${isYearly ? "bold text-[#0A0A0A]" : "semibold text-[#9CA3AF]"} transition-colors cursor-pointer`}
                onClick={() => isYearly || toggleBilling()}
              >
                연간 결제
                <span className="inline-flex items-center gap-[3px] text-[11px] font-extrabold text-white bg-[#059669] px-2 py-[2px] rounded-full ml-[6px]">
                  20% 절약
                </span>
              </span>
            </div>
          </div>

          {!loading && status && (
            <div className="flex items-center gap-[10px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-5 py-3 max-w-[600px] mx-auto mb-11 shadow-[var(--sc)] animate-[subFadeUp_.45s_ease_.08s_both]">
              <div className="w-[9px] h-[9px] rounded-full bg-[#059669] shadow-[0_0_0_3px_rgba(5,150,105,.15)] flex-shrink-0 animate-[subBreathe_2.5s_ease-in-out_infinite]" />
              <span className="text-sm font-semibold text-[#0A0A0A]">
                현재 <span className="text-[#0991B2] font-bold">{status.planType === "pro" ? "Pro" : "Free"} 플랜</span>을 이용 중입니다
              </span>
              {!isPro && (
                <button
                  className="ml-auto text-xs font-bold text-[#0991B2] bg-[#E6F7FA] px-3 py-[5px] rounded-lg border-none cursor-pointer transition-[background] whitespace-nowrap hover:bg-[rgba(9,145,178,.18)]"
                  onClick={scrollToPro}
                >
                  Pro 업그레이드 →
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-4 mb-12">
              <div className="grid grid-cols-2 gap-5 max-w-container-md mx-auto w-full">
                <div className="h-[500px] rounded-lg skeleton-shimmer" />
                <div className="h-[500px] rounded-lg skeleton-shimmer" />
              </div>
            </div>
          ) : (
            <>
              <PlanCards
                ref={proCardRef}
                isPro={isPro}
                proCtaText={proCtaText}
                policy={{
                  maxActiveResumes: policy?.limits.maxActiveResumes ?? DEFAULT_FREE_POLICY.limits.maxActiveResumes,
                  maxActiveJobDescriptions: policy?.limits.maxActiveJobDescriptions ?? DEFAULT_FREE_POLICY.limits.maxActiveJobDescriptions,
                  fullProcessInterview: policy?.features.fullProcessInterview ?? DEFAULT_FREE_POLICY.features.fullProcessInterview,
                  realModeInterview: policy?.features.realModeInterview ?? DEFAULT_FREE_POLICY.features.realModeInterview,
                  eyeTrackingAnalysis: policy?.features.eyeTrackingAnalysis ?? DEFAULT_FREE_POLICY.features.eyeTrackingAnalysis,
                  reportRecordingPlayback: policy?.features.reportRecordingPlayback ?? DEFAULT_FREE_POLICY.features.reportRecordingPlayback,
                  interviewSessionHistoryDays: policy?.limits.interviewSessionHistoryDays ?? DEFAULT_FREE_POLICY.limits.interviewSessionHistoryDays,
                }}
                processing={processing}
                expiresAt={status?.expiresAt ?? null}
                onCheckout={checkout}
                onCancel={cancelSubscription}
              />
              <FeatureComparison />
              <PaymentMethods />
              <TrustRow />
              <FaqAccordion openFaqIndex={openFaqIndex} onToggleFaq={toggleFaq} />
            </>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 bg-[#0A0A0A] text-white rounded-[10px] px-5 py-3 text-[13px] font-semibold shadow-[0_4px_20px_rgba(0,0,0,.2)] animate-[subFadeUp_.3s_ease] whitespace-nowrap">
          ✓ {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 bg-[#EF4444] text-white rounded-[10px] px-5 py-3 text-[13px] font-semibold shadow-[0_4px_20px_rgba(0,0,0,.2)] animate-[subFadeUp_.3s_ease] whitespace-nowrap">
          ✕ {error}
        </div>
      )}
    </>
  );
}
