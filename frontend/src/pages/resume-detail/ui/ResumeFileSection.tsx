import { Download, FileText } from "lucide-react";
import type { ResumeDetail } from "@/features/resume";

interface ResumeFileSectionProps {
  resume: ResumeDetail;
}

/** 파일 이력서 섹션: 파일 메타 / 다운로드 / 추출 텍스트 미리보기. */
export function ResumeFileSection({ resume }: ResumeFileSectionProps) {
  const fileSizeLabel = formatFileSize(resume.fileSizeBytes);

  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-6">
      <h2 className="text-[13px] font-extrabold text-[#0A0A0A] mb-3">첨부 파일</h2>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center">
          <FileText size={18} className="text-[#0991B2]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-[#0A0A0A] truncate">
            {resume.originalFilename ?? "파일"}
          </div>
          {fileSizeLabel && <div className="text-[11px] text-[#6B7280]">{fileSizeLabel}</div>}
        </div>
        {resume.fileUrl && (
          <a
            href={resume.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold border border-[#0991B2] text-[#0991B2] rounded-lg px-3 py-2 hover:bg-[#E6F7FA] transition-colors"
          >
            <Download size={13} /> 다운로드
          </a>
        )}
      </div>

      {resume.fileTextContent && (
        <div className="mt-4 border-t border-[#E5E7EB] pt-4">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-2">
            추출된 텍스트 미리보기
          </h3>
          <pre className="text-[12px] text-[#374151] leading-[1.6] whitespace-pre-wrap font-sans max-h-[300px] overflow-y-auto">
            {resume.fileTextContent}
          </pre>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number | null): string | null {
  if (!bytes) return null;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}
