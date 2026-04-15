import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { InterviewPhase, AnswerState } from "@/features/interview-session";
import { SpeakingWarning } from "./SpeakingWarning";

const AUDIO_WARN_THRESHOLD = 25;
const WARN_HOLD_MS = 3000;

interface SessionActionPanelProps {
  hasStarted: boolean;
  isFinished: boolean;
  isRealMode: boolean;
  isStarting: boolean;
  isModelLoading: boolean;
  isSubmitting: boolean;
  interviewPhase: InterviewPhase;
  answerState: AnswerState;
  countdown: number | null;
  ttsPlaying: boolean;
  audioLevel: number;
  finalText: string;
  interimText: string;
  onStart: () => void;
  onPracticeStart: () => void;
  onSubmitAnswer: () => void;
}

export function SessionActionPanel({
  hasStarted, isFinished, isRealMode, isStarting, isModelLoading,
  isSubmitting, interviewPhase, answerState, countdown, ttsPlaying,
  audioLevel, finalText, interimText,
  onStart, onPracticeStart, onSubmitAnswer,
}: SessionActionPanelProps) {
  const shouldWarn =
    !isRealMode && hasStarted && !isFinished &&
    (answerState === "waiting_ready" || answerState === "waiting_start") &&
    !ttsPlaying && !isSubmitting;

  const [warnVisible, setWarnVisible] = useState(false);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!shouldWarn) {
      setWarnVisible(false); // eslint-disable-line react-hooks/set-state-in-effect -- clearing on deactivation
      if (warnTimerRef.current) { clearTimeout(warnTimerRef.current); warnTimerRef.current = null; }
      return;
    }
    if (audioLevel >= AUDIO_WARN_THRESHOLD) {
      setWarnVisible(true);  
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      warnTimerRef.current = setTimeout(() => {
        setWarnVisible(false);
        warnTimerRef.current = null;
      }, WARN_HOLD_MS);
    }
  }, [audioLevel, shouldWarn]);

  useEffect(() => () => { if (warnTimerRef.current) clearTimeout(warnTimerRef.current); }, []);

  return (
    <div className="shrink-0 p-4 border-b border-white/10 flex flex-col gap-2">
      {!hasStarted && !isFinished && (
        <button
          onClick={onStart}
          disabled={isStarting || isModelLoading}
          className="w-full py-3 rounded-xl font-bold text-base bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isStarting || isModelLoading
            ? <><Loader2 size={16} className="animate-spin" /> 준비 중...</>
            : "면접 시작"}
        </button>
      )}

      {hasStarted && !isFinished && (
        <>
          {isRealMode && ttsPlaying && countdown === null && (
            <div className="w-full py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-center">
              <p className="text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                <Loader2 size={12} className="animate-spin" /> 질문 음성 재생 중...
              </p>
            </div>
          )}

          {isRealMode && countdown !== null && countdown > 0 && (
            <div className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <p className="text-amber-400 text-xs font-semibold mb-1">잠시 후 자동 시작</p>
              <p className="text-amber-300 text-3xl font-black">{countdown}</p>
            </div>
          )}

          {!isRealMode && (answerState === "waiting_ready" || answerState === "waiting_start") && !isSubmitting && (
            <button
              onClick={onPracticeStart}
              disabled={ttsPlaying}
              className="w-full py-3 rounded-xl font-bold text-base bg-green-600 hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {ttsPlaying
                ? <><Loader2 size={14} className="animate-spin" /> 질문 음성 재생 중...</>
                : "말하기 시작"}
            </button>
          )}

          <SpeakingWarning visible={warnVisible} />

          {(answerState === "speaking" || isSubmitting) && (
            <button
              onClick={onSubmitAnswer}
              disabled={isSubmitting || (!finalText.trim() && !interimText.trim())}
              className="w-full py-3 rounded-xl font-bold text-base bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" />
                  {interviewPhase === "generating_followup" ? "꼬리질문 생성 중..." : "제출 중..."}
                </>
              ) : "답변 제출"}
            </button>
          )}

          {isSubmitting && answerState !== "speaking" && (
            <div className="w-full py-2.5 rounded-xl bg-slate-800/50 text-center text-[12px] text-slate-400 flex items-center justify-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              {interviewPhase === "generating_followup" ? "꼬리질문 생성 중..." : "처리 중..."}
            </div>
          )}
        </>
      )}
    </div>
  );
}
