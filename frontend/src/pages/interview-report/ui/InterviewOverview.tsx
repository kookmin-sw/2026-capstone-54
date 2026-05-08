import type { InterviewAnalysisReport } from "@/features/interview-session";

const DIFFICULTY_KO: Record<string, string> = {
  friendly: "친근한 면접관",
  normal: "일반 면접관",
  pressure: "압박 면접관",
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
    { label: "지원 회사", value: report.companyName || "-" },
    { label: "채용 포지션", value: report.positionTitle || "-" },
    { label: "면접 일시", value: formatDate(report.interviewDate) },
    { label: "소요시간", value: formatDuration(report.durationSeconds) },
    { label: "면접관 난이도", value: DIFFICULTY_KO[report.difficultyLevel] ?? report.difficultyLevel },
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
    <div className="report-card p-7">
      <p className="text-[15px] font-bold text-[#374151] mb-4">
        면접 개요
      </p>
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
