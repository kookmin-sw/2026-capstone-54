import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { resumeApi, type ResumeDetail } from "@/features/resume";
import { ResumeFilePreview } from "./ResumeFilePreview";

interface ResumeEditFileFormProps {
  resume: ResumeDetail;
  onSaved: (updated: ResumeDetail) => void;
}

export function ResumeEditFileForm({ resume, onSaved }: ResumeEditFileFormProps) {
  const [title, setTitle] = useState(resume.title);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = title !== resume.title || newFile !== null;

  const handleSave = async () => {
    setIsSaving(true); setError(null);
    try {
      const updated = await resumeApi.updateFile(
        resume.uuid,
        {
          title: title !== resume.title ? title : undefined,
          file: newFile ?? undefined,
        },
        setProgress,
      );
      onSaved(updated);
    } catch { setError("저장에 실패했어요."); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="flex flex-col gap-5">
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

      {/* 현재 파일 정보 */}
      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
        <div className="text-[11px] font-bold text-[#9CA3AF] uppercase mb-2">현재 파일</div>
        <div className="text-[13px] font-bold text-[#0A0A0A]">{resume.originalFilename ?? "-"}</div>
        <div className="text-[11px] text-[#6B7280] mt-1">
          {resume.fileSizeBytes ? `${(resume.fileSizeBytes / 1024).toFixed(1)} KB` : "-"}
          {resume.mimeType && <> · {resume.mimeType}</>}
        </div>
      </div>

      {/* 파일 교체 */}
      <div>
        <label className="text-[12px] font-semibold text-[#374151] mb-1.5 flex items-center gap-1.5">
          <RefreshCw size={12} /> 파일 교체 (선택)
        </label>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
          className="w-full text-[12px] text-[#6B7280] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-bold file:bg-[#0A0A0A] file:text-white"
        />
        {newFile && (
          <div className="text-[11px] text-[#059669] mt-1">
            새 파일: {newFile.name} ({(newFile.size / 1024).toFixed(1)} KB)
          </div>
        )}
      </div>

      {/* 파일 미리보기 */}
      <ResumeFilePreview
        fileUrl={resume.fileUrl}
        mimeType={resume.mimeType}
        originalFilename={resume.originalFilename}
        extractedText={resume.fileTextContent}
      />

      {isSaving && progress > 0 && (
        <div>
          <div className="text-[11px] text-[#6B7280] mb-1">업로드 중 · {progress}%</div>
          <div className="h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
            <div className="h-full bg-[#0991B2] transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

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
