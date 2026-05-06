import { Eye, Smile } from "lucide-react";

/**
 * 영상 분석 종합 섹션 (데이터 미연결 — UI 틀만 구성)
 */
export function VideoAnalysisSection() {
  return (
    <div className="report-card p-5">
      <p className="text-[11px] font-semibold tracking-[.08em] uppercase text-[#9CA3AF] mb-4">영상 분석 종합</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 시선 처리 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-start">
          <div className="flex items-center gap-2 w-full mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#E6F7FA] flex items-center justify-center shrink-0">
              <Eye size={16} className="text-[#0991B2]" />
            </div>
            <p className="text-[13px] font-semibold text-[#374151]">시선 처리</p>
            <span className="ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF]">—</span>
          </div>
          <p className="text-[14px] font-bold text-[#1F2937] mb-1">시선 분석 대기 중</p>
          <p className="text-[12px] text-[#9CA3AF] leading-relaxed mb-3">
            영상 분석이 완료되면 질문별 시선 이탈 횟수와 안정도가 표시됩니다.
          </p>

          {/* Placeholder rows */}
          <div className="w-full space-y-1.5">
            {[1, 2, 3].map((q) => (
              <div key={q} className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white border border-gray-100">
                <span className="text-[12px] font-semibold text-[#D1D5DB] w-5 shrink-0">Q{q}</span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#D1D5DB] shrink-0">—</span>
                <p className="flex-1 text-[12px] text-[#D1D5DB]">데이터 준비 중</p>
                <span className="text-[11px] text-[#D1D5DB] tabular-nums shrink-0">—회</span>
              </div>
            ))}
          </div>
        </div>

        {/* 표정 분포 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-start">
          <div className="flex items-center gap-2 w-full mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Smile size={16} className="text-emerald-500" />
            </div>
            <p className="text-[13px] font-semibold text-[#374151]">표정 분포</p>
            <span className="ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF]">—</span>
          </div>
          <p className="text-[14px] font-bold text-[#1F2937] mb-1">표정 분석 대기 중</p>
          <p className="text-[12px] text-[#9CA3AF] leading-relaxed mb-3">
            영상 분석이 완료되면 긍정/무표정/부정 비율이 표시됩니다.
          </p>

          {/* Proportion bar placeholder */}
          <div className="w-full mb-3">
            <div className="flex h-3 rounded-full overflow-hidden bg-[#E5E7EB]">
              <div className="bg-[#D1D5DB]" style={{ width: "100%" }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#0991B2]" />
                <span className="text-[11px] text-[#9CA3AF]">긍정</span>
                <span className="text-[11px] font-bold text-[#D1D5DB] ml-1">—%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                <span className="text-[11px] text-[#9CA3AF]">무표정</span>
                <span className="text-[11px] font-bold text-[#D1D5DB] ml-1">—%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#E5E7EB]" />
                <span className="text-[11px] text-[#9CA3AF]">부정</span>
                <span className="text-[11px] font-bold text-[#D1D5DB] ml-1">—%</span>
              </div>
            </div>
          </div>

          {/* Status items placeholder */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white border border-gray-100">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#D1D5DB] shrink-0">긍정</span>
              <p className="flex-1 text-[12px] text-[#D1D5DB]">데이터 준비 중</p>
              <span className="text-[11px] text-[#D1D5DB] tabular-nums shrink-0">—%</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white border border-gray-100">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#D1D5DB] shrink-0">무표정</span>
              <p className="flex-1 text-[12px] text-[#D1D5DB]">데이터 준비 중</p>
              <span className="text-[11px] text-[#D1D5DB] tabular-nums shrink-0">—%</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white border border-gray-100">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#D1D5DB] shrink-0">부정</span>
              <p className="flex-1 text-[12px] text-[#D1D5DB]">데이터 준비 중</p>
              <span className="text-[11px] text-[#D1D5DB] tabular-nums shrink-0">—%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
