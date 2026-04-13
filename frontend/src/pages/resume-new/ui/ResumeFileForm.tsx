import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";

interface ResumeFileFormProps {
  onSubmit: (title: string, file: File, onProgress: (p: number) => void) => Promise<void>;
  isSubmitting: boolean;
  submitLabel?: string;
}

const MAX_SIZE_MB = 10;
const ACCEPT = ".pdf,.docx";

export function ResumeFileForm({ onSubmit, isSubmitting, submitLabel = "이력서 업로드하기" }: ResumeFileFormProps) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (f: File) => {
    setError(null);
    const ext = f.name.toLowerCase().split(".").pop();
    if (ext !== "pdf" && ext !== "docx") {
      setError("PDF 또는 DOCX 파일만 업로드할 수 있어요.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 해요.`);
      return;
    }
    setFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.(pdf|docx)$/i, ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleSelect(f);
  };

  const canSubmit = title.trim().length > 0 && file !== null && !isSubmitting;

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

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-lg border-[1.5px] border-dashed p-8 cursor-pointer transition-colors ${
          dragOver ? "border-[#0991B2] bg-[#E6F7FA]" : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#0991B2]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleSelect(e.target.files[0])}
        />
        {!file ? (
          <div className="text-center">
            <Upload size={28} className="text-[#9CA3AF] mx-auto mb-2" />
            <p className="text-[13px] font-bold text-[#0A0A0A]">파일을 끌어다 놓거나 클릭해 선택하세요</p>
            <p className="text-[11px] text-[#6B7280] mt-1">PDF, DOCX · 최대 {MAX_SIZE_MB}MB</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0">
              <Upload size={16} className="text-[#0991B2]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-[#0A0A0A] truncate">{file.name}</p>
              <p className="text-[11px] text-[#6B7280]">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white"
            >
              <X size={14} className="text-[#6B7280]" />
            </button>
          </div>
        )}
      </div>

      {error && <div className="text-[12px] text-[#DC2626] font-semibold">{error}</div>}

      {isSubmitting && progress > 0 && (
        <div>
          <div className="text-[11px] text-[#6B7280] mb-1">업로드 중 · {progress}%</div>
          <div className="h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
            <div className="h-full bg-[#0991B2] transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <button
        onClick={() => file && onSubmit(title, file, setProgress)}
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-lg font-bold text-[14px] text-white bg-[#0A0A0A] hover:enabled:opacity-85 disabled:bg-[#D1D5DB] disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? "업로드 중..." : submitLabel}
      </button>
    </div>
  );
}
