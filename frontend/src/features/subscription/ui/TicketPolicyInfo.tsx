import { useEffect, useState } from "react";
import { fetchTicketPolicyApi } from "@/shared/api";
import type { TicketPolicy } from "@/shared/api";

interface TicketPolicyInfoProps {
  currentPlan: "free" | "pro";
}

export function TicketPolicyInfo({ currentPlan }: TicketPolicyInfoProps) {
  const [policy, setPolicy] = useState<TicketPolicy | null>(null);

  useEffect(() => {
    fetchTicketPolicyApi().then((res) => {
      if (res.success && res.data) setPolicy(res.data);
    });
  }, []);

  const dailyAmount = currentPlan === "pro"
    ? policy?.proDailyTicketAmount
    : policy?.freeDailyTicketAmount;

  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5 mb-8">
      <h3 className="text-base font-bold text-[#0A0A0A] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#0991B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        티켓 정책 안내
      </h3>

      {policy ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">일일 무료 티켓</span>
              <span className="font-semibold text-[#0A0A0A]">{policy.freeDailyTicketAmount}개</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Pro 일일 티켓</span>
              <span className="font-semibold text-[#0A0A0A]">{policy.proDailyTicketAmount}개</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">현재 일일 티켓</span>
              <span className="font-semibold text-[#0991B2]">{dailyAmount}개</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">꼬리질문 비용</span>
              <span className="font-semibold text-[#0A0A0A]">{policy.ticketCostFollowupInterview}개</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">전체 프로세스 비용</span>
              <span className="font-semibold text-[#0A0A0A]">{policy.ticketCostFullProcessInterview}개</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">리포트 생성 비용</span>
              <span className="font-semibold text-[#0A0A0A]">{policy.ticketCostAnalysisReport}개</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-16 flex items-center justify-center text-sm text-[#9CA3AF]">
          티켓 정책 불러오는 중...
        </div>
      )}

      {policy && policy.ticketRewardPerInterviewOrder.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
          <p className="text-xs text-[#6B7280] mb-2 font-semibold">면접 보상 (일일 최대 {policy.maxRewardedInterviewsPerDay}회)</p>
          <div className="flex flex-wrap gap-2">
            {policy.ticketRewardPerInterviewOrder.map((r) => (
              <span key={r.interviewOrder} className="text-xs bg-white border border-[#E5E7EB] rounded-full px-3 py-1">
                {r.interviewOrder}회차: <strong className="text-[#059669]">+{r.ticketReward}개</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
