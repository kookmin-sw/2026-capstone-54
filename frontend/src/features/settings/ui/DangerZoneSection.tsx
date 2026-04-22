import { TriangleAlert } from "lucide-react";

interface DangerZoneSectionProps {
  onDeleteData: () => void;
}

export function DangerZoneSection({ onDeleteData }: DangerZoneSectionProps) {
  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
      <div className="font-plex-sans-kr text-[14px] font-extrabold tracking-[-0.1px] mb-3 flex items-center gap-[7px] text-[#EF4444]">
        <TriangleAlert size={15} className="text-[#EF4444]" /> 위험 구역
      </div>
      <div className="bg-[rgba(239,68,68,0.03)] border border-[rgba(239,68,68,0.15)] rounded-[10px] px-5 py-[18px]">
        <div className="flex items-center justify-between gap-3 flex-wrap py-[10px]">
          <div>
            <div className="font-plex-sans-kr text-[13px] font-bold text-[#0A0A0A] mb-0.5">모든 면접 데이터 삭제</div>
            <div className="text-[11px] text-[#6B7280]">저장된 면접 세션, 리포트, 답변 내역이 영구 삭제됩니다</div>
          </div>
          <button
            className="font-plex-sans-kr text-[13px] font-bold text-[#EF4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-lg px-4 py-2 cursor-pointer whitespace-nowrap transition-all duration-150 hover:bg-[rgba(239,68,68,0.14)]"
            onClick={onDeleteData}
          >
            데이터 삭제
          </button>
        </div>
      </div>
    </div>
  );
}