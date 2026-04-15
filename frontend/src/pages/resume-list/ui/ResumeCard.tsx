import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import {
  AnalysisProgress,
  ResumeStatusBadge,
  ResumeTypeIcon,
  type ResumeListItem,
} from "@/features/resume";
import { formatDateTime } from "@/shared/lib/format/date";

interface ResumeCardProps {
  resume: ResumeListItem;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ResumeCard({ resume, onDetail, onEdit, onDelete }: ResumeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const isProcessing = resume.analysisStatus === "processing" || resume.analysisStatus === "pending";

  return (
    <div
      onClick={onDetail}
      className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#0991B2] transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0">
          <ResumeTypeIcon type={resume.type} size={18} className="text-[#0991B2]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-[14px] font-bold text-[#0A0A0A] truncate">{resume.title}</h3>
            <ResumeStatusBadge status={resume.analysisStatus} />
          </div>
          <div className="text-[11px] text-[#6B7280]">
            {formatDateTime(resume.createdAt)}
            {resume.resumeJobCategory && <> · {resume.resumeJobCategory.emoji} {resume.resumeJobCategory.name}</>}
          </div>
        </div>

        {/* 컨텍스트 메뉴 */}
        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
            aria-label="메뉴 열기"
          >
            <MoreVertical size={16} className="text-[#6B7280]" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+4px)] bg-white border border-[#E5E7EB] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.1)] min-w-[150px] overflow-hidden z-10">
              <MenuItem icon={<Edit2 size={13} />} label="수정하기" onClick={() => { setMenuOpen(false); onEdit(); }} />
              <MenuItem icon={<Trash2 size={13} />} label="삭제하기" danger onClick={() => { setMenuOpen(false); onDelete(); }} />
            </div>
          )}
        </div>
      </div>

      {/* 분석 진행 상태 */}
      {isProcessing && (
        <AnalysisProgress status={resume.analysisStatus} step={resume.analysisStep} />
      )}
    </div>
  );
}

function MenuItem({
  icon, label, onClick, danger,
}: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 py-2.5 px-3.5 text-[13px] font-semibold text-left transition-colors hover:bg-[#F9FAFB] ${danger ? "text-[#DC2626]" : "text-[#374151]"}`}
    >
      {icon} {label}
    </button>
  );
}
