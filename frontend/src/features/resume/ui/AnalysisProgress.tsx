/** AI 분석 진행 상태를 analysis_step 기반으로 시각화한다. */
import { Loader2 } from "lucide-react";
import type { AnalysisStatus, AnalysisStep } from "../api/types";

const STEP_ORDER: AnalysisStep[] = [
  "queued",
  "extracting_text",
  "embedding",
  "analyzing",
  "finalizing",
  "done",
];

const STEP_LABELS: Record<AnalysisStep, string> = {
  queued: "대기열에 들어갔어요",
  extracting_text: "텍스트를 추출하고 있어요",
  embedding: "임베딩을 생성하고 있어요",
  analyzing: "내용을 분석하고 있어요",
  finalizing: "결과를 정리하고 있어요",
  done: "완료되었어요",
};

interface AnalysisProgressProps {
  status: AnalysisStatus;
  step: AnalysisStep;
  className?: string;
}

export function AnalysisProgress({ status, step, className = "" }: AnalysisProgressProps) {
  if (status === "completed") {
    return (
      <div className={`text-[12px] font-semibold text-[#059669] ${className}`}>
        ✓ 분석이 완료되었어요
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className={`text-[12px] font-semibold text-[#DC2626] ${className}`}>
        ✕ 분석에 실패했어요
      </div>
    );
  }

  const currentIndex = STEP_ORDER.indexOf(step);
  const pct = currentIndex >= 0 ? ((currentIndex + 1) / STEP_ORDER.length) * 100 : 0;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Loader2 size={14} className="animate-spin text-[#0991B2]" />
        <span className="text-[12px] font-semibold text-[#0991B2]">
          {STEP_LABELS[step] ?? "분석 중"}
        </span>
      </div>
      <div className="h-1 rounded-full bg-[#E5E7EB] overflow-hidden">
        <div
          className="h-full bg-[#0991B2] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
