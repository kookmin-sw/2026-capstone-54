import type { SpeechMetrics } from "@/shared/lib/speech/SpeechAnalyzer";

interface BehaviorMetricsProps {
  className?: string;
  speechMetrics: SpeechMetrics;
  videoWarningCount: number;
  isSpeechActive: boolean;
  audioLevel: number;
  fps: number;
  isAnalyzing: boolean;
}

export function BehaviorMetrics({
  className,
  speechMetrics,
  videoWarningCount,
  audioLevel,
  fps,
  isAnalyzing,
}: BehaviorMetricsProps) {
  return (
    <div className={`bg-[#071a26]/80 border border-[#0991B2]/20 rounded-2xl p-4 flex flex-col gap-3 ${className || ""}`}>
      <div className="text-[10px] font-bold tracking-widest uppercase text-[#0991B2]/60">실시간 분석</div>

      <div className="grid grid-cols-2 gap-2">
        <MetricItem label="발화 속도" value={speechMetrics.wpm} unit="SPM" warnAt={0} />
        <MetricItem label="필러 워드" value={speechMetrics.fillerCount} warnAt={1} />
        <MetricItem label="발화 중단" value={speechMetrics.pauseWarnings} warnAt={1} />
        <MetricItem label="시선 이탈" value={videoWarningCount} warnAt={1} />
      </div>

      {/* 오디오 레벨 */}
      <div>
        <div className="text-[10px] text-slate-500 mb-1 flex justify-between">
          <span>마이크 레벨</span>
          {isAnalyzing && <span className="text-[#06B6D4] font-mono">{fps} FPS</span>}
        </div>
        <div className="h-1.5 bg-[#0a1e2a] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0991B2] to-[#06B6D4] transition-all duration-75"
            style={{ width: `${Math.min(100, audioLevel)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  unit,
  warnAt,
}: {
  label: string;
  value: number;
  unit?: string;
  warnAt: number;
}) {
  const isWarn = value > warnAt && warnAt > 0;
  const isGood = warnAt === 0;
  return (
    <div className="bg-[#050e18] border border-[#0991B2]/10 rounded-xl px-3 py-2">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div
        className={`text-lg font-mono font-bold ${
          isGood ? "text-slate-300" : isWarn ? "text-yellow-400" : "text-slate-300"
        }`}
      >
        {value}
        {unit && <span className="text-[10px] font-normal ml-1 text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}
