/** 파일 이력서 미리보기. 추출된 텍스트 + 브라우저 PDF 렌더링. */
import { useState } from "react";
import { FileText, Eye } from "lucide-react";

interface ResumeFilePreviewProps {
  fileUrl: string | null;
  mimeType: string | null;
  originalFilename: string | null;
  extractedText: string | null;
}

type Tab = "text" | "browser";

export function ResumeFilePreview({ fileUrl, mimeType, originalFilename, extractedText }: ResumeFilePreviewProps) {
  const [tab, setTab] = useState<Tab>("text");
  const isPdf = mimeType === "application/pdf" || originalFilename?.toLowerCase().endsWith(".pdf");

  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg overflow-hidden">
      {/* 탭 헤더 */}
      <div className="flex border-b border-[#E5E7EB] bg-white">
        <TabButton icon={<FileText size={13} />} label="추출 텍스트" active={tab === "text"} onClick={() => setTab("text")} />
        {isPdf && fileUrl && (
          <TabButton icon={<Eye size={13} />} label="파일 보기" active={tab === "browser"} onClick={() => setTab("browser")} />
        )}
      </div>

      {/* 내용 */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {tab === "text" && (
          extractedText ? (
            <pre className="text-[12px] text-[#374151] leading-[1.6] whitespace-pre-wrap font-sans">{extractedText}</pre>
          ) : (
            <p className="text-[12px] text-[#9CA3AF] italic">추출된 텍스트가 없어요.</p>
          )
        )}
        {tab === "browser" && fileUrl && (
          <iframe
            src={fileUrl}
            title={originalFilename ?? "이력서 파일"}
            className="w-full min-h-[400px] border-0"
          />
        )}
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold border-b-2 transition-colors ${
        active ? "border-[#0991B2] text-[#0991B2]" : "border-transparent text-[#6B7280] hover:text-[#0A0A0A]"
      }`}
    >
      {icon} {label}
    </button>
  );
}
