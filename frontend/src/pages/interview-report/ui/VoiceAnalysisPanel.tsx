import type { BehaviorAnalysis } from "@/features/interview-session";

interface VoiceAnalysisPanelProps {
  analysis: BehaviorAnalysis;
}

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function VoiceAnalysisPanel({ analysis }: VoiceAnalysisPanelProps) {
  if (!analysis.speechData) return null;

  const { summary, timeline } = analysis.speechData;
  const { totalDurationMs } = summary;

  const getDbfsColor = (dbfs: number | null) => {
    if (dbfs === null) return "bg-[#E5E7EB]";
    if (dbfs >= -30) return "bg-[#059669]";
    if (dbfs >= -45) return "bg-[#D97706]";
    return "bg-[#DC2626]";
  };

  const getSilenceColor = (ratio: number) => {
    if (ratio < 0.15) return "text-[#059669]";
    if (ratio <= 0.3) return "text-[#D97706]";
    return "text-[#DC2626]";
  };

  const silenceRatioPct = Math.round(summary.silenceRatio * 100);
  const dashArray = `${silenceRatioPct}, 100`;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-4 mt-4">
      <div className="flex justify-between items-start">
        <h4 className="text-[10px] font-bold uppercase tracking-wide text-[#0991B2]">음성 분석 결과</h4>
        <div className="flex gap-4 text-[10px] text-[#6B7280]">
          <div className="flex flex-col items-end">
            <span>총 답변 시간</span>
            <span className="text-[11px] font-bold text-gray-900">{formatDuration(summary.totalDurationMs)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span>발화 시간</span>
            <span className="text-[11px] font-bold text-gray-900">{formatDuration(summary.speechDurationMs)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span>침묵 횟수</span>
            <span className="text-[11px] font-bold text-gray-900">{summary.silenceSegmentCount}회</span>
          </div>
          <div className="flex flex-col items-end">
            <span>평균 음량</span>
            <span className="text-[11px] font-bold text-gray-900">
              {summary.avgDbfsSpeech !== null ? `${summary.avgDbfsSpeech.toFixed(1)} dBFS` : "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[10px] text-[#6B7280]">침묵 비율</span>
          <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
            <svg viewBox="0 0 36 36" className="absolute w-full h-full -rotate-90">
              <path
                className="text-gray-200"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className={getSilenceColor(summary.silenceRatio)}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={dashArray}
              />
            </svg>
            <span className={`text-[11px] font-bold ${getSilenceColor(summary.silenceRatio)}`}>
              {silenceRatioPct}%
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#6B7280]">발화/침묵 구간</span>
            <div className="h-4 flex rounded-full overflow-hidden bg-gray-100 w-full group">
              {timeline.map((seg, idx) => {
                const widthPct = ((seg.endMs - seg.startMs) / totalDurationMs) * 100;
                const label = seg.type === "speech" ? "발화" : "침묵";
                return (
                  <div
                    key={idx}
                    className={`h-full relative ${seg.type === "speech" ? "bg-[#059669]" : "bg-gray-300"}`}
                    style={{ width: `${widthPct}%` }}
                    title={`${label}: ${formatDuration(seg.startMs)} - ${formatDuration(seg.endMs)}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#6B7280]">음량 (dBFS)</span>
            <div className="h-8 flex items-end w-full gap-[1px]">
              {timeline.map((seg, idx) => {
                if (seg.type === "silence") {
                  const widthPct = ((seg.endMs - seg.startMs) / totalDurationMs) * 100;
                  return <div key={idx} style={{ width: `${widthPct}%` }} className="h-0" />;
                }
                const widthPct = ((seg.endMs - seg.startMs) / totalDurationMs) * 100;
                const dbfs = seg.dbfs || -60;
                const heightPct = Math.max(10, Math.min(100, ((dbfs + 60) / 60) * 100));
                
                return (
                  <div
                    key={idx}
                    className="flex items-end"
                    style={{ width: `${widthPct}%`, height: "100%" }}
                  >
                    <div 
                      className={`w-full rounded-t-sm ${getDbfsColor(dbfs)}`} 
                      style={{ height: `${heightPct}%` }}
                      title={`음량: ${dbfs.toFixed(1)} dBFS`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

