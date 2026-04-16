import { useEffect, useState } from "react";
import { useInterviewSetupStore } from "@/features/interview-setup";
import { StepLayout } from "@/shared/ui/StepLayout";
import { ResumeSection } from "./ResumeSection";
import { JdSection } from "./JdSection";
import { InterviewModeSection } from "./InterviewModeSection";
import { DifficultySection } from "./DifficultySection";

type SetupStep = 1 | 2;

const navBtnCls = "flex-1 text-center py-[13px] rounded-lg font-bold text-[13px] cursor-pointer transition-all";
const prevCls = `${navBtnCls} text-[#6B7280] bg-transparent border border-[#E5E7EB] hover:bg-[#F9FAFB]`;
const nextCls = `${navBtnCls} text-white bg-[#0A0A0A] border-none shadow-[0_4px_6px_rgba(0,0,0,0.07)] hover:enabled:opacity-[.88] disabled:bg-[#D1D5DB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed`;

export function InterviewSetupPage() {
  const [step, setStep] = useState<SetupStep>(1);
  const {
    jdList, jdListLoading, selectedJdId,
    interviewMode, practiceMode, interviewDifficultyLevel,
    loadJdList, selectJd,
    setInterviewMode, setPracticeMode, setInterviewDifficultyLevel,
    resumes, selectedResumeUuid, resumesLoading, resumesError,
    creatingSession, createError,
    fetchResumes, selectResume, createSession, resetSetup,
  } = useInterviewSetupStore();

  useEffect(() => {
    loadJdList();
    fetchResumes();
    resetSetup();
  }, [loadJdList, fetchResumes, resetSetup]);

  const handleStartInterview = async () => {
    const session = await createSession();
    if (session) {
      window.open(`/interview/precheck/${session.uuid}`, "_blank");
    }
  };

  const canProceedStep1 = !!selectedResumeUuid && !!selectedJdId;

  return (
    <div>
      <div className="w-full px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        <div className="mb-8 pb-6 border-b border-[#E5E7EB]">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.4px] uppercase text-[#0991B2] bg-[#E6F7FA] py-1 px-3 rounded-full mb-2.5">▶ 면접 시작</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-black tracking-[-0.8px] text-[#0A0A0A] leading-[1.1]">가상 면접 설정</h1>
          <p className="text-sm text-[#6B7280] mt-1.5">채용공고와 면접 방식을 선택하고 맞춤 가상 면접을 시작하세요.</p>
        </div>

        {/* ══════ STEP 1: 지원 컨텍스트 ══════ */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <div className="text-[11px] font-bold tracking-[.1em] uppercase text-[#0991B2] mb-2">STEP 1</div>
              <h2 className="text-[20px] font-black tracking-[-0.3px] mb-1">면접을 연습할 이력서와 채용공고를 선택해주세요.</h2>
            </div>

            <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1 mb-6" style={{ gridTemplateRows: "1fr" }}>
              <div className="flex flex-col min-h-[400px] max-h-[520px]">
                <ResumeSection
                  resumes={resumes}
                  selectedResumeUuid={selectedResumeUuid}
                  resumesLoading={resumesLoading}
                  resumesError={resumesError}
                  onSelectResume={selectResume}
                />
              </div>
              <div className="flex flex-col min-h-[400px] max-h-[520px]">
                <JdSection
                  jdList={jdList}
                  jdListLoading={jdListLoading}
                  selectedJdId={selectedJdId}
                  onSelectJd={selectJd}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button disabled={!canProceedStep1} onClick={() => setStep(2)} className={`${nextCls} max-w-[200px]`}>
                다음 →
              </button>
            </div>
          </>
        )}

        {/* ══════ STEP 2: 면접 방식 ══════ */}
        {step === 2 && (
          <>
            <StepLayout
              stepLabel="STEP 2"
              title="면접 방식을 선택하세요"
              description="면접 유형, 진행 모드, 난이도를 선택합니다."
              left={
                <InterviewModeSection
                  interviewMode={interviewMode}
                  practiceMode={practiceMode}
                  onModeChange={setInterviewMode}
                  onPracticeModeChange={setPracticeMode}
                />
              }
              right={
                <>
                  <DifficultySection
                    interviewDifficultyLevel={interviewDifficultyLevel}
                    onDifficultyChange={setInterviewDifficultyLevel}
                  />
                  {createError && (
                    <div className="p-2.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[12px] text-[#B91C1C]">{createError}</div>
                  )}
                </>
              }
            />
            <div className="flex justify-between gap-3 mt-6">
              <button onClick={() => setStep(1)} className={`${prevCls} max-w-[200px]`}>← 이전</button>
              <button
                disabled={creatingSession || !selectedResumeUuid || !selectedJdId}
                onClick={handleStartInterview}
                className={`${nextCls} max-w-[200px]`}
              >
                {creatingSession ? "생성 중..." : "면접 시작"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
