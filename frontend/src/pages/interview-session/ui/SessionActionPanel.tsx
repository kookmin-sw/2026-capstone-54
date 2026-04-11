import { Loader2, Mic } from "lucide-react";
import type { InterviewPhase, AnswerState } from "@/features/interview-session";

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

const AUDIO_WARN_THRESHOLD = 25;

export function SessionActionPanel({
  hasStarted, isFinished, isRealMode, isStarting, isModelLoading,
  isSubmitting, interviewPhase, answerState, countdown, ttsPlaying,
  audioLevel, finalText, interimText,
  onStart, onPracticeStart, onSubmitAnswer,
}: SessionActionPanelProps) {
  // Practice mode: warn if user appears to be speaking before pressing start
  const showSpeakingWarning =
    !isRealMode &&
    hasStarted &&
    !isFinished &&
    (answerState === "waiting_ready" || answerState === "waiting_start") &&
    !ttsPlaying &&
    !isSubmitting &&
    audioLevel >= AUDIO_WARN_THRESHOLD;

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
          {/* 실전 모드: TTS 재생 중 */}
          {isRealMode && ttsPlaying && countdown === null && (
            <div className="w-full py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-center">
              <p className="text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                <Loader2 size={12} className="animate-spin" /> 질문 음성 재생 중...
              </p>
            </div>
          )}

          {/* 실전 모드: 카운트다운 */}
          {isRealMode && countdown !== null && countdown > 0 && (
            <div className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <p className="text-amber-400 text-xs font-semibold mb-1">잠시 후 자동 시작</p>
              <p className="text-amber-300 text-3xl font-black">{countdown}</p>
            </div>
          )}

          {/* 연습 모드: 말하기 시작 (TTS 재생 중 비활성화) */}
          {!isRealMode && (answerState === "waiting_ready" || answerState === "waiting_start") && !isSubmitting && (
            <button
              onClick={onPracticeStart}
              disabled={ttsPlaying}
              className="w-full py-3 rounded-xl font-bold text-base bg-green-600 hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {ttsPlaying
                ? <><Loader2 size={14} className="animate-spin" /> 질문 음성 재생 중...</>
                : <><Mic size={16} /> 말하기 시작</>}
            </button>
          )}

          {/* 연습 모드: 마이크 감지 경고 */}
          {showSpeakingWarning && (
            <div className="w-full py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-amber-400 text-[11px] font-semibold flex items-center justify-center gap-1.5">
                <Mic size={12} /> 음성이 감지되고 있어요. 위 버튼을 눌러 답변을 시작해주세요!
              </p>
            </div>
          )}

          {/* 답변 제출 */}
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

          {/* 대기 표시 */}
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
