import { Mic, AlertTriangle, VolumeX, Volume2 } from "lucide-react";
import type { AudioAnalysisResult } from "@/features/interview-session/api/types";

interface AudioAnalysisSectionProps {
  audioAnalysisResult?: AudioAnalysisResult | null;
}

function getSpmBadge(spm: number) {
  if (spm === 0) return { label: "—", cls: "bg-[#F3F4F6] text-[#9CA3AF]" };
  if (spm >= 260 && spm <= 350) return { label: "적절해요", cls: "bg-[#DCFCE7] text-[#15803D]" };
  if (spm > 350) return { label: "빠릅니다", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
  return { label: "느립니다", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
}

function getFillerBadge(ratio: number) {
  if (ratio < 0.05) return { label: "양호", cls: "bg-[#DCFCE7] text-[#15803D]" };
  if (ratio < 0.10) return { label: "보통", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
  return { label: "개선 필요", cls: "bg-red-50 text-red-600" };
}

function getSilenceBadge(ratio: number) {
  if (ratio < 0.20) return { label: "자연스러워요", cls: "bg-[#DCFCE7] text-[#15803D]" };
  if (ratio < 0.30) return { label: "조금 많음", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
  return { label: "너무 깁니다", cls: "bg-red-50 text-red-600" };
}

function getVolumeBadge(dbfs: number | null) {
  if (dbfs === null || dbfs === 0) return { label: "—", cls: "bg-[#F3F4F6] text-[#9CA3AF]" };
  if (dbfs >= -30 && dbfs <= -10) return { label: "안정적이에요", cls: "bg-[#DCFCE7] text-[#15803D]" };
  return { label: "불안정합니다", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
}

function getPerTurnFillerBadge(ratio: number) {
  if (ratio < 0.05) return { label: "양호", cls: "bg-[#DCFCE7] text-[#15803D]" };
  if (ratio < 0.10) return { label: "보통", cls: "bg-amber-50 text-amber-600" };
  return { label: "개선 필요", cls: "bg-red-50 text-red-600" };
}

export function AudioAnalysisSection({ audioAnalysisResult }: AudioAnalysisSectionProps) {
  const summary = audioAnalysisResult?.summary;
  const perTurn = audioAnalysisResult?.perTurn ?? [];
  const hasData = !!summary && (summary.avgSpeechRateSpm > 0 || summary.avgSilenceRatio > 0);

  const spmBadge = getSpmBadge(summary?.avgSpeechRateSpm ?? 0);
  const fillerBadge = getFillerBadge(summary?.totalFillerWordRatio ?? 0);
  const silenceBadge = getSilenceBadge(summary?.avgSilenceRatio ?? 0);
  const volumeBadge = getVolumeBadge(summary?.avgVolumeDbfs ?? null);

  return (
    <div className="report-card p-7">
      <p className="text-[15px] font-bold text-[#374151] mb-4">음성 분석 종합</p>



      {/* 4개 지표 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* 말하기 속도 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-xl bg-[#E6F7FA] flex items-center justify-center mb-2.5">
            <Mic size={16} className="text-[#0E7490]" />
          </div>
          <p className="text-[12px] font-semibold text-[#4B5563] mb-1">말하기 속도</p>
          <span className={`text-[13px] font-bold px-4 py-1.5 rounded-full mb-2 ${spmBadge.cls}`}>{spmBadge.label}</span>
          <p className="text-[11px] text-[#374151] font-semibold mt-2 tabular-nums">
            {hasData ? `${summary!.avgSpeechRateSpm} SPM` : "— SPM"}
          </p>
        </div>

        {/* 필러워드 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-xl bg-[#E6F7FA] flex items-center justify-center mb-2.5">
            <AlertTriangle size={16} className="text-[#0C7A8A]" />
          </div>
          <p className="text-[12px] font-semibold text-[#4B5563] mb-1">필러워드</p>
          <span className={`text-[13px] font-bold px-4 py-1.5 rounded-full mb-2 ${fillerBadge.cls}`}>{fillerBadge.label}</span>
          <p className="text-[11px] text-[#374151] font-semibold mt-2 tabular-nums">
            {hasData ? `전체 ${(summary!.totalFillerWordRatio * 100).toFixed(1)}%` : "— %"}
          </p>
        </div>

        {/* 묵음 구간 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-xl bg-[#E6F7FA] flex items-center justify-center mb-2.5">
            <VolumeX size={16} className="text-[#0A6577]" />
          </div>
          <p className="text-[12px] font-semibold text-[#4B5563] mb-1">묵음 구간</p>
          <span className={`text-[13px] font-bold px-4 py-1.5 rounded-full mb-2 ${silenceBadge.cls}`}>{silenceBadge.label}</span>
          <p className="text-[11px] text-[#374151] font-semibold mt-2 tabular-nums">
            {hasData ? `평균 ${(summary!.avgSilenceRatio * 100).toFixed(0)}%` : "— %"}
          </p>
        </div>

        {/* 목소리 크기 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-xl bg-[#E6F7FA] flex items-center justify-center mb-2.5">
            <Volume2 size={16} className="text-[#155E75]" />
          </div>
          <p className="text-[12px] font-semibold text-[#4B5563] mb-1">목소리 크기</p>
          <span className={`text-[13px] font-bold px-4 py-1.5 rounded-full mb-2 ${volumeBadge.cls}`}>{volumeBadge.label}</span>
          <p className="text-[11px] text-[#374151] font-semibold mt-2 tabular-nums">
            {hasData && summary!.avgVolumeDbfs !== 0 ? `${summary!.avgVolumeDbfs} dBFS` : "—"}
          </p>
        </div>
      </div>

      {/* 질문별 필러워드 현황 */}
      <div className="bg-[#F9FAFB] rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-[#374151]">질문별 필러워드 현황</p>
          <span className="text-[11px] text-[#9CA3AF]">10% 초과 시 집중 개선 권장</span>
        </div>
        {hasData && perTurn.length > 0 ? (
          <div className="space-y-1.5">
            {perTurn.map((turn) => {
              const badge = getPerTurnFillerBadge(turn.fillerWordRatio);
              const topFillers = Object.entries(turn.fillerWordDetail || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 2)
                .map(([word]) => word)
                .join(", ");

              let comment = "필러워드가 거의 없어 자신감 있는 답변이었습니다.";
              if (turn.fillerWordRatio >= 0.10) {
                comment = topFillers
                  ? `'${topFillers}'가 자주 등장해 흐름이 끊겼습니다.`
                  : "필러워드가 자주 등장해 흐름이 끊겼습니다.";
              } else if (turn.fillerWordRatio >= 0.05) {
                comment = "일부 필러워드가 있지만 전달에는 지장이 없는 수준입니다.";
              }

              return (
                <div
                  key={turn.turnNumber}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 border ${
                    turn.fillerWordRatio >= 0.10
                      ? "bg-red-50/50 border-red-100"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <span className="text-[12px] font-semibold text-[#6B7280] w-6 shrink-0">Q{turn.turnNumber}</span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <p className="flex-1 text-[12px] text-[#6B7280] truncate">{comment}</p>
                  <span className={`text-[11px] tabular-nums shrink-0 ${
                    turn.fillerWordRatio >= 0.10 ? "text-red-600 font-semibold" : "text-[#6B7280]"
                  }`}>
                    {(turn.fillerWordRatio * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6">
            <p className="text-[12px] text-[#9CA3AF]">음성 분석 데이터가 준비되면 여기에 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
