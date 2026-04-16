import { Square } from "lucide-react";
import type { InterviewSession } from "@/features/interview-session";

interface SessionHeaderProps {
  interviewSession: InterviewSession | null;
  currentInterviewTurnIndex: number;
  hasStarted: boolean;
  isFinished: boolean;
  difficultyLabel: string;
  practiceModeLabel: string;
  onFinish: () => void;
}

export function SessionHeader({
  interviewSession, currentInterviewTurnIndex,
  hasStarted, isFinished, difficultyLabel, practiceModeLabel, onFinish,
}: SessionHeaderProps) {
  return (
    <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-[#0d1826]/80 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        <span className="text-sm font-bold text-slate-300">
          {interviewSession?.interviewSessionType === "followup" ? "꼬리질문형" : "전체 프로세스"} 면접
        </span>
        <span className="text-[11px] text-slate-500 border border-slate-700 rounded-full px-2 py-px">{difficultyLabel}</span>
        <span className="text-[11px] text-indigo-400 border border-indigo-800 rounded-full px-2 py-px">{practiceModeLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        {interviewSession && hasStarted && (
          <span className="text-[11px] font-mono text-slate-500">
            {currentInterviewTurnIndex + 1} / {interviewSession.estimatedTotalQuestions || "?"}
          </span>
        )}
        <button
          onClick={onFinish}
          disabled={isFinished || !hasStarted}
          className="flex items-center gap-1.5 text-xs font-bold text-red-400 border border-red-400/30 bg-red-400/10 rounded-lg px-3 py-1.5 hover:bg-red-400/20 transition-colors disabled:opacity-40"
        >
          <Square size={12} /> 면접 종료
        </button>
      </div>
    </header>
  );
}
