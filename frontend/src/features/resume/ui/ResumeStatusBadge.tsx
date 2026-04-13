/** 분석 상태와 활성 여부를 함께 표시하는 배지. */
import type { AnalysisStatus } from "../api/types";

interface ResumeStatusBadgeProps {
  status: AnalysisStatus;
  isActive?: boolean;
}

const STATUS_STYLE: Record<AnalysisStatus, { label: string; cls: string }> = {
  pending:    { label: "대기",     cls: "text-[#6B7280] bg-[#F3F4F6] border-[#E5E7EB]" },
  processing: { label: "분석 중",  cls: "text-[#0991B2] bg-[#E6F7FA] border-[#BAE6FD]" },
  completed:  { label: "분석 완료", cls: "text-[#059669] bg-[#ECFDF5] border-[#BBF7D0]" },
  failed:     { label: "분석 실패", cls: "text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]" },
};

export function ResumeStatusBadge({ status, isActive }: ResumeStatusBadgeProps) {
  const s = STATUS_STYLE[status];
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[10px] font-bold border rounded-full px-2 py-px ${s.cls}`}>
        {s.label}
      </span>
      {isActive === false && (
        <span className="text-[10px] font-bold border rounded-full px-2 py-px text-[#6B7280] bg-[#F9FAFB] border-[#E5E7EB]">
          비활성
        </span>
      )}
    </div>
  );
}
