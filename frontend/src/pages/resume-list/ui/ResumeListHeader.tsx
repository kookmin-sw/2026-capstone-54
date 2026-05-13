import { Search } from "lucide-react";

interface ResumeListHeaderProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function ResumeListHeader({ totalCount, searchQuery, onSearchChange }: ResumeListHeaderProps) {
  return (
    <div className="flex items-center gap-4 mt-6 flex-wrap">
      <h2 className="text-[15px] font-extrabold text-[#0A0A0A] shrink-0">
        전체 이력서 <span className="text-[#0991B2]">{totalCount}</span>개
      </h2>
      <div className="flex-1 min-w-[220px] relative max-sm:min-w-0">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
        <input
          type="text"
          className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg py-2.5 pr-4 pl-11 text-sm font-medium text-[#0A0A0A] shadow-[0_1px_3px_rgba(0,0,0,0.08)] outline-none transition-[border-color] focus:border-[#0991B2] focus:shadow-[0_1px_3px_rgba(0,0,0,0.1)] placeholder:text-[#9CA3AF]"
          placeholder="이력서 제목 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="이력서 검색"
        />
      </div>
    </div>
  );
}
