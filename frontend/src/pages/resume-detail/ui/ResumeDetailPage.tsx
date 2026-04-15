/** 이력서 상세 페이지 — 정규화 sub-model 인라인 편집 + dirty/finalize 흐름. */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import {
  resumeApi,
  AnalysisProgress,
  ResumeStatusBadge,
  useResumeAnalysisSse,
  type ParsedData,
  type ResumeDetail,
} from "@/features/resume";
import { formatDateTime } from "@/shared/lib/format/date";
import { DirtyBanner } from "./DirtyBanner";
import { RawSourceDrawer } from "./RawSourceDrawer";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { SummarySection } from "./sections/SummarySection";
import { CareerMetaSection } from "./sections/CareerMetaSection";
import { JobCategorySection } from "./sections/JobCategorySection";
import { ExperiencesSection } from "./sections/ExperiencesSection";
import { EducationsSection } from "./sections/EducationsSection";
import { CertificationsSection } from "./sections/CertificationsSection";
import { AwardsSection } from "./sections/AwardsSection";
import { ProjectsSection } from "./sections/ProjectsSection";
import { LanguagesSpokenSection } from "./sections/LanguagesSpokenSection";
import { SkillsSection } from "./sections/SkillsSection";
import { IndustryDomainsSection } from "./sections/IndustryDomainsSection";
import { KeywordsSection } from "./sections/KeywordsSection";

const EMPTY_PARSED: ParsedData = {
  basicInfo: {},
  summary: "",
  skills: { technical: [], soft: [], tools: [], languages: [] },
  experiences: [],
  educations: [],
  certifications: [],
  awards: [],
  projects: [],
  languagesSpoken: [],
  totalExperienceYears: null,
  totalExperienceMonths: null,
  industryDomains: [],
  keywords: [],
  jobCategory: null,
};

export function ResumeDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [parsed, setParsed] = useState<ParsedData>(EMPTY_PARSED);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** retrieve 재시도 — 네트워크 일시적 실패나 백엔드 커밋 race 를 완충. */
  const retryRetrieve = async (resumeUuid: string, maxAttempts = 3): Promise<ResumeDetail> => {
    let lastErr: unknown;
    for (let i = 0; i < maxAttempts; i += 1) {
      try {
        return await resumeApi.retrieve(resumeUuid);
      } catch (e) {
        lastErr = e;
        if (i < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, 400 * (i + 1)));
        }
      }
    }
    throw lastErr;
  };

  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await resumeApi.retrieve(uuid);
        if (cancelled) return;
        setResume(data);
        setParsed({ ...EMPTY_PARSED, ...(data.parsedData ?? {}) } as ParsedData);
        setIsLoading(false);
        // 초기 응답이 completed/failed 지만 parsedData 가 비어 있으면 백엔드 커밋 race 의심 →
        // 한 번 더 재조회하여 stale snapshot 을 교정한다. SSE 는 terminal 이므로 구독하지 않는다.
        const isTerminal = data.analysisStatus === "completed" || data.analysisStatus === "failed";
        const parsedEmpty = !data.parsedData || Object.keys(data.parsedData).length === 0;
        if (isTerminal && parsedEmpty) {
          try {
            const fresh = await retryRetrieve(uuid);
            if (cancelled) return;
            setResume(fresh);
            setParsed({ ...EMPTY_PARSED, ...(fresh.parsedData ?? {}) } as ParsedData);
          } catch { /* 유지 */ }
        }
      } catch {
        if (!cancelled) {
          setError("이력서를 불러올 수 없어요.");
          setIsLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [uuid]);

  // 이미 terminal 상태면 SSE 연결 자체를 일으키지 않는다.
  const sseEnabled =
    !!resume && (resume.analysisStatus === "pending" || resume.analysisStatus === "processing");
  useResumeAnalysisSse({
    uuid,
    enabled: sseEnabled,
    onStatus: (evt) =>
      setResume((prev) =>
        prev ? { ...prev, analysisStatus: evt.analysis_status, analysisStep: evt.analysis_step } : prev,
      ),
    onTerminal: async () => {
      if (!uuid) return;
      try {
        const data = await retryRetrieve(uuid);
        setResume(data);
        setParsed({ ...EMPTY_PARSED, ...(data.parsedData ?? {}) } as ParsedData);
      } catch {
        setError("분석 결과를 불러오지 못했어요. 잠시 후 새로고침해 주세요.");
      }
    },
    onError: (err) => {
      // 재연결 한도 초과 또는 백엔드 error 이벤트 — 사용자에게 노출.
      setError(err.message || "분석 상태 구독에 실패했어요.");
    },
  });

  const handleFinalize = async () => {
    if (!resume || isFinalizing) return;
    setIsFinalizing(true);
    try {
      const updated = await resumeApi.finalize(resume.uuid);
      setResume(updated);
      setParsed({ ...EMPTY_PARSED, ...(updated.parsedData ?? {}) } as ParsedData);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleDelete = async () => {
    if (!resume) return;
    if (!confirm("이력서를 삭제하시겠습니까?")) return;
    await resumeApi.remove(resume.uuid);
    navigate("/resume");
  };

  // 섹션 변경 시 로컬 캐시 + dirty 플래그 갱신
  const markDirty = () => setResume((prev) => (prev ? { ...prev, isDirty: true } : prev));
  const updateParsed = (patch: Partial<ParsedData>) => {
    setParsed((p) => ({ ...p, ...patch }));
    markDirty();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#0991B2]" />
      </div>
    );
  }
  if (error || !resume) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[#DC2626] font-bold">{error ?? "이력서를 찾을 수 없어요."}</p>
      </div>
    );
  }

  const isProcessing =
    resume.analysisStatus === "processing" || resume.analysisStatus === "pending";

  return (
    <div className="bg-[#F9FAFB]">
      <div className="w-full px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        <button
          onClick={() => navigate("/resume")}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#0A0A0A] mb-5 transition-colors"
        >
          <ArrowLeft size={14} /> 목록으로
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-[clamp(22px,3vw,32px)] font-black tracking-[-0.5px] text-[#0A0A0A] leading-[1.2]">
                {resume.title}
              </h1>
              <ResumeStatusBadge status={resume.analysisStatus} />
              <span className="text-[10px] font-bold text-[#6B7280] bg-[#F3F4F6] rounded-full px-2 py-0.5">
                {resume.sourceMode}
              </span>
            </div>
            <div className="text-[12px] text-[#6B7280] flex items-center gap-3 flex-wrap">
              <span>생성일: {formatDateTime(resume.createdAt)}</span>
              {resume.lastFinalizedAt && (
                <span>최종 저장: {formatDateTime(resume.lastFinalizedAt)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold border border-[#FECACA] text-[#DC2626] rounded-lg px-3 py-2 hover:bg-[#FEF2F2] transition-colors"
            >
              <Trash2 size={13} /> 삭제
            </button>
          </div>
        </div>

        {isProcessing && (
          <div className="mb-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg p-4">
            <AnalysisProgress status={resume.analysisStatus} step={resume.analysisStep} />
          </div>
        )}

        {resume.isDirty && (
          <DirtyBanner isFinalizing={isFinalizing} onFinalize={handleFinalize} />
        )}

        <div className="flex flex-col gap-4">
          <BasicInfoSection
            resumeUuid={resume.uuid}
            value={parsed.basicInfo}
            onChange={(v) => updateParsed({ basicInfo: v })}
          />
          <SummarySection
            resumeUuid={resume.uuid}
            value={parsed.summary}
            onChange={(v) => updateParsed({ summary: v })}
          />
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <CareerMetaSection
              resumeUuid={resume.uuid}
              years={parsed.totalExperienceYears}
              months={parsed.totalExperienceMonths}
              onChange={(years, months) =>
                updateParsed({
                  totalExperienceYears: years,
                  totalExperienceMonths: months,
                })
              }
            />
            <JobCategorySection
              resumeUuid={resume.uuid}
              value={resume.resumeJobCategory}
              onChange={(c) => {
                setResume((prev) => (prev ? { ...prev, resumeJobCategory: c } : prev));
                markDirty();
              }}
            />
          </div>
          <ExperiencesSection
            resumeUuid={resume.uuid}
            items={parsed.experiences}
            onChange={(v) => updateParsed({ experiences: v })}
          />
          <EducationsSection
            resumeUuid={resume.uuid}
            items={parsed.educations}
            onChange={(v) => updateParsed({ educations: v })}
          />
          <CertificationsSection
            resumeUuid={resume.uuid}
            items={parsed.certifications}
            onChange={(v) => updateParsed({ certifications: v })}
          />
          <AwardsSection
            resumeUuid={resume.uuid}
            items={parsed.awards}
            onChange={(v) => updateParsed({ awards: v })}
          />
          <ProjectsSection
            resumeUuid={resume.uuid}
            items={parsed.projects}
            onChange={(v) => updateParsed({ projects: v })}
          />
          <LanguagesSpokenSection
            resumeUuid={resume.uuid}
            items={parsed.languagesSpoken}
            onChange={(v) => updateParsed({ languagesSpoken: v })}
          />
          <SkillsSection
            resumeUuid={resume.uuid}
            value={parsed.skills}
            onChange={(v) => updateParsed({ skills: v })}
          />
          <IndustryDomainsSection
            resumeUuid={resume.uuid}
            value={parsed.industryDomains}
            onChange={(v) => updateParsed({ industryDomains: v })}
          />
          <KeywordsSection
            resumeUuid={resume.uuid}
            value={parsed.keywords}
            onChange={(v) => updateParsed({ keywords: v })}
          />

          <RawSourceDrawer resume={resume} />
        </div>
      </div>
    </div>
  );
}
