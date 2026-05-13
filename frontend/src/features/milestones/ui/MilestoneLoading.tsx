import { Medal } from "lucide-react";

interface MilestoneLoadingProps {
  revealed?: boolean;
}

export function MilestoneLoading({ revealed }: MilestoneLoadingProps) {
  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sk-rv${
        revealed ? " sk-rv-in" : ""
      }`}
      style={{ transitionDelay: "150ms" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-7 h-7 rounded-lg bg-[#FFF7ED] flex items-center justify-center">
          <Medal size={14} className="text-[#F97316]" />
        </span>
        <h3 className="text-[14px] font-bold text-[#0A0A0A]">마일스톤</h3>
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-[#F3F4F6] rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
