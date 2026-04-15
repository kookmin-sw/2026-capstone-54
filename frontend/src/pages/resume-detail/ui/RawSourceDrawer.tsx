/** 원본(raw) text/file 콘텐츠를 보조적으로 보여주는 드로어. */

import { useState } from "react";
import { ChevronDown, ChevronUp, Download, FileText } from "lucide-react";
import type { ResumeDetail } from "@/features/resume";

interface RawSourceDrawerProps {
  resume: ResumeDetail;
}

export function RawSourceDrawer({ resume }: RawSourceDrawerProps) {
  const [open, setOpen] = useState(false);

  if (resume.type === "structured") {
    // structured 모드는 raw 가 없음
    return null;
  }

  return (
    <section className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2 text-[13px] font-bold text-[#0A0A0A]">
          <FileText size={14} className="text-[#6B7280]" />
          원본 보기 ({resume.type === "file" ? "파일" : "텍스트"})
        </div>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="border-t border-[#E5E7EB] p-4">
          {resume.type === "file" ? (
            <div className="space-y-3">
              <div className="text-[12px] text-[#374151]">
                <strong>파일명:</strong> {resume.originalFilename ?? "-"}
              </div>
              {resume.fileUrl && (
                <a
                  href={resume.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold border border-[#0991B2] text-[#0991B2] rounded px-3 py-1.5 hover:bg-[#E6F7FA]"
                >
                  <Download size={12} /> 원본 다운로드
                </a>
              )}
              {resume.fileTextContent && (
                <pre className="text-[11px] text-[#374151] leading-[1.5] whitespace-pre-wrap font-sans max-h-[300px] overflow-y-auto bg-white border border-[#E5E7EB] rounded p-3">
                  {resume.fileTextContent}
                </pre>
              )}
            </div>
          ) : (
            <pre className="text-[12px] text-[#374151] leading-[1.6] whitespace-pre-wrap font-sans max-h-[400px] overflow-y-auto bg-white border border-[#E5E7EB] rounded p-3">
              {resume.content ?? "(원본이 없습니다)"}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
