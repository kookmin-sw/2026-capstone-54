import { Mic, AlertTriangle, VolumeX, Volume2 } from "lucide-react";

/**
 * 음성 분석 종합 섹션 (데이터 미연결 — UI 틀만 구성)
 */
export function AudioAnalysisSection() {
  return (
    <div className="report-card p-5">
      <p className="text-[11px] font-semibold tracking-[.08em] uppercase text-[#9CA3AF] mb-4">음성 분석 종합</p>

      {/* 4개 지표 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* 말하기 속도 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-2.5">
            <Mic size={16} className="text-emerald-500" />
          </div>
          <p className="text-[12px] font-semibold text-[#4B5563] mb-1">말하기 속도</p>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] mb-2">—</span>
          <p className="text-[11px] text-[#9CA3AF] leading-snug">데이터 준비 중</p>
          <p className="text-[11px] text-[#D1D5DB] mt-2 tabular-nums">— SPM</p>
        </div>

        {/* 습관어 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-2.5">
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <p className="text-[12px] font-semibold text-[#4B5563] mb-1">습관어</p>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#F3F4F6] text-[#9CA3AF] mb-2">—</span>
          <p className="text-[11px] text-[#9CA3AF] leading-snug">데이터 준비 중</p>
          <p className="text-[11px] text-[#D1D5DB] mt-2 tabular-nums">— %</p>
        </div>

        {/* 침묵 구간 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-2.5">
            <VolumeX size={16} className="text-emerald-500" />
          </div>
          <p className="text-[12px] font-semibold text-[#4B5563] mb-1">침묵 구간</p>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#F3F4F6] text-[#9CA3AF] mb-2">—</span>
          <p className="text-[11px] text-[#9CA3AF] leading-snug">데이터 준비 중</p>
          <p className="text-[11px] text-[#D1D5DB] mt-2 tabular-nums">— %</p>
        </div>

        {/* 목소리 크기 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-2.5">
            <Volume2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-[12px] font-semibold text-[#4B5563] mb-1">목소리 크기</p>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#F3F4F6] text-[#9CA3AF] mb-2">—</span>
          <p className="text-[11px] text-[#9CA3AF] leading-snug">데이터 준비 중</p>
          <p className="text-[11px] text-[#D1D5DB] mt-2">—</p>
        </div>
      </div>

      {/* 질문별 습관어 현황 (placeholder) */}
      <div className="bg-[#F9FAFB] rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-[#374151]">질문별 습관어 현황</p>
          <span className="text-[11px] text-[#9CA3AF]">10% 초과 시 집중 개선 권장</span>
        </div>
        <div className="flex items-center justify-center py-6">
          <p className="text-[12px] text-[#9CA3AF]">음성 분석 데이터가 준비되면 여기에 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}
