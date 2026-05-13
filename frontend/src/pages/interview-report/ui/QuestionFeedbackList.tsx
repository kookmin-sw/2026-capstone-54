import { useState } from "react";
import { Mic, AlertTriangle, VolumeX, Eye } from "lucide-react";
import type { InterviewQuestionFeedback, RecordingItem, BehaviorAnalysis, InterviewTurn } from "@/features/interview-session";
import { InteractiveTimeline } from "./InteractiveTimeline";

interface QuestionFeedbackListProps {
  feedbacks: InterviewQuestionFeedback[];
  turnAnswerMap: Record<number, string>;
  recordings?: RecordingItem[];
  behaviorAnalyses?: BehaviorAnalysis[];
  interviewTurns?: InterviewTurn[];
}

export function QuestionFeedbackList({
  feedbacks,
  turnAnswerMap,
  recordings = [],
  behaviorAnalyses = [],
  interviewTurns = [],
}: QuestionFeedbackListProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (feedbacks.length === 0) return null;

  const recordingsByTurnId = Object.fromEntries(recordings.map((r) => [r.turnId, r]));
  const behaviorByTurnId = Object.fromEntries(behaviorAnalyses.map((ba) => [ba.interviewTurn, ba]));
  const segmentsByTurnId = Object.fromEntries(interviewTurns.map((t) => [t.id, t.speechSegments || []]));

  const activeFeedback = feedbacks[activeTab];
  const recording = activeFeedback ? recordingsByTurnId[activeFeedback.turnId] : undefined;
  const behaviorAnalysis = activeFeedback ? behaviorByTurnId[activeFeedback.turnId] : undefined;
  const speechSegments = activeFeedback ? (segmentsByTurnId[activeFeedback.turnId] || []) : [];

  return (
    <div className="report-card overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <p className="text-[15px] font-bold text-[#374151] mb-0.5">질문별 상세 피드백</p>
        <p className="text-[13px] text-[#9CA3AF]">총 {feedbacks.length}개 질문</p>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto overflow-y-hidden scrollbar-thin">
        {feedbacks.map((qf, i) => (
          <button
            key={qf.turnId ?? i}
            onClick={() => setActiveTab(i)}
            className={`flex items-center gap-1.5 px-4 py-4 shrink-0 text-[12px] font-medium transition-colors whitespace-nowrap ${
              activeTab === i
                ? "text-[#0991B2] font-semibold"
                : "text-[#9CA3AF] hover:text-[#374151]"
            }`}
          >
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold shrink-0 ${
              activeTab === i
                ? "bg-[#E6F7FA] text-[#0991B2]"
                : "bg-[#F3F4F6] text-[#9CA3AF]"
            }`}>
              {i + 1}
            </span>
            <span className="hidden sm:inline">{qf.question.length > 8 ? qf.question.slice(0, 8) + "…" : qf.question}</span>
          </button>
        ))}
      </div>

      {/* Active panel */}
      {activeFeedback && (
        <div className="p-5 space-y-4">
          {/* 영상 + Q&A 가로 배치 */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 영상 (좌측) */}
            <div className="sm:w-1/2 shrink-0">
              <InteractiveTimeline
                recordingId={recording?.recordingId}
                mediaType={recording?.mediaType}
                speechData={behaviorAnalysis?.speechData ?? null}
                speechSegments={speechSegments}
              />
            </div>

            {/* Q&A (우측) */}
            <div className="flex-1 space-y-2">


              <div className="bg-[#F9FAFB] rounded-xl p-3">
                <p className="text-[20px] font-bold text-[#0891B2] mb-1 italic" style={{ fontFamily: "'Inter Tight', sans-serif" }}>Q.</p>
                <p className="text-[13px] text-[#374151]">{activeFeedback.question}</p>
              </div>
              {turnAnswerMap[activeFeedback.turnId] && (
                <div className="bg-[#F9FAFB] rounded-xl p-3">
                  <p className="text-[20px] font-bold text-[#0891B2] mb-1 italic" style={{ fontFamily: "'Inter Tight', sans-serif" }}>A.</p>
                  <p className="text-[13px] text-[#374151]">{turnAnswerMap[activeFeedback.turnId]}</p>
                </div>
              )}
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100/50">
              <p className="text-[12px] font-semibold text-emerald-600 mb-1.5">잘한 점</p>
              <ul className="space-y-1">
                {activeFeedback.strengths.map((s, j) => (
                  <li key={j} className="text-[12px] text-[#374151] flex items-start gap-1.5">
                    <span className="text-emerald-400 shrink-0 mt-0.5">·</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#FDF6E3]/60 rounded-xl p-3 border border-[#E9B63B]/20">
              <p className="text-[12px] font-semibold text-[#E9B63B] mb-1.5">개선할 점</p>
              <ul className="space-y-1">
                {activeFeedback.improvements.map((s, j) => (
                  <li key={j} className="text-[12px] text-[#374151] flex items-start gap-1.5">
                    <span className="text-[#E9B63B] shrink-0 mt-0.5">·</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Model Answer */}
          {activeFeedback.modelAnswer && (
            <div>
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1.5">모범 답변</p>
              <div className="bg-[#F9FAFB] rounded-xl p-3 border-l-2 border-[#06B6D4]">
                <p className="text-[12px] text-[#4B5563] leading-relaxed">{activeFeedback.modelAnswer}</p>
              </div>
            </div>
          )}

          {/* 4개 지표 카드 (음성 + 영상) */}
          <TurnMetricCards feedback={activeFeedback} />
        </div>
      )}
    </div>
  );
}

function TurnMetricCards({ feedback }: { feedback: InterviewQuestionFeedback }) {
  const spm = feedback.speechRateSpm ?? 0;
  const fillerCount = feedback.fillerWordCount ?? 0;
  const fillerRatio = feedback.fillerWordRatio ?? 0;
  const silenceRatio = feedback.silenceRatio ?? 0;
  const gazeCount = feedback.gazeDeviationCount ?? 0;

  const hasAnyData = spm > 0 || fillerCount > 0 || silenceRatio > 0 || gazeCount > 0;
  if (!hasAnyData) return null;

  // 배지 로직
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {/* 말하기 속도 */}
      <div className="bg-[#F9FAFB] rounded-xl p-3 flex flex-col items-center text-center">
        <Mic size={14} className="text-emerald-500 mb-1.5" />
        <p className="text-[11px] text-[#6B7280] mb-1">말하기 속도</p>
        <p className="text-[13px] font-bold text-[#374151] tabular-nums">{spm > 0 ? `${spm} SPM` : "—"}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${spmBadge.cls}`}>{spmBadge.label}</span>
      </div>

      {/* 필러워드 */}
      <div className="bg-[#F9FAFB] rounded-xl p-3 flex flex-col items-center text-center">
        <AlertTriangle size={14} className="text-[#E9B63B] mb-1.5" />
        <p className="text-[11px] text-[#6B7280] mb-1">필러워드</p>
        <p className="text-[13px] font-bold text-[#374151] tabular-nums">
          {fillerCount}회 · {(fillerRatio * 100).toFixed(1)}%
        </p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${fillerBadge.cls}`}>{fillerBadge.label}</span>
      </div>

      {/* 묵음 비율 */}
      <div className="bg-[#F9FAFB] rounded-xl p-3 flex flex-col items-center text-center">
        <VolumeX size={14} className="text-emerald-500 mb-1.5" />
        <p className="text-[11px] text-[#6B7280] mb-1">묵음 비율</p>
        <p className="text-[13px] font-bold text-[#374151] tabular-nums">{(silenceRatio * 100).toFixed(0)}%</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${silenceBadge.cls}`}>{silenceBadge.label}</span>
      </div>

      {/* 시선 이탈 */}
      <div className="bg-[#F9FAFB] rounded-xl p-3 flex flex-col items-center text-center">
        <Eye size={14} className="text-[#0991B2] mb-1.5" />
        <p className="text-[11px] text-[#6B7280] mb-1">시선 이탈</p>
        <p className="text-[13px] font-bold text-[#374151] tabular-nums">{gazeCount}회</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${gazeBadge.cls}`}>{gazeBadge.label}</span>
      </div>
    </div>
  );
}
