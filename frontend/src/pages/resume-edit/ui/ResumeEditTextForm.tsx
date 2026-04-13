import { useState } from "react";
import { Loader2 } from "lucide-react";
import { resumeApi, type ResumeDetail } from "@/features/resume";

interface ResumeEditTextFormProps {
  resume: ResumeDetail;
  onSaved: (updated: ResumeDetail) => void;
}

export function ResumeEditTextForm({ resume, onSaved }: ResumeEditTextFormProps) {
  const [title, setTitle] = useState(resume.title);
  const [content, setContent] = useState(resume.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = title !== resume.title || content !== (resume.content ?? "");

  const handleSave = async () => {
    setIsSaving(true); setError(null);
    try {
      const updated = await resumeApi.updateText(resume.uuid, {
        title: title !== resume.title ? title : undefined,
        content: content !== (resume.content ?? "") ? content : undefined,
      });
      onSaved(updated);
    } catch { setError("저장에 실패했어요."); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">이력서 제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          className="w-full py-3 px-4 rounded-lg border-[1.5px] border-[#E5E7EB] bg-white text-[14px] text-[#0A0A0A] outline-none focus:border-[#0991B2]"
        />
      </div>

      <div>
        <label className="text-[12px] font-semibold text-[#374151] mb-1.5 block">이력서 내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={18}
          className="w-full py-3 px-4 rounded-lg border-[1.5px] border-[#E5E7EB] bg-white text-[14px] text-[#0A0A0A] outline-none focus:border-[#0991B2] leading-[1.6] font-mono resize-y"
        />
        <div className="text-[11px] text-[#9CA3AF] mt-1 text-right">{content.length}자</div>
      </div>

      {error && <div className="text-[12px] text-[#DC2626] font-semibold">{error}</div>}

      <button
        onClick={handleSave}
        disabled={!isDirty || isSaving}
        className="w-full py-3.5 rounded-lg font-bold text-[14px] text-white bg-[#0A0A0A] hover:enabled:opacity-85 disabled:bg-[#D1D5DB] disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSaving && <Loader2 size={16} className="animate-spin" />}
        {isSaving ? "저장 중..." : "변경사항 저장"}
      </button>
    </div>
  );
}
