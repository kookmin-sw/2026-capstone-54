/**
 * PDF 저장 전용 — 모든 질문 피드백을 순차 렌더링.
 *
 * 화면용 QuestionFeedbackList 는 탭 carousel 이라 active 1개만 보이지만,
 * 인쇄 시에는 모든 질문이 차례로 펼쳐져야 한다.
 * `@media print` 에서만 표시되며, 각 질문 카드 사이에는 페이지 break 가 적용된다.
 *
 * 영상/오디오 플레이어 (InteractiveTimeline) 는 PDF 에서 재생 불가하므로 제외한다.
 */

import { Mic, AlertTriangle, VolumeX, Eye } from "lucide-react";
import type { InterviewQuestionFeedback } from "@/features/interview-session";

interface Props {
  feedbacks: InterviewQuestionFeedback[];
  turnAnswerMap: Record<number, string>;
}

export function PrintQuestionFeedbacks({ feedbacks, turnAnswerMap }: Props) {
  if (feedbacks.length === 0) return null;

  return (
    <div id="print-feedbacks">
      <div className="report-card p-7 mb-3 print-feedbacks-header">
        <p className="text-[15px] font-bold text-[#374151] mb-1">질문별 상세 피드백</p>
        <p className="text-[13px] text-[#9CA3AF]">총 {feedbacks.length}개 질문</p>
      </div>
      {feedbacks.map((qf, i) => (
        <PrintQuestionCard
          key={qf.turnId ?? i}
          index={i + 1}
          feedback={qf}
          answer={turnAnswerMap[qf.turnId]}
        />
      ))}
    </div>
  );
}

interface CardProps {
  index: number;
  feedback: InterviewQuestionFeedback;
  answer?: string;
}

function PrintQuestionCard({ index, feedback, answer }: CardProps) {
  return (
    <div className="report-card p-7 mb-3 print-question-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#E6F7FA] text-[#0991B2] text-[13px] font-bold">
          {index}
        </span>
        <p className="text-[14px] font-bold text-[#374151]">질문 {index}</p>
      </div>

      <div className="space-y-2 mb-4">
        <div className="bg-[#F9FAFB] rounded-xl p-3">
          <p className="text-[18px] font-bold text-[#0891B2] mb-1 italic" style={{ fontFamily: "'Inter Tight', sans-serif" }}>Q.</p>
          <p className="text-[13px] text-[#374151] leading-relaxed">{feedback.question}</p>
        </div>
        {answer && (
          <div className="bg-[#F9FAFB] rounded-xl p-3">
            <p className="text-[18px] font-bold text-[#0891B2] mb-1 italic" style={{ fontFamily: "'Inter Tight', sans-serif" }}>A.</p>
            <p className="text-[13px] text-[#374151] leading-relaxed whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100/50">
          <p className="text-[12px] font-semibold text-emerald-600 mb-1.5">잘한 점</p>
          <ul className="space-y-1">
            {feedback.strengths.map((s, j) => (
              <li key={j} className="text-[12px] text-[#374151] flex items-start gap-1.5">
                <span className="text-emerald-400 shrink-0 mt-0.5">·</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[#FDF6E3]/60 rounded-xl p-3 border border-[#E9B63B]/20">
          <p className="text-[12px] font-semibold text-[#E9B63B] mb-1.5">개선할 점</p>
          <ul className="space-y-1">
            {feedback.improvements.map((s, j) => (
              <li key={j} className="text-[12px] text-[#374151] flex items-start gap-1.5">
                <span className="text-[#E9B63B] shrink-0 mt-0.5">·</span>{s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {feedback.modelAnswer && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1.5">모범 답변</p>
          <div className="bg-[#F9FAFB] rounded-xl p-3 border-l-2 border-[#06B6D4]">
            <p className="text-[12px] text-[#4B5563] leading-relaxed whitespace-pre-wrap">{feedback.modelAnswer}</p>
          </div>
        </div>
      )}

      <PrintTurnMetricCards feedback={feedback} />
    </div>
  );
}

function PrintTurnMetricCards({ feedback }: { feedback: InterviewQuestionFeedback }) {
  const spm = feedback.speechRateSpm ?? 0;
  const fillerCount = feedback.fillerWordCount ?? 0;
  const fillerRatio = feedback.fillerWordRatio ?? 0;
  const silenceRatio = feedback.silenceRatio ?? 0;
  const gazeCount = feedback.gazeDeviationCount ?? 0;

  const hasAnyData = spm > 0 || fillerCount > 0 || silenceRatio > 0 || gazeCount > 0;
  if (!hasAnyData) return null;

  const spmBadge = spm === 0
    ? { label: "—", cls: "bg-[#F3F4F6] text-[#9CA3AF]" }
    : spm >= 260 && spm <= 350
    ? { label: "적절", cls: "bg-[#DCFCE7] text-[#15803D]" }
    : spm > 350
    ? { label: "빠름", cls: "bg-[#FDF6E3] text-[#E9B63B]" }
    : { label: "느림", cls: "bg-[#FDF6E3] text-[#E9B63B]" };

  const fillerBadge = fillerRatio < 0.05
    ? { label: "양호", cls: "bg-[#DCFCE7] text-[#15803D]" }
    : fillerRatio < 0.10
    ? { label: "보통", cls: "bg-[#FDF6E3] text-[#E9B63B]" }
    : { label: "개선 필요", cls: "bg-red-50 text-red-600" };

  const silenceBadge = silenceRatio < 0.20
    ? { label: "적절", cls: "bg-[#DCFCE7] text-[#15803D]" }
    : silenceRatio < 0.30
    ? { label: "조금 많음", cls: "bg-[#FDF6E3] text-[#E9B63B]" }
    : { label: "너무 깁니다", cls: "bg-red-50 text-red-600" };

  const gazeBadge = gazeCount < 5
    ? { label: "안정", cls: "bg-[#DCFCE7] text-[#15803D]" }
    : gazeCount < 12
    ? { label: "불안정", cls: "bg-[#FDF6E3] text-[#E9B63B]" }
    : { label: "주의", cls: "bg-red-50 text-red-600" };

  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="bg-[#F9FAFB] rounded-xl p-3 flex flex-col items-center text-center">
        <Mic size={14} className="text-emerald-500 mb-1.5" />
        <p className="text-[11px] text-[#6B7280] mb-1">말하기 속도</p>
        <p className="text-[13px] font-bold text-[#374151] tabular-nums">{spm > 0 ? `${spm} SPM` : "—"}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${spmBadge.cls}`}>{spmBadge.label}</span>
      </div>
      <div className="bg-[#F9FAFB] rounded-xl p-3 flex flex-col items-center text-center">
        <AlertTriangle size={14} className="text-[#E9B63B] mb-1.5" />
        <p className="text-[11px] text-[#6B7280] mb-1">필러워드</p>
        <p className="text-[13px] font-bold text-[#374151] tabular-nums">
          {fillerCount}회 · {(fillerRatio * 100).toFixed(1)}%
        </p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${fillerBadge.cls}`}>{fillerBadge.label}</span>
      </div>
      <div className="bg-[#F9FAFB] rounded-xl p-3 flex flex-col items-center text-center">
        <VolumeX size={14} className="text-emerald-500 mb-1.5" />
        <p className="text-[11px] text-[#6B7280] mb-1">묵음 비율</p>
        <p className="text-[13px] font-bold text-[#374151] tabular-nums">{(silenceRatio * 100).toFixed(0)}%</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${silenceBadge.cls}`}>{silenceBadge.label}</span>
      </div>
      <div className="bg-[#F9FAFB] rounded-xl p-3 flex flex-col items-center text-center">
        <Eye size={14} className="text-[#0991B2] mb-1.5" />
        <p className="text-[11px] text-[#6B7280] mb-1">시선 이탈</p>
        <p className="text-[13px] font-bold text-[#374151] tabular-nums">{gazeCount}회</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${gazeBadge.cls}`}>{gazeBadge.label}</span>
      </div>
    </div>
  );
}
