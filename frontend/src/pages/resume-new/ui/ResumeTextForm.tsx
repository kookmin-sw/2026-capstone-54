import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ResumeTemplatePicker } from "./ResumeTemplatePicker";

interface ResumeTextFormProps {
  onSubmit: (title: string, content: string) => Promise<void>;
  isSubmitting: boolean;
  initialTitle?: string;
  initialContent?: string;
  submitLabel?: string;
}

export function ResumeTextForm({
  onSubmit, isSubmitting, initialTitle = "", initialContent = "", submitLabel = "이력서 저장하기",
}: ResumeTextFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  const handleTemplateSelect = (templateContent: string) => {
    setContent(templateContent);
  };

  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !isSubmitting;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">이력서 제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="예: 2025 프론트엔드 지원용"
          className="w-full py-3 px-4 rounded-lg border-[1.5px] border-[#E5E7EB] bg-white text-[14px] text-[#0A0A0A] outline-none transition-colors focus:border-[#0991B2]"
        />
      </div>

      <ResumeTemplatePicker onSelect={handleTemplateSelect} />

      <div>
        <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">이력서 내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="자기소개, 기술 스택, 경력, 프로젝트 등을 자유롭게 작성해주세요."
          rows={16}
          className="w-full py-3 px-4 rounded-lg border-[1.5px] border-[#E5E7EB] bg-white text-[14px] text-[#0A0A0A] outline-none transition-colors focus:border-[#0991B2] leading-[1.6] font-mono resize-y"
        />
        <div className="text-[11px] text-[#9CA3AF] mt-1 text-right">{content.length}자</div>
      </div>

      <button
        onClick={() => onSubmit(title, content)}
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-lg font-bold text-[14px] text-white bg-[#0A0A0A] hover:enabled:opacity-85 disabled:bg-[#D1D5DB] disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? "저장 중..." : submitLabel}
      </button>
    </div>
  );
}
