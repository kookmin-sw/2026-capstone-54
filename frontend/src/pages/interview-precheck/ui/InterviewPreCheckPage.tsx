import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePrecheckStore } from "@/features/interview-precheck";
import { StepIndicator } from "@/shared/ui/StepIndicator";
import { StepCameraMic } from "./StepCameraMic";
import { StepBrowserEnv } from "./StepBrowserEnv";
import { StepVoiceCheck } from "./StepVoiceCheck";

type WizardStep = 1 | 2 | 3;

export function InterviewPreCheckPage() {
  const { interviewSessionUuid } = useParams<{ interviewSessionUuid: string }>();
  const navigate = useNavigate();

  const {
    cameraStatus, micStatus, networkStatus, gpuStatus,
    cameraInfo, micInfo, gpuInfo,
    micLevel, networkProgress, networkSpeed, networkLatency,
    cameraStream, allPassed,
    startChecks, stopMicTimer,
  } = usePrecheckStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [step, setStep] = useState<WizardStep>(1);

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

  const handleStartSession = () => {
    if (!interviewSessionUuid) return;
    stopMicTimer();
    navigate(`/interview/session/${interviewSessionUuid}`);
  };

  const mainSteps = [
    { label: "카메라 · 마이크", state: (step > 1 ? "done" : "active") as "done" | "active" | "pending" },
    { label: "브라우저 환경", state: (step > 2 ? "done" : step === 2 ? "active" : "pending") as "done" | "active" | "pending" },
    { label: "음성 확인", state: (step === 3 ? "active" : "pending") as "done" | "active" | "pending" },
  ];

  return (
    <div className="min-h-screen bg-[#080f1a] text-white">
      <div className="w-full px-8 pt-[40px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        <div className="mb-6">
          <h1 className="text-[clamp(22px,2.5vw,30px)] font-black tracking-[-0.5px] mb-1.5">환경을 점검해요</h1>
          <p className="text-sm text-[#9CA3AF]">카메라, 마이크, 네트워크, 음성을 자동으로 점검합니다.</p>
        </div>

        <StepIndicator steps={mainSteps} dark className="mb-8" />

        {step === 1 && (
          <StepCameraMic
            cameraStatus={cameraStatus} micStatus={micStatus}
            cameraInfo={cameraInfo} micInfo={micInfo} micLevel={micLevel}
            cameraStream={cameraStream} videoRef={videoRef}
            step1Checked={step1Checked} step1Ok={step1Ok}
            onNext={() => setStep(2)} onBack={() => window.close()}
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
            practiceMode=""
            allPassed={allPassed}
            isCreating={false}
            createError={null}
            onStart={handleStartSession}
            onBack={() => setStep(2)}
            summaryItems={[
              { key: "카메라", val: cameraStatus === "ok" ? "정상" : "오류" },
              { key: "마이크", val: micStatus === "ok" ? "정상" : "오류" },
              { key: "네트워크", val: networkStatus === "ok" ? networkLatency : "오류" },
              { key: "GPU", val: gpuStatus === "ok" ? "활성화" : "소프트웨어" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
