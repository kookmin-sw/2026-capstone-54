import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { InterviewPhase } from "@/features/interview-session";
import type { MachinePhase } from "../model/machine";
import { SpeakingWarning } from "./SpeakingWarning";

const AUDIO_WARN_THRESHOLD = 25;
const WARN_HOLD_MS = 3000;

type ActionMode =
  | "loading"
  | "not_started"
  | "starting"
  | "real_tts_playing"
  | "real_countdown"
  | "practice_tts_playing"
  | "preparing_record"
  | "practice_ready"
  | "speaking"
  | "submitting"
  | "finished";

interface SessionActionPanelProps {
  machinePhase: MachinePhase;
  isRealMode: boolean;
  countdown: number | null;
  isModelLoading: boolean;
  interviewPhase: InterviewPhase;
  audioLevel: number;
  finalText: string;
  interimText: string;
  onStart: () => void;
  onPracticeStart: () => void;
  onSubmitAnswer: () => void;
}

function deriveActionMode(machinePhase: MachinePhase, isRealMode: boolean): ActionMode {
  switch (machinePhase) {
    case "idle": return "loading";
    case "ready": return "not_started";
    case "starting": return "starting";
    case "tts_playing": return isRealMode ? "real_tts_playing" : "practice_tts_playing";
    case "preparing_record": return "preparing_record";
    case "countdown": return "real_countdown";
    case "awaiting_start": return "practice_ready";
    case "speaking": return "speaking";
    case "submitting": return "submitting";
    case "finished": return "finished";
    case "error": return "finished";
  }
}

export function SessionActionPanel({
  machinePhase, isRealMode, countdown, isModelLoading,
  interviewPhase, audioLevel, finalText, interimText,
  onStart, onPracticeStart, onSubmitAnswer,
}: SessionActionPanelProps) {
  const mode = deriveActionMode(machinePhase, isRealMode);

  const shouldWarn = mode === "practice_ready";
  const [warnVisible, setWarnVisible] = useState(false);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!shouldWarn) {
      setWarnVisible(false); // eslint-disable-line react-hooks/set-state-in-effect -- reset on mode change
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

  const hasAnswer = !!(finalText.trim() || interimText.trim());
  const showLoading = mode === "loading" || mode === "starting" || (mode === "not_started" && isModelLoading);

  return (
    <div className="shrink-0 p-4 border-b border-white/10 flex flex-col gap-2">
      {(mode === "loading" || mode === "not_started" || mode === "starting") && (
        <button
          onClick={onStart}
          disabled={mode !== "not_started" || isModelLoading}
          className="w-full py-3 rounded-xl font-bold text-base bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {showLoading
            ? <><Loader2 size={16} className="animate-spin" /> 준비 중...</>
            : "면접 시작"}
        </button>
      )}

      {mode === "real_tts_playing" && (
        <div className="w-full py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-center">
          <p className="text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5">
            <Loader2 size={12} className="animate-spin" /> 질문 음성 재생 중...
          </p>
        </div>
      )}

      {mode === "real_countdown" && (
        <div className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
          <p className="text-amber-400 text-xs font-semibold mb-1">잠시 후 자동 시작</p>
          <p className="text-amber-300 text-3xl font-black">{countdown}</p>
        </div>
      )}

      {mode === "practice_tts_playing" && (
        <button disabled className="w-full py-3 rounded-xl font-bold text-base bg-green-600 transition-colors opacity-50 flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" /> 질문 음성 재생 중...
        </button>
      )}

      {mode === "preparing_record" && (
        <button disabled className="w-full py-3 rounded-xl font-bold text-base bg-green-600 transition-colors opacity-50 flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" /> 녹화 준비 중...
        </button>
      )}

      {mode === "practice_ready" && (
        <button
          onClick={onPracticeStart}
          className="w-full py-3 rounded-xl font-bold text-base bg-green-600 hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
        >
          말하기 시작
        </button>
      )}

      <SpeakingWarning visible={warnVisible} />

      {mode === "speaking" && (
        <button
          onClick={onSubmitAnswer}
          disabled={!hasAnswer}
          className="w-full py-3 rounded-xl font-bold text-base bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          답변 제출
        </button>
      )}

      {mode === "submitting" && (
        <button disabled className="w-full py-3 rounded-xl font-bold text-base bg-indigo-600 opacity-50 flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          {interviewPhase === "generating_followup" ? "꼬리질문 생성 중..." : interviewPhase === "submitting" ? "제출 중..." : "답변 저장 중..."}
        </button>
      )}
    </div>
  );
}
