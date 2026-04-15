import { TrendingUp, ChevronRight } from "lucide-react";
import type { InterviewStrengthItem } from "@/features/interview-session";

interface StrengthsImprovementsProps {
  strengths: InterviewStrengthItem[];
  improvements: InterviewStrengthItem[];
}

export function StrengthsImprovements({ strengths, improvements }: StrengthsImprovementsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4 max-sm:grid-cols-1">
      <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-5">
        <h3 className="text-[12px] font-bold text-[#059669] mb-3 flex items-center gap-1.5">
          <TrendingUp size={14} /> 강점
        </h3>
        <ul className="flex flex-col gap-3">
          {strengths.map((s, i) => (
            <li key={i} className="text-[12px] text-[#374151]">
              <p className="font-bold text-[#059669] mb-0.5">✓ {s.title}</p>
              <p className="text-[11px] text-[#6B7280] leading-relaxed">{s.evidence}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-5">
        <h3 className="text-[12px] font-bold text-[#D97706] mb-3 flex items-center gap-1.5">
          <ChevronRight size={14} /> 개선 영역
        </h3>
        <ul className="flex flex-col gap-3">
          {improvements.map((s, i) => (
            <li key={i} className="text-[12px] text-[#374151]">
              <p className="font-bold text-[#D97706] mb-0.5">→ {s.title}</p>
              <p className="text-[11px] text-[#6B7280] leading-relaxed">{s.evidence}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
