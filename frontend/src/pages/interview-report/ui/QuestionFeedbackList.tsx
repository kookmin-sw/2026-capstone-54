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
            {/* 메타 배지 */}
            <div className="flex flex-wrap gap-1.5 mb-1">
              {activeFeedback.turnType && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E6F7FA] text-[#0991B2]">
                  {activeFeedback.turnType === "initial" ? "초기질문" : "꼬리질문"}
                </span>
              )}
              {activeFeedback.questionSource && activeFeedback.questionSource !== "" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280]">
                  {activeFeedback.questionSource === "job_posting" ? "채용공고 기반" : activeFeedback.questionSource === "resume" ? "이력서 기반" : activeFeedback.questionSource}
                </span>
              )}
              {(() => {
                const fr = activeFeedback.fillerWordRatio ?? 0;
                const gr = activeFeedback.gazeDeviationRatio ?? 0;
                let stabilityLabel = "긴장";
                let stabilityCls = "bg-red-50 text-red-600";
                if (fr < 0.05 && gr < 0.15) { stabilityLabel = "안정"; stabilityCls = "bg-[#DCFCE7] text-[#15803D]"; }
                else if (fr < 0.10 && gr < 0.30) { stabilityLabel = "보통"; stabilityCls = "bg-amber-50 text-amber-600"; }
                return (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stabilityCls}`}>
                    {stabilityLabel}
                  </span>
                );
              })()}
            </div>

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
    ? { label: "빠름", cls: "bg-amber-50 text-amber-600" }
    : { label: "느림", cls: "bg-amber-50 text-amber-600" };

  const fillerBadge = fillerRatio < 0.05
    ? { label: "양호", cls: "bg-[#DCFCE7] text-[#15803D]" }
    : fillerRatio < 0.10
    ? { label: "보통", cls: "bg-amber-50 text-amber-600" }
    : { label: "개선 필요", cls: "bg-red-50 text-red-600" };

  const silenceBadge = silenceRatio < 0.20
    ? { label: "적절", cls: "bg-[#DCFCE7] text-[#15803D]" }
    : silenceRatio < 0.30
    ? { label: "조금 많음", cls: "bg-amber-50 text-amber-600" }
    : { label: "너무 깁니다", cls: "bg-red-50 text-red-600" };

  const gazeBadge = gazeCount < 5
    ? { label: "안정", cls: "bg-[#DCFCE7] text-[#15803D]" }
    : gazeCount < 12
    ? { label: "불안정", cls: "bg-amber-50 text-amber-600" }
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
        <AlertTriangle size={14} className="text-amber-500 mb-1.5" />
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
