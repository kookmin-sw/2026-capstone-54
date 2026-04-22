import { Volume2, VolumeX, SkipForward } from "lucide-react";
import type { InterviewTurn } from "../api/types";
import type { InterviewPhase } from "../model/types";

interface QuestionPanelProps {
  className?: string;
  currentInterviewTurn: InterviewTurn | null;
  interviewPhase: InterviewPhase;
  currentTurnIndex: number;
  totalTurns: number;
  // TTS controls
  ttsPlaying?: boolean;
  ttsMuted?: boolean;
  ttsVolume?: number;
  onMuteToggle?: () => void;
  onVolumeChange?: (v: number) => void;
  onSkipTts?: () => void;
}

export function QuestionPanel({
  className,
  currentInterviewTurn,
  interviewPhase,
  currentTurnIndex,
  totalTurns,
  ttsPlaying = false,
  ttsMuted = false,
  ttsVolume = 80,
  onMuteToggle,
  onVolumeChange,
  onSkipTts,
}: QuestionPanelProps) {
  const isGenerating = interviewPhase === "generating_followup" || interviewPhase === "starting";

  return (
    <div className={`bg-slate-800/60 border border-white/10 rounded-2xl p-6 min-h-[260px] flex flex-col ${className || ""}`}>
      {/* ── 상단: 라벨 + 카운터 + TTS 컨트롤 ── */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400">
          {currentInterviewTurn?.turnType === "followup" ? "꼬리질문" : "면접 질문"}
        </span>
        {totalTurns > 0 && (
          <span className="text-[11px] text-slate-500 font-mono">
            {currentTurnIndex + 1} / {totalTurns}
          </span>
        )}

        {/* TTS Controls — 우측 상단 고정 */}
        <div className="ml-auto flex items-center gap-2">
          {/* 재생 중 표시 */}
          {ttsPlaying && (
            <span className="flex items-center gap-1 text-[10px] text-indigo-300 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              재생 중
            </span>
          )}

          {/* 스킵 버튼 */}
          {ttsPlaying && !ttsMuted && onSkipTts && (
            <button
              onClick={onSkipTts}
              title="음성 스킵"
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white border border-white/10 rounded-md px-1.5 py-0.5 transition-colors"
            >
              <SkipForward size={11} /> 스킵
            </button>
          )}

          {/* 음소거 토글 */}
          {onMuteToggle && (
            <button
              onClick={onMuteToggle}
              title={ttsMuted ? "음소거 해제" : "세션 동안 음소거"}
              className="flex items-center gap-1 cursor-pointer"
            >
              {ttsMuted
                ? <VolumeX size={13} className="text-slate-500" />
                : <Volume2 size={13} className="text-slate-300" />
              }
              <span className="text-[10px] text-slate-500 select-none">{ttsMuted ? "음소거" : "음성"}</span>
            </button>
          )}

          {/* 볼륨 슬라이더 (음소거 아닐 때) */}
          {!ttsMuted && onVolumeChange && (
            <input
              type="range"
              min={0}
              max={100}
              value={ttsVolume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-16 h-1 accent-indigo-400 cursor-pointer"
              title={`볼륨 ${ttsVolume}%`}
            />
          )}
        </div>
      </div>

      {/* ── 질문 본문 (flex-1 → 영역 채움) ── */}
      <div className="flex-1 flex items-start">
        {isGenerating ? (
          <div className="flex items-center gap-3 text-slate-400">
            <span className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
            <span className="text-sm">질문을 생성하고 있습니다...</span>
          </div>
        ) : currentInterviewTurn ? (
          <p className="text-white text-lg leading-relaxed font-medium">
            {currentInterviewTurn.question}
          </p>
        ) : (
          <p className="text-slate-500 text-sm italic">면접을 시작하면 질문이 표시됩니다.</p>
        )}
      </div>
    </div>
  );
}
