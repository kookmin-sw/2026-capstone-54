import type { ResumeCountStats } from "@/features/resume";

interface ResumeStatsStripProps {
  count: ResumeCountStats;
}

export function ResumeStatsStrip({ count }: ResumeStatsStripProps) {
  const stats = [
    { label: "전체", value: count.total },
    { label: "분석 중", value: count.processing + count.pending },
    { label: "분석 완료", value: count.completed },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6 max-sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 text-center">
          <div className="text-[11px] font-semibold text-[#6B7280]">{s.label}</div>
          <div className="text-2xl font-black text-[#0A0A0A] mt-1">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
