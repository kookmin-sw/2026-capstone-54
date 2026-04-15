import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2 } from "lucide-react";
import { resumeApi } from "@/features/resume";

export function FileUploadTab() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError("제목과 파일을 모두 입력해주세요.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await resumeApi.createFile(title, file, setProgress);
      navigate(`/resume/${created.uuid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold text-[#0A0A0A]">제목</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 2026 백엔드 개발자 이력서"
          className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px]"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold text-[#0A0A0A]">PDF 파일</span>
        <div className="flex items-center gap-3 border border-dashed border-[#E5E7EB] rounded-lg p-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-[12px]"
          />
          {file && <span className="text-[11px] text-[#6B7280]">{file.name}</span>}
        </div>
      </label>
      {progress > 0 && progress < 100 && (
        <div className="text-[11px] text-[#6B7280]">업로드 {progress}%</div>
      )}
      {error && <div className="text-[12px] text-[#DC2626]">{error}</div>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 text-[13px] font-bold text-white bg-[#0991B2] rounded-lg py-3 disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        업로드 후 분석 시작
      </button>
    </form>
  );
}
