import { useState } from "react";
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
        <p className="text-[11px] font-semibold tracking-[.08em] uppercase text-[#9CA3AF] mb-0.5">질문별 상세 피드백</p>
        <p className="text-[13px] text-[#9CA3AF]">총 {feedbacks.length}개 질문</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {feedbacks.map((qf, i) => (
          <button
            key={qf.turnId ?? i}
            onClick={() => setActiveTab(i)}
            className={`flex items-center gap-1.5 px-4 py-2.5 shrink-0 text-[12px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === i
                ? "text-[#0991B2] border-[#0991B2] font-semibold"
                : "text-[#9CA3AF] border-transparent hover:text-[#374151]"
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
          {/* Question & Answer */}
          <div className="space-y-2">
            <div className="bg-[#F9FAFB] rounded-xl p-3">
              <p className="text-[12px] font-semibold text-[#9CA3AF] mb-1">Q.</p>
              <p className="text-[13px] text-[#374151]">{activeFeedback.question}</p>
            </div>
            {turnAnswerMap[activeFeedback.turnId] && (
              <div className="bg-[#E6F7FA]/50 rounded-xl p-3 border border-[rgba(9,145,178,0.15)]">
                <p className="text-[12px] font-semibold text-[#06B6D4] mb-1">A.</p>
                <p className="text-[13px] text-[#374151]">{turnAnswerMap[activeFeedback.turnId]}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <InteractiveTimeline
            recordingId={recording?.recordingId}
            mediaType={recording?.mediaType}
            speechData={behaviorAnalysis?.speechData ?? null}
            speechSegments={speechSegments}
          />

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
            <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100/50">
              <p className="text-[12px] font-semibold text-amber-600 mb-1.5">개선할 점</p>
              <ul className="space-y-1">
                {activeFeedback.improvements.map((s, j) => (
                  <li key={j} className="text-[12px] text-[#374151] flex items-start gap-1.5">
                    <span className="text-amber-400 shrink-0 mt-0.5">·</span>{s}
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
        </div>
      )}
    </div>
  );
}
