import { Eye, Smile } from "lucide-react";
import type { VideoAnalysisResult } from "@/features/interview-session/api/types";
import type { InterviewQuestionFeedback } from "@/features/interview-session/api/types";

interface VideoAnalysisProps {
  summary?: VideoAnalysisResult | null;
  questionFeedbacks?: InterviewQuestionFeedback[];
}

function getGazeOverallBadge(ratio: number) {
  if (ratio < 0.15) return { label: "전체 안정", cls: "bg-[#DCFCE7] text-[#15803D]" };
  if (ratio < 0.30) return { label: "보통", cls: "bg-amber-50 text-amber-600" };
  return { label: "주의 필요", cls: "bg-red-50 text-red-600" };
}

function getGazeTurnBadge(count: number) {
  if (count < 5) return { label: "안정", cls: "bg-[#DCFCE7] text-[#15803D]" };
  if (count < 12) return { label: "불안정", cls: "bg-amber-50 text-amber-600" };
  return { label: "주의", cls: "bg-red-50 text-red-600" };
}

function getGazeTurnComment(count: number) {
  if (count < 5) return "카메라 응시가 자연스러웠습니다.";
  if (count < 12) return "전반적으로 시선 유지가 잘 되었습니다.";
  return "긴장으로 인해 시선 이탈이 집중되었습니다.";
}

export function VideoAnalysisSection({ summary, questionFeedbacks = [] }: VideoAnalysisProps) {
  const hasExprData = summary && summary.totalExpressionDistribution;
  const hasGazeData = summary && typeof summary.avgGazeDeviationRatio === "number";

  const happy = hasExprData ? Math.round(summary.totalExpressionDistribution.happy * 100) : 0;
  const neutral = hasExprData ? Math.round(summary.totalExpressionDistribution.neutral * 100) : 0;
  const negative = hasExprData ? Math.round(summary.totalExpressionDistribution.negative * 100) : 0;

  const gazeRatio = summary?.avgGazeDeviationRatio ?? 0;
  const gazeBadge = getGazeOverallBadge(gazeRatio);
  const gazeStablePct = Math.round((1 - gazeRatio) * 100);

  // 질문별 시선 이탈 데이터 (question_feedbacks에서 추출)
  const turnGazeData = questionFeedbacks
    .filter((fb) => typeof fb.gazeDeviationCount === "number")
    .map((fb, i) => ({
      turnNumber: i + 1,
      count: fb.gazeDeviationCount ?? 0,
    }));

  const totalGazeCount = turnGazeData.reduce((sum, t) => sum + t.count, 0);

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
              hasExprData ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F3F4F6] text-[#9CA3AF]"
            }`}>
              {hasExprData ? (happy + neutral >= 80 ? "우수" : happy + neutral >= 60 ? "양호" : "보통") : "—"}
            </span>
          </div>

          {hasExprData ? (
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

        {/* 시선 처리 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-start">
          <div className="flex items-center gap-2 w-full mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#E6F7FA] flex items-center justify-center shrink-0">
              <Eye size={16} className="text-[#0991B2]" />
            </div>
            <p className="text-[13px] font-semibold text-[#374151]">시선 처리</p>
            <span className={`ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              hasGazeData ? gazeBadge.cls : "bg-[#F3F4F6] text-[#9CA3AF]"
            }`}>
              {hasGazeData ? gazeBadge.label : "—"}
            </span>
          </div>

          {hasGazeData && turnGazeData.length > 0 ? (
            <>
              <p className="text-[14px] font-bold text-[#1F2937] mb-1">
                {gazeRatio < 0.15
                  ? "대부분 카메라를 잘 응시했어요"
                  : gazeRatio < 0.30
                  ? "시선이 가끔 이탈되었어요"
                  : "시선 이탈이 잦았어요"}
              </p>
              <p className="text-[12px] text-[#6B7280] leading-relaxed mb-3">
                시선이 정면을 유지한 비율이 {gazeStablePct}%입니다.
                총 이탈 {totalGazeCount}회
              </p>

              <div className="w-full space-y-1.5">
                {turnGazeData.map((turn) => {
                  const turnBadge = getGazeTurnBadge(turn.count);
                  const comment = getGazeTurnComment(turn.count);
                  return (
                    <div
                      key={turn.turnNumber}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 border ${
                        turn.count >= 12
                          ? "bg-red-50/50 border-red-100"
                          : "bg-white border-gray-100"
                      }`}
                    >
                      <span className="text-[12px] font-semibold text-[#6B7280] w-6 shrink-0">Q{turn.turnNumber}</span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${turnBadge.cls}`}>
                        {turnBadge.label}
                      </span>
                      <p className="flex-1 text-[12px] text-[#6B7280] truncate">{comment}</p>
                      <span className={`text-[11px] tabular-nums shrink-0 ${
                        turn.count >= 12 ? "text-red-600 font-semibold" : "text-[#6B7280]"
                      }`}>
                        {turn.count}회
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-[14px] font-bold text-[#1F2937] mb-1">시선 분석 준비 중</p>
              <p className="text-[12px] text-[#9CA3AF] leading-relaxed mb-3">
                시선 추적 데이터가 준비되면 질문별 시선 이탈 횟수와 안정도가 표시됩니다.
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
