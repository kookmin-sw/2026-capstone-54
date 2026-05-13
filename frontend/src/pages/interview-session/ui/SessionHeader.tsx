import { Square } from "lucide-react";
import type { InterviewSession } from "@/features/interview-session";

interface SessionHeaderProps {
  className?: string;
  interviewSession: InterviewSession | null;
  currentInterviewTurnIndex: number;
  hasStarted: boolean;
  isFinished: boolean;
  difficultyLabel: string;
  practiceModeLabel: string;
  onFinish: () => void;
}

export function SessionHeader({
  className,
  interviewSession, currentInterviewTurnIndex,
  hasStarted, isFinished, difficultyLabel, practiceModeLabel, onFinish,
}: SessionHeaderProps) {
  return (
    <header className={`h-14 border-b border-[#0991B2]/20 flex items-center justify-between px-6 shrink-0 bg-[#060f16]/90 backdrop-blur ${className || ""}`}>
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
        <span className="text-sm font-bold text-slate-200">
          {interviewSession?.interviewSessionType === "followup" ? "꼬리질문형" : "전체 프로세스"} 면접
        </span>
        <span className="text-[11px] text-[#06B6D4]/80 border border-[#0991B2]/30 rounded-full px-2 py-px bg-[#0991B2]/10">
          {difficultyLabel}
        </span>
        <span className="text-[11px] text-[#06B6D4] border border-[#06B6D4]/30 rounded-full px-2 py-px bg-[#06B6D4]/10">
          {practiceModeLabel}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {interviewSession && hasStarted && (
          <span className="text-[11px] font-mono text-[#0991B2]">
            {currentInterviewTurnIndex + 1} / {interviewSession.estimatedTotalQuestions || "?"}
          </span>
        )}
        <button
          onClick={onFinish}
          disabled={isFinished || !hasStarted}
          className="flex items-center gap-1.5 text-xs font-bold text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg px-3 py-1.5 hover:bg-red-500/20 transition-colors disabled:opacity-40"
        >
          <Square size={12} /> 면접 종료
        </button>
      </div>
    </header>
  );
}
