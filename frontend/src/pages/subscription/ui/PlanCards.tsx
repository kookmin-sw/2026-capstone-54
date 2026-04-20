import { forwardRef } from "react";

interface PlanCardsProps {
  isPro: boolean;
  proCtaText: string;
  policy: {
    maxActiveResumes: number | null;
    maxActiveJobDescriptions: number | null;
    fullProcessInterview: boolean;
    realModeInterview: boolean;
    eyeTrackingAnalysis: boolean;
    reportRecordingPlayback: boolean;
    interviewSessionHistoryDays: number | null;
  };
  processing: boolean;
  expiresAt?: string | null;
  onCheckout: () => void;
  onCancel: () => void;
}

export const PlanCards = forwardRef<HTMLDivElement, PlanCardsProps>(
  (
    {
      isPro,
      proCtaText,
      policy,
      processing,
      expiresAt,
      onCheckout,
      onCancel,
    },
    ref
  ) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-container-md mx-auto mb-14 animate-[subFadeUp_.45s_ease_.12s_both]">
        {/* Free Card */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-7 sm:p-9 relative overflow-hidden transition-all duration-300 shadow-[var(--sc)] hover:shadow-[var(--sc-hover)] hover:-translate-y-1">
          <div className="flex items-center gap-2 mb-[18px]">
            <span className="text-xs font-bold tracking-[.7px] uppercase text-[#6B7280]">Free</span>
            {!isPro && (
              <span className="text-[10px] font-extrabold text-[#059669] bg-[rgba(5,150,105,.1)] px-2 py-[2px] rounded-full tracking-[.4px]">
                현재 플랜
              </span>
            )}
          </div>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-[56px] font-black tracking-[-3px] leading-none text-[#0A0A0A]">₩0</span>
          </div>
          <p className="text-xs text-[#9CA3AF] mb-7 min-h-[18px]">영구 무료 · 신용카드 불필요</p>
          <ul className="list-none flex flex-col gap-[10px] mb-7">
            {[
              [true, "꼬리질문 방식 면접"],
              [true, "기본 AI 리뷰 리포트"],
              [true, `이력서 최대 ${policy.maxActiveResumes ?? "무제한"}${policy.maxActiveResumes ? "개" : ""}`],
              [true, `채용공고 최대 ${policy.maxActiveJobDescriptions ?? "무제한"}${policy.maxActiveJobDescriptions ? "개" : ""}`],
              [true, "스트릭 적립 & 보상 수령"],
              [policy.fullProcessInterview, "전체 프로세스 방식 면접"],
              [policy.eyeTrackingAnalysis, "시선 추적 분석"],
              [policy.realModeInterview, "실전 모드"],
              [policy.reportRecordingPlayback, "분석 리포트 녹화 영상 확인"],
            ].map(([on, label], i) => (
              <li key={i} className={`flex items-start gap-[9px] text-[13px] text-[#374151] leading-[1.4] ${!on ? "opacity-35" : ""}`}>
                <span className={`w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-extrabold mt-[1px] ${on ? "bg-[#059669] text-white" : "bg-[#E5E7EB] text-[#9CA3AF]"}`}>
                  {on ? "✓" : "✕"}
                </span>
                {label as string}
              </li>
            ))}
          </ul>
          <button
            className="flex items-center justify-center w-full text-sm font-bold text-[#0991B2] bg-[#E6F7FA] border border-[rgba(9,145,178,.25)] rounded-[10px] py-[14px] cursor-pointer transition-all hover:bg-[rgba(9,145,178,.15)] disabled:opacity-55 disabled:cursor-not-allowed"
            disabled={!isPro}
            onClick={onCancel}
          >
            {isPro ? "Free로 다운그레이드" : "현재 이용 중"}
          </button>
          <p className="text-[11px] text-[#9CA3AF] mt-2 text-center min-h-[16px]">기본 기능 무료 제공</p>
        </div>

        {/* Pro Card */}
        <div
          ref={ref}
          className="bg-[#0A0A0A] text-white rounded-2xl p-7 sm:p-9 relative overflow-hidden transition-all duration-300 -translate-y-1 shadow-[0_8px_32px_rgba(0,0,0,.22),0_24px_56px_rgba(0,0,0,.14)] hover:-translate-y-2 hover:shadow-[0_12px_48px_rgba(0,0,0,.3),0_32px_72px_rgba(0,0,0,.18)]"
        >
          <div className="absolute w-[240px] h-[240px] bg-[rgba(9,145,178,.1)] blur-[70px] rounded-full -top-20 -right-14 pointer-events-none" />
          <div className="absolute w-[140px] h-[140px] bg-[rgba(6,182,212,.08)] blur-[50px] rounded-full -bottom-10 -left-[30px] pointer-events-none" />
          <div className="absolute top-0 right-8 bg-[#0991B2] text-white text-[10px] font-extrabold px-[14px] py-[5px] rounded-b-[10px] tracking-[.5px] uppercase">
            추천
          </div>
          <div className="flex items-center gap-2 mb-[18px]">
            <span className="text-xs font-bold tracking-[.7px] uppercase text-[rgba(255,255,255,.4)]">Pro</span>
            {isPro && (
              <span className="text-[10px] font-extrabold text-[#059669] bg-[rgba(5,150,105,.1)] px-2 py-[2px] rounded-full tracking-[.4px]">
                현재 플랜
              </span>
            )}
          </div>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-[56px] font-black tracking-[-3px] leading-none text-white">₩9,900</span>
            <span className="text-[15px] font-bold text-[rgba(255,255,255,.35)] pb-2">/월</span>
          </div>
          <p className="text-xs text-[rgba(255,255,255,.3)] mb-7 min-h-[18px]">월간 결제 · 언제든 취소 가능</p>
          <ul className="list-none flex flex-col gap-[10px] mb-7">
            {[
              "Free의 모든 기능 포함",
              "이력서·채용공고 무제한",
              "전체 프로세스 방식 면접",
              "시선 추적 분석",
              "실전 모드 (긴장감 업)",
              "분석 리포트 녹화 영상 확인",
              "침묵 감지 상세 분석",
              "면접 세션 전체 아카이브",
              "우선 고객 지원",
            ].map((label, i) => (
              <li key={i} className="flex items-start gap-[9px] text-[13px] text-[rgba(255,255,255,.8)] leading-[1.4]">
                <span className="w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-extrabold mt-[1px] bg-[#0991B2] text-white">
                  ✓
                </span>
                {label}
              </li>
            ))}
          </ul>
          <button
            className="flex items-center justify-center gap-1.5 w-full text-sm font-bold text-[#0A0A0A] bg-white border-none rounded-[10px] py-[14px] cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,.12)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,.18)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            onClick={isPro ? onCancel : onCheckout}
            disabled={processing}
          >
            {processing ? (
              <span className="w-[14px] h-[14px] border-2 border-[rgba(10,10,10,.25)] border-t-[#0A0A0A] rounded-full animate-[subSpin_.6s_linear_infinite]" />
            ) : isPro ? (
              "구독 취소"
            ) : (
              <>
                <span>{proCtaText}</span>
                <span>→</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-[rgba(255,255,255,.25)] mt-2 text-center min-h-[16px]">
            {isPro ? (expiresAt ? `만료 예정일: ${new Date(expiresAt).toLocaleDateString("ko-KR")}` : "현재 PRO 이용 중") : "PRO 기능 즉시 활성화"}
          </p>
        </div>
      </div>
    );
  }
);

PlanCards.displayName = "PlanCards";
