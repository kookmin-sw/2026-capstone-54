import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePrecheckStore } from "@/features/interview-precheck";
import { useInterviewSetupStore } from "@/features/interview-setup";
import { interviewApi } from "@/features/interview-session";
import { StepIndicator } from "@/shared/ui/StepIndicator";
import { StepCameraMic } from "./StepCameraMic";
import { StepBrowserEnv } from "./StepBrowserEnv";
import { StepVoiceCheck } from "./StepVoiceCheck";

type WizardStep = 1 | 2 | 3;

export function InterviewPreCheckPage() {
  const {
    cameraStatus, micStatus, networkStatus, gpuStatus,
    cameraInfo, micInfo, gpuInfo,
    micLevel, networkProgress, networkSpeed, networkLatency,
    cameraStream, allPassed,
    startChecks, stopMicTimer,
  } = usePrecheckStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const {
    interviewDifficultyLevel, practiceMode,
    pendingResumeUuid, pendingUserJobDescriptionUuid,
    getInterviewSessionType,
  } = useInterviewSetupStore();

  const [step, setStep] = useState<WizardStep>(1);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    startChecks();
    return () => { stopMicTimer(); };
  }, [startChecks, stopMicTimer]);

  const step1Checked = cameraStatus !== "idle" && cameraStatus !== "checking" && micStatus !== "idle" && micStatus !== "checking";
  const step1Ok = step1Checked && cameraStatus === "ok" && micStatus === "ok";
  const step2Checked = networkStatus !== "idle" && networkStatus !== "checking" && gpuStatus !== "idle" && gpuStatus !== "checking";
  const step2Ok = step2Checked && networkStatus === "ok";

  const handleStartInterview = async () => {
    setIsCreating(true); setCreateError(null);
    try {
      const session = await interviewApi.createInterviewSession({
        resume_uuid: pendingResumeUuid ?? "00000000-0000-0000-0000-000000000000",
        user_job_description_uuid: pendingUserJobDescriptionUuid ?? "00000000-0000-0000-0000-000000000000",
        interview_session_type: getInterviewSessionType(),
        interview_difficulty_level: interviewDifficultyLevel,
        interview_practice_mode: practiceMode,
      });
      navigate(`/interview/session/${session.uuid}`);
    } catch { setCreateError("면접 세션 생성에 실패했습니다. 다시 시도해주세요."); }
    finally { setIsCreating(false); }
  };

  const mainSteps = [
    { label: "지원 컨텍스트", state: "done" as const },
    { label: "면접 방식", state: "done" as const },
    { label: "환경 점검", state: "active" as const },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-container-lg mx-auto px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[clamp(22px,2.5vw,30px)] font-black tracking-[-0.5px] mb-1.5">환경을 점검해요</h1>
          <p className="text-sm text-[#6B7280]">카메라, 마이크, 네트워크, 음성을 자동으로 점검합니다.</p>
        </div>

        <StepIndicator steps={mainSteps} className="mb-8" />

        {step === 1 && (
          <StepCameraMic
            cameraStatus={cameraStatus} micStatus={micStatus}
            cameraInfo={cameraInfo} micInfo={micInfo} micLevel={micLevel}
            cameraStream={cameraStream} videoRef={videoRef}
            step1Checked={step1Checked} step1Ok={step1Ok}
            onNext={() => setStep(2)} onBack={() => history.back()}
          />
        )}

        {step === 2 && (
          <StepBrowserEnv
            networkStatus={networkStatus} gpuStatus={gpuStatus} gpuInfo={gpuInfo}
            networkLatency={networkLatency} networkProgress={networkProgress} networkSpeed={networkSpeed}
            step2Checked={step2Checked} step2Ok={step2Ok}
            onNext={() => setStep(3)} onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepVoiceCheck
            practiceMode={practiceMode} allPassed={allPassed}
            isCreating={isCreating} createError={createError}
            onStart={handleStartInterview} onBack={() => setStep(2)}
            summaryItems={[
              { key: "카메라", val: cameraStatus === "ok" ? "정상" : "오류" },
              { key: "마이크", val: micStatus === "ok" ? "정상" : "오류" },
              { key: "네트워크", val: networkStatus === "ok" ? `${networkLatency}` : "오류" },
              { key: "GPU", val: gpuStatus === "ok" ? "활성화" : "소프트웨어" },
              { key: "진행 모드", val: practiceMode === "real" ? "실전" : "연습" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
