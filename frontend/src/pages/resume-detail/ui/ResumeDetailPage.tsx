import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  resumeApi,
  AnalysisProgress,
  useResumeAnalysisSse,
  type ResumeDetail,
} from "@/features/resume";
import { ResumeDetailHeader } from "./ResumeDetailHeader";
import { ResumeTextContentSection } from "./ResumeTextContentSection";
import { ResumeFileSection } from "./ResumeFileSection";
import { ResumeParsedSection } from "./ResumeParsedSection";

/**
 * 이력서 상세 조회 페이지 (읽기 전용).
 *
 * 역할:
 * - 상세 데이터 fetch / 새로고침
 * - 분석 진행 중 SSE 구독 → 상태 실시간 반영, 완료 시 전체 재조회
 * - 활성/비활성 토글 / 삭제 등 메타 액션
 * - 레이아웃만 조립 — 각 섹션은 하위 컴포넌트가 담당한다.
 */
export function ResumeDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!uuid) return;
    resumeApi
      .retrieve(uuid)
      .then((data) => {
        setResume(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError("이력서를 불러올 수 없어요.");
        setIsLoading(false);
      });
  }, [uuid]);

  // 분석 진행 중에만 SSE 구독 → 상태 실시간 반영, 완료/실패 이벤트 시 전체 상세 재조회.
  const sseEnabled =
    !!resume && (resume.analysisStatus === "pending" || resume.analysisStatus === "processing");
  useResumeAnalysisSse({
    uuid,
    enabled: sseEnabled,
    onStatus: (evt) =>
      setResume((prev) =>
        prev
          ? { ...prev, analysisStatus: evt.analysis_status, analysisStep: evt.analysis_step }
          : prev,
      ),
    onTerminal: () => {
      if (!uuid) return;
      resumeApi.retrieve(uuid).then(setResume).catch(() => {});
    },
  });

  const handleToggleActive = async () => {
    if (!resume || isToggling) return;
    setIsToggling(true);
    try {
      const updated = resume.isActive
        ? await resumeApi.deactivate(resume.uuid)
        : await resumeApi.activate(resume.uuid);
      setResume((prev) => (prev ? { ...prev, isActive: updated.isActive } : prev));
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!resume) return;
    if (!confirm("이력서를 삭제하시겠습니까?")) return;
    await resumeApi.remove(resume.uuid);
    navigate("/resume");
  };

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

  const isProcessing =
    resume.analysisStatus === "processing" || resume.analysisStatus === "pending";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-container-lg mx-auto px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        <button
          onClick={() => navigate("/resume")}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#0A0A0A] mb-5 transition-colors"
        >
          <ArrowLeft size={14} /> 목록으로
        </button>

        <ResumeDetailHeader
          resume={resume}
          isToggling={isToggling}
          onToggleActive={handleToggleActive}
          onEdit={() => navigate(`/resume/edit/${resume.uuid}`)}
          onDelete={handleDelete}
        />

        {isProcessing && (
          <div className="mb-6 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg p-4">
            <AnalysisProgress status={resume.analysisStatus} step={resume.analysisStep} />
          </div>
        )}

        <div className="flex flex-col gap-6">
          {resume.type === "text" && resume.content && (
            <ResumeTextContentSection content={resume.content} />
          )}

          {resume.type === "file" && <ResumeFileSection resume={resume} />}

          <ResumeParsedSection
            data={resume.isParsed ? resume.parsedData : null}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}
