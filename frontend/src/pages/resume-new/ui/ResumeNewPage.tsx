import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, PencilLine } from "lucide-react";
import { resumeApi } from "@/features/resume";
import { ResumeTextForm } from "./ResumeTextForm";
import { ResumeFileForm } from "./ResumeFileForm";

type Mode = "text" | "file";

export function ResumeNewPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("text");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitText = async (title: string, content: string) => {
    setIsSubmitting(true); setError(null);
    try {
      await resumeApi.createText(title, content);
      navigate("/resume");
    } catch { setError("저장에 실패했어요. 다시 시도해주세요."); }
    finally { setIsSubmitting(false); }
  };

  const handleSubmitFile = async (title: string, file: File, onProgress: (p: number) => void) => {
    setIsSubmitting(true); setError(null);
    try {
      await resumeApi.createFile(title, file, onProgress);
      navigate("/resume");
    } catch { setError("업로드에 실패했어요. 다시 시도해주세요."); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-container-md mx-auto px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        <div className="mb-6">
          <h1 className="text-[clamp(24px,3vw,32px)] font-black tracking-[-0.5px] text-[#0A0A0A]">이력서 추가하기</h1>
          <p className="text-sm text-[#6B7280] mt-1.5">직접 입력하거나 파일을 업로드할 수 있어요.</p>
        </div>

        {/* Mode 탭 */}
        <div className="flex gap-2 mb-6 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-1">
          <ModeTab icon={<PencilLine size={14} />} label="직접 입력" active={mode === "text"} onClick={() => setMode("text")} />
          <ModeTab icon={<FileText size={14} />} label="파일 업로드" active={mode === "file"} onClick={() => setMode("file")} />
        </div>

        {error && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-lg p-3 text-sm">{error}</div>
        )}

        {mode === "text" && <ResumeTextForm onSubmit={handleSubmitText} isSubmitting={isSubmitting} />}
        {mode === "file" && <ResumeFileForm onSubmit={handleSubmitFile} isSubmitting={isSubmitting} />}
      </div>
    </div>
  );
}

interface ModeTabProps { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; }
function ModeTab({ icon, label, active, onClick }: ModeTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-bold text-[13px] transition-all ${
        active ? "bg-white text-[#0A0A0A] shadow-sm" : "text-[#6B7280] hover:text-[#0A0A0A]"
      }`}
    >
      {icon} {label}
    </button>
  );
}
