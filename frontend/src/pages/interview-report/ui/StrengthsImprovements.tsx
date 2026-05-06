import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { InterviewStrengthItem } from "@/features/interview-session";

interface StrengthsImprovementsProps {
  strengths: InterviewStrengthItem[];
  improvements: InterviewStrengthItem[];
}

export function StrengthsImprovements({ strengths, improvements }: StrengthsImprovementsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 강점 */}
      <div className="report-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle2 size={13} className="text-emerald-500" strokeWidth={2.2} />
          </div>
          <h2 className="text-[13px] font-semibold text-[#111827]">강점</h2>
        </div>
        <div className="space-y-3">
          {strengths.map((s, i) => (
            <div key={i} className="border-l-2 border-emerald-500 pl-3">
              <p className="text-[13px] font-semibold text-[#1F2937] mb-0.5">{s.title}</p>
              <p className="text-[12px] text-[#6B7280] leading-relaxed">{s.evidence}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 개선 영역 */}
      <div className="report-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
            <AlertTriangle size={13} className="text-amber-500" strokeWidth={2.2} />
          </div>
          <h2 className="text-[13px] font-semibold text-[#111827]">개선 영역</h2>
        </div>
        <div className="space-y-3">
          {improvements.map((s, i) => (
            <div key={i} className="border-l-2 border-amber-500 pl-3">
              <p className="text-[13px] font-semibold text-[#1F2937] mb-0.5">{s.title}</p>
              <p className="text-[12px] text-[#6B7280] leading-relaxed">{s.evidence}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
