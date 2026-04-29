import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileCheck, Loader2, Upload, XCircle } from "lucide-react";
import { resumeApi } from "@/features/resume";

export function FileUploadTab() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (f && f.type !== "application/pdf") {
      setError("PDF 파일만 업로드할 수 있어요.");
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 제목 */}
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold text-[#0A0A0A]">제목 <span className="text-[#DC2626]">*</span></span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 2026 홍길동 이력서"
          className="border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,0.1)] placeholder:text-[#9CA3AF]"
        />
      </label>

      {/* 파일 드롭존 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold text-[#0A0A0A]">PDF 파일 <span className="text-[#DC2626]">*</span></span>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 px-6 cursor-pointer transition-all select-none ${
            isDragging
              ? "border-[#0991B2] bg-[#E6F7FA]"
              : file
              ? "border-[#059669] bg-[#F0FDF4]"
              : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#0991B2] hover:bg-[#E6F7FA]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] flex items-center justify-center"><FileCheck size={24} className="text-[#059669]" /></div>
              <div className="text-center">
                <div className="text-[13px] font-extrabold text-[#059669]">{file.name}</div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-[11px] font-semibold text-[#6B7280] hover:text-[#DC2626] transition-colors"
              >
                파일 제거
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-[#E6F7FA] flex items-center justify-center"><Upload size={24} className="text-[#0991B2]" /></div>
              <div className="text-center">
                <div className="text-[13px] font-extrabold text-[#0A0A0A]">PDF 파일을 드래그하거나 클릭해서 선택</div>
                <div className="text-[11px] text-[#9CA3AF] mt-1">PDF 형식만 지원 · 최대 10MB</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 업로드 진행률 */}
      {progress > 0 && progress < 100 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px] text-[#6B7280]">
            <span>업로드 중...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#06B6D4] to-[#0991B2] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3.5 py-2.5">
          <XCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] rounded-lg py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {isSubmitting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M3.5 5.5L7 2l3.5 3.5M2 11h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {isSubmitting ? "업로드 중..." : "업로드 후 분석 시작"}
      </button>
    </form>
  );
}
