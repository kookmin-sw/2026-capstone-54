import { Edit2, Trash2, Power, PowerOff } from "lucide-react";
import { ResumeStatusBadge, type ResumeDetail } from "@/features/resume";
import { formatDateTime } from "@/shared/lib/format/date";

interface ResumeDetailHeaderProps {
  resume: ResumeDetail;
  isToggling: boolean;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** 상세 페이지 상단: 제목, 상태 배지, 메타 정보, 액션 버튼. */
export function ResumeDetailHeader({
  resume,
  isToggling,
  onToggleActive,
  onEdit,
  onDelete,
}: ResumeDetailHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h1 className="text-[clamp(22px,3vw,32px)] font-black tracking-[-0.5px] text-[#0A0A0A] leading-[1.2]">
            {resume.title}
          </h1>
          <ResumeStatusBadge status={resume.analysisStatus} isActive={resume.isActive} />
        </div>
        <div className="text-[12px] text-[#6B7280] flex items-center gap-3 flex-wrap">
          <span>생성일: {formatDateTime(resume.createdAt)}</span>
          <span>수정일: {formatDateTime(resume.updatedAt)}</span>
          {resume.resumeJobCategory && (
            <span>
              {resume.resumeJobCategory.emoji} {resume.resumeJobCategory.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleActive}
          disabled={isToggling}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold border border-[#E5E7EB] rounded-lg px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-[#374151] disabled:opacity-50"
        >
          {resume.isActive ? <PowerOff size={13} /> : <Power size={13} />}
          {resume.isActive ? "비활성화" : "활성화"}
        </button>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold border border-[#0991B2] text-[#0991B2] rounded-lg px-3 py-2 hover:bg-[#E6F7FA] transition-colors"
        >
          <Edit2 size={13} /> 수정
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold border border-[#FECACA] text-[#DC2626] rounded-lg px-3 py-2 hover:bg-[#FEF2F2] transition-colors"
        >
          <Trash2 size={13} /> 삭제
        </button>
      </div>
    </div>
  );
}
