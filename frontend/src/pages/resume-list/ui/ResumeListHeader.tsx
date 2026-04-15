import { Plus } from "lucide-react";

interface ResumeListHeaderProps {
  totalCount: number;
  onAdd: () => void;
}

export function ResumeListHeader({ totalCount, onAdd }: ResumeListHeaderProps) {
  return (
    <div className="flex items-center justify-between mt-6">
      <h2 className="text-[15px] font-extrabold text-[#0A0A0A]">
        전체 이력서 <span className="text-[#0991B2]">{totalCount}</span>개
      </h2>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white bg-[#0A0A0A] rounded-lg py-2.5 px-4 hover:opacity-85 transition-opacity"
      >
        <Plus size={14} /> 이력서 추가하기
      </button>
    </div>
  );
}
