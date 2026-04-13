import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import {
  resumeApi,
  AnalysisProgress,
  type ResumeDetail,
} from "@/features/resume";
import { ResumeEditTextForm } from "./ResumeEditTextForm";
import { ResumeEditFileForm } from "./ResumeEditFileForm";

export function ResumeEditPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) return;
    resumeApi.retrieve(uuid)
      .then(setResume)
      .catch(() => setError("이력서를 불러올 수 없어요."))
      .finally(() => setIsLoading(false));
  }, [uuid]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0991B2]" />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#DC2626] font-bold">{error ?? "이력서를 찾을 수 없어요."}</p>
      </div>
    );
  }

  const isProcessing = resume.analysisStatus === "processing" || resume.analysisStatus === "pending";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-container-lg mx-auto px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate(`/resume/${uuid}`)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#0A0A0A] mb-5 transition-colors"
        >
          <ArrowLeft size={14} /> 상세보기로
        </button>

        <div className="mb-6">
          <h1 className="text-[clamp(24px,3vw,32px)] font-black tracking-[-0.5px] text-[#0A0A0A]">이력서 수정</h1>
          <p className="text-sm text-[#6B7280] mt-1.5">제목, 내용 또는 파일을 변경할 수 있어요.</p>
        </div>

        {/* 재분석 경고 */}
        <div className="mb-6 bg-[#FFF7ED] border border-[#FED7AA] rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#D97706] shrink-0 mt-0.5" />
          <div className="text-[12px] text-[#7C2D12] leading-[1.5]">
            <strong className="font-bold">내용이나 파일을 수정하면 AI 분석이 처음부터 다시 진행됩니다.</strong>
            <br />
            기존 분석 결과는 새 결과로 덮어씌워져요.
          </div>
        </div>

        {/* 분석 진행 상태 */}
        {isProcessing && (
          <div className="mb-6 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg p-4">
            <AnalysisProgress status={resume.analysisStatus} step={resume.analysisStep} />
          </div>
        )}

        <div>
          {resume.type === "text" && (
            <ResumeEditTextForm
              resume={resume}
              onSaved={(updated) => { setResume(updated); navigate(`/resume/${uuid}`); }}
            />
          )}
          {resume.type === "file" && (
            <ResumeEditFileForm
              resume={resume}
              onSaved={(updated) => { setResume(updated); navigate(`/resume/${uuid}`); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
