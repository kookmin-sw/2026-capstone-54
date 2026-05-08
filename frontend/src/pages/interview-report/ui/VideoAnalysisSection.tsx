import { Eye, Smile } from "lucide-react";

interface ExpressionDistribution {
  happy: number;
  neutral: number;
  negative: number;
}

interface VideoAnalysisSummary {
  total_expression_distribution: ExpressionDistribution;
  negative_expression_ratio: number;
}

interface VideoAnalysisProps {
  summary?: VideoAnalysisSummary | null;
}

/**
 * 영상 분석 종합 섹션
 * summary가 없으면 placeholder UI를 표시합니다.
 */
export function VideoAnalysisSection({ summary }: VideoAnalysisProps) {
  const hasData = summary && summary.total_expression_distribution;

  const happy = hasData ? Math.round(summary.total_expression_distribution.happy * 100) : 0;
  const neutral = hasData ? Math.round(summary.total_expression_distribution.neutral * 100) : 0;
  const negative = hasData ? Math.round(summary.total_expression_distribution.negative * 100) : 0;

  return (
    <div className="report-card p-5">
      <p className="text-[11px] font-semibold tracking-[.08em] uppercase text-[#9CA3AF] mb-4">영상 분석 종합</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 표정 분포 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-start">
          <div className="flex items-center gap-2 w-full mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Smile size={16} className="text-emerald-500" />
            </div>
            <p className="text-[13px] font-semibold text-[#374151]">표정 분포</p>
            <span className={`ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              hasData ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F3F4F6] text-[#9CA3AF]"
            }`}>
              {hasData ? (happy + neutral >= 80 ? "우수" : happy + neutral >= 60 ? "양호" : "보통") : "—"}
            </span>
          </div>

          {hasData ? (
            <>
              <p className="text-[14px] font-bold text-[#1F2937] mb-1">
                {happy >= 30 ? "밝고 호감 있는 인상을 주었어요" : happy >= 15 ? "차분하고 안정적인 인상이에요" : "표정 변화가 적었어요"}
              </p>
              <p className="text-[12px] text-[#6B7280] leading-relaxed mb-3">
                긍정 표정 비율이 {happy}%로 {happy >= 30 ? "신뢰감과 친근함을 동시에 전달했습니다." : "안정적인 인상을 주었습니다."}
              </p>

              {/* Proportion bar */}
              <div className="w-full mb-3">
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div className="bg-[#0991B2]" style={{ width: `${happy}%` }} />
                  <div className="bg-[#06B6D4]/40" style={{ width: `${neutral}%` }} />
                  <div className="bg-[#E5E7EB]" style={{ width: `${negative}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#0991B2]" />
                    <span className="text-[11px] text-[#6B7280]">긍정</span>
                    <span className="text-[11px] font-bold text-[#374151] ml-1">{happy}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#06B6D4]/40" />
                    <span className="text-[11px] text-[#6B7280]">무표정</span>
                    <span className="text-[11px] font-bold text-[#374151] ml-1">{neutral}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#E5E7EB]" />
                    <span className="text-[11px] text-[#6B7280]">부정</span>
                    <span className="text-[11px] font-bold text-[#374151] ml-1">{negative}%</span>
                  </div>
                </div>
              </div>

              {/* Status items */}
              <div className="w-full space-y-1.5">
                <div className="flex items-center gap-3 rounded-xl px-3 py-2 bg-[#E6F7FA] border border-[rgba(9,145,178,0.15)]">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] shrink-0">긍정</span>
                  <p className="flex-1 text-[12px] text-[#0E7490]">미소를 유지해 호감 있는 인상을 주었습니다.</p>
                  <span className="text-[11px] text-[#6B7280] tabular-nums shrink-0">{happy}%</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white border border-gray-100">
                  <span className="text-[11px] font-semibold text-[#6B7280] px-2.5 py-0.5 rounded-full border border-gray-200 shrink-0">무표정</span>
                  <p className="flex-1 text-[12px] text-[#6B7280]">차분하고 진지한 인상으로 신뢰감을 주었습니다.</p>
                  <span className="text-[11px] text-[#6B7280] tabular-nums shrink-0">{neutral}%</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white border border-gray-100">
                  <span className="text-[11px] font-semibold text-amber-600 px-2.5 py-0.5 rounded-full border border-amber-100 bg-amber-50 shrink-0">부정</span>
                  <p className="flex-1 text-[12px] text-[#6B7280]">긴장한 순간이 일부 있었으나 전반적으로 양호합니다.</p>
                  <span className="text-[11px] text-[#6B7280] tabular-nums shrink-0">{negative}%</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8 w-full">
              <p className="text-[12px] text-[#9CA3AF]">영상 분석 데이터가 준비되면 표정 분포가 표시됩니다.</p>
            </div>
          )}
        </div>

        {/* 시선 처리 (현재 데이터 없음 — placeholder) */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-start">
          <div className="flex items-center gap-2 w-full mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#E6F7FA] flex items-center justify-center shrink-0">
              <Eye size={16} className="text-[#0991B2]" />
            </div>
            <p className="text-[13px] font-semibold text-[#374151]">시선 처리</p>
            <span className="ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF]">—</span>
          </div>
          <p className="text-[14px] font-bold text-[#1F2937] mb-1">시선 분석 준비 중</p>
          <p className="text-[12px] text-[#9CA3AF] leading-relaxed mb-3">
            시선 추적 기능이 추가되면 질문별 시선 이탈 횟수와 안정도가 표시됩니다.
          </p>
          <div className="w-full space-y-1.5">
            {[1, 2, 3].map((q) => (
              <div key={q} className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white border border-gray-100">
                <span className="text-[12px] font-semibold text-[#D1D5DB] w-5 shrink-0">Q{q}</span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#D1D5DB] shrink-0">—</span>
                <p className="flex-1 text-[12px] text-[#D1D5DB]">데이터 준비 중</p>
                <span className="text-[11px] text-[#D1D5DB] tabular-nums shrink-0">—회</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
