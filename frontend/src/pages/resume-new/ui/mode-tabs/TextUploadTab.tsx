import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2 } from "lucide-react";
import { resumeApi } from "@/features/resume";

export function TextUploadTab() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await resumeApi.createText(title, content);
      navigate(`/resume/${created.uuid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 실패");
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
        <span className="text-[12px] font-bold text-[#0A0A0A]">이력서 본문</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          placeholder="자유 형식 텍스트로 이력서 내용을 입력하세요. 분석 후 자동으로 정규화됩니다."
          className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] font-mono leading-[1.6]"
        />
      </label>
      {error && <div className="text-[12px] text-[#DC2626]">{error}</div>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 text-[13px] font-bold text-white bg-[#0991B2] rounded-lg py-3 disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        텍스트 저장 후 분석 시작
      </button>
    </form>
  );
}
