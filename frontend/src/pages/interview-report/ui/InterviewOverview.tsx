import type { InterviewAnalysisReport } from "@/features/interview-session";

const DIFFICULTY_STYLE: Record<string, { label: string; cls: string }> = {
  friendly: { label: "친근한 면접관", cls: "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]" },
  normal:   { label: "일반 면접관",   cls: "border-[#BAE6FD] bg-[#E6F7FA] text-[#0991B2]" },
  pressure: { label: "압박 면접관",   cls: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}. ${mm}. ${dd}. ${hh}:${mi}`;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}분 ${s}초`;
}

interface Props {
  report: InterviewAnalysisReport;
}

export function InterviewOverview({ report }: Props) {
  const items = [
    { label: "면접 일시", value: formatDate(report.interviewDate) },
    { label: "지원 회사", value: report.companyName || "-" },
    { label: "채용 포지션", value: report.positionTitle || "-" },
    { label: "소요시간", value: formatDuration(report.durationSeconds) },
    { label: "면접 난이도", value: (
      <span className={`text-[11px] font-semibold py-0.5 px-2 rounded-full border ${
        (DIFFICULTY_STYLE[report.difficultyLevel] ?? DIFFICULTY_STYLE.normal).cls
      }`}>
        {(DIFFICULTY_STYLE[report.difficultyLevel] ?? { label: report.difficultyLevel }).label}
      </span>
    )},
    {
      label: "총 질문 수",
      value: (
        <>
          {report.totalQuestions}문항
          {report.totalFollowupQuestions > 0 && (
            <span className="text-[13px] font-normal text-[#9CA3AF] ml-1">
              (꼬리 {report.totalFollowupQuestions})
            </span>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm mb-4">
      <h2 className="text-[11px] font-bold tracking-[.08em] uppercase text-[#9CA3AF] mb-4">
        면접 개요
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[13px] text-[#9CA3AF] mb-0.5">{item.label}</p>
            <p className="text-[13px] font-semibold text-[#1F2937]">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
