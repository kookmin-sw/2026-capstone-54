import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Edit2, Trash2, Power, PowerOff, Download, FileText } from "lucide-react";
import {
  resumeApi,
  AnalysisProgress,
  ParsedDataView,
  ResumeStatusBadge,
  useResumeAnalysisSse,
  type ResumeDetail,
} from "@/features/resume";
import { formatDateTime } from "@/shared/lib/format/date";

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
      .then((data) => { setResume(data); setIsLoading(false); })
      .catch(() => { setError("이력서를 불러올 수 없어요."); setIsLoading(false); });
  }, [uuid]);

  // 분석이 진행 중인 동안 SSE 로 상태 변경을 실시간 반영한다.
  // pending/processing 단계에서만 구독하며, completed/failed 이벤트 도달 시
  // 전체 상세(parsedData 포함)를 한 번 더 가져와 본문을 갱신한다.
  const sseEnabled =
    !!resume &&
    (resume.analysisStatus === "pending" || resume.analysisStatus === "processing");
  useResumeAnalysisSse({
    uuid,
    enabled: sseEnabled,
    onStatus: (evt) => {
      setResume((prev) =>
        prev
          ? {
              ...prev,
              analysisStatus: evt.analysis_status,
              analysisStep: evt.analysis_step,
            }
          : prev,
      );
    },
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
      setResume((prev) => prev ? { ...prev, isActive: updated.isActive } : prev);
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

  const fileSizeLabel = resume.fileSizeBytes
    ? resume.fileSizeBytes >= 1024 * 1024
      ? `${(resume.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(resume.fileSizeBytes / 1024)} KB`
    : null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-container-lg mx-auto px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate("/resume")}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#0A0A0A] mb-5 transition-colors"
        >
          <ArrowLeft size={14} /> 목록으로
        </button>

        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-[clamp(22px,3vw,32px)] font-black tracking-[-0.5px] text-[#0A0A0A] leading-[1.2]">
                {resume.title}
              </h1>
              <ResumeStatusBadge status={resume.analysisStatus} isActive={resume.isActive} />
            </div>
            <div className="text-[12px] text-[#6B7280] flex items-center gap-3 flex-wrap">
              <span>생성일: {formatDateTime(resume.createdAt)}</span>
              <span>수정일: {formatDateTime(resume.updatedAt)}</span>
              {resume.jobCategory && (
                <span>{resume.jobCategory.emoji} {resume.jobCategory.name}</span>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleActive}
              disabled={isToggling}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold border border-[#E5E7EB] rounded-lg px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-[#374151] disabled:opacity-50"
            >
              {resume.isActive ? <PowerOff size={13} /> : <Power size={13} />}
              {resume.isActive ? "비활성화" : "활성화"}
            </button>
            <button
              onClick={() => navigate(`/resume/edit/${resume.uuid}`)}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold border border-[#0991B2] text-[#0991B2] rounded-lg px-3 py-2 hover:bg-[#E6F7FA] transition-colors"
            >
              <Edit2 size={13} /> 수정
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold border border-[#FECACA] text-[#DC2626] rounded-lg px-3 py-2 hover:bg-[#FEF2F2] transition-colors"
            >
              <Trash2 size={13} /> 삭제
            </button>
          </div>
        </div>

        {/* 분석 진행 상태 */}
        {isProcessing && (
          <div className="mb-6 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg p-4">
            <AnalysisProgress status={resume.analysisStatus} step={resume.analysisStep} />
          </div>
        )}

        {/* 본문 */}
        <div className="flex flex-col gap-6">
          {/* 텍스트 이력서 본문 */}
          {resume.type === "text" && resume.content && (
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-6">
              <h2 className="text-[13px] font-extrabold text-[#0A0A0A] mb-3">이력서 본문</h2>
              <pre className="text-[13px] text-[#374151] leading-[1.7] whitespace-pre-wrap font-sans">
                {resume.content}
              </pre>
            </div>
          )}

          {/* 파일 이력서 정보 */}
          {resume.type === "file" && (
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-6">
              <h2 className="text-[13px] font-extrabold text-[#0A0A0A] mb-3">첨부 파일</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center">
                  <FileText size={18} className="text-[#0991B2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-[#0A0A0A] truncate">
                    {resume.originalFilename ?? "파일"}
                  </div>
                  {fileSizeLabel && (
                    <div className="text-[11px] text-[#6B7280]">{fileSizeLabel}</div>
                  )}
                </div>
                {resume.fileUrl && (
                  <a
                    href={resume.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold border border-[#0991B2] text-[#0991B2] rounded-lg px-3 py-2 hover:bg-[#E6F7FA] transition-colors"
                  >
                    <Download size={13} /> 다운로드
                  </a>
                )}
              </div>

              {/* 파일 추출 텍스트 미리보기 */}
              {resume.fileTextContent && (
                <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                  <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-2">
                    추출된 텍스트 미리보기
                  </h3>
                  <pre className="text-[12px] text-[#374151] leading-[1.6] whitespace-pre-wrap font-sans max-h-[300px] overflow-y-auto">
                    {resume.fileTextContent}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* AI 분석 결과 */}
          {resume.isParsed && resume.parsedData ? (
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-6">
              <h2 className="text-[13px] font-extrabold text-[#0A0A0A] mb-4">AI 분석 결과</h2>
              <ParsedDataView data={resume.parsedData} />
            </div>
          ) : !isProcessing && (
            <div className="bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-lg p-8 text-center">
              <p className="text-[13px] text-[#9CA3AF]">분석이 완료되면 여기에 결과가 표시돼요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
