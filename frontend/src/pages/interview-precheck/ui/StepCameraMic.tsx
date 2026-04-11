import type { RefObject } from "react";
import { CheckStatusCard } from "@/shared/ui/CheckStatusCard";
import { InfoTip } from "@/shared/ui/InfoTip";
import { LevelMeter } from "@/shared/ui/LevelMeter";
import { StepLayout } from "@/shared/ui/StepLayout";
import type { CameraInfo, MicInfo, CheckStatus } from "@/features/interview-precheck";

interface StepCameraMicProps {
  cameraStatus: CheckStatus;
  micStatus: CheckStatus;
  cameraInfo: CameraInfo | null;
  micInfo: MicInfo | null;
  micLevel: number;
  cameraStream: MediaStream | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  step1Checked: boolean;
  step1Ok: boolean;
  onNext: () => void;
  onBack: () => void;
}

export function StepCameraMic({
  cameraStatus, micStatus, cameraInfo, micInfo, micLevel,
  cameraStream, videoRef, step1Checked, step1Ok, onNext, onBack,
}: StepCameraMicProps) {
  const camDenied = cameraStatus === "fail";
  const micDenied = micStatus === "fail";
  const anyDenied = camDenied || micDenied;

  const navBtnCls = "flex-1 text-center py-[13px] rounded-lg font-bold text-[13px] cursor-pointer transition-all";

  return (
    <StepLayout
      stepLabel="STEP 1"
      title="카메라와 마이크를 확인합니다"
      description="면접에 필요한 장치 권한을 점검해요."
      left={
        <>
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="text-[13px] font-extrabold mb-3">📹 카메라 미리보기</div>
            <div className="aspect-video bg-[#0A0A0A] rounded-lg overflow-hidden relative flex items-center justify-center">
              {cameraStream ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
              ) : (
                <div className="text-center text-[rgba(255,255,255,.35)]">
                  <div className="text-[32px] mb-1.5">{cameraStatus === "fail" ? "🚫" : "👤"}</div>
                  <div className="text-[12px] font-medium">{cameraStatus === "fail" ? "카메라 권한 차단됨" : "카메라 연결 중"}</div>
                </div>
              )}
              {cameraStream && (
                <>
                  <div className="absolute w-[90px] h-[110px] border-[1.5px] border-[rgba(255,255,255,.25)] rounded-[50%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] pointer-events-none" />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] font-bold text-white bg-[rgba(225,29,72,.85)] py-[3px] px-[9px] rounded-full backdrop-blur-[6px]">
                    <div className="w-[5px] h-[5px] rounded-full bg-white animate-[ipc-blink_1s_ease_infinite]" /> LIVE
                  </div>
                </>
              )}
            </div>
          </div>
          <LevelMeter icon="🎙️" label="마이크 레벨" value={micLevel} color="#10B981" displayText={`${micLevel} — ${micLevel >= 30 ? "양호" : "낮음"}`} />
        </>
      }
      right={
        <>
          {step1Checked && (
            <div className={`rounded-lg p-[12px_16px] flex items-center gap-2.5 ${anyDenied ? "bg-[#FFF1F2] border border-[rgba(225,29,72,.2)]" : "bg-[#ECFDF5] border border-[#BBF7D0]"}`}>
              <span className="text-sm shrink-0">{anyDenied ? "🚫" : "✅"}</span>
              <div className="text-[13px] text-[#0A0A0A] leading-[1.5]">
                {anyDenied
                  ? <><strong className="font-bold text-[#E11D48]">{camDenied && micDenied ? "카메라 및 마이크 권한 차단" : camDenied ? "카메라 권한 차단" : "마이크 권한 차단"}</strong></>
                  : <><strong className="font-bold">카메라 및 마이크 권한 허용됨</strong></>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <CheckStatusCard status={cameraStatus} icon="📷" title="카메라" okText="정상 감지">
              {cameraStatus === "ok" && cameraInfo ? <>{cameraInfo.resolution}<br />{cameraInfo.deviceName}</> : cameraStatus === "fail" ? <>권한 차단됨</> : <>점검 중</>}
            </CheckStatusCard>
            <CheckStatusCard status={micStatus} icon="🎙️" title="마이크" okText="정상 감지">
              {micStatus === "ok" && micInfo ? <>{micInfo.deviceName}</> : micStatus === "fail" ? <>권한 차단됨</> : <>점검 중</>}
            </CheckStatusCard>
          </div>

          <div className="flex flex-col gap-2">
            <InfoTip icon="💡" title="조명" description="은 얼굴 앞에서 비추도록 하세요." />
            <InfoTip icon="👁️" title="카메라를 정면으로" description=" 바라보세요." />
            <InfoTip icon="🎙️" title="조용한 환경" description="에서 진행하세요." />
          </div>

          <div className="flex gap-3 mt-auto">
            <button className={`${navBtnCls} text-[#6B7280] bg-transparent border border-[#E5E7EB] hover:bg-[#F9FAFB]`} onClick={onBack}>← 이전</button>
            <button disabled={!step1Ok} onClick={onNext} className={`${navBtnCls} text-white bg-[#0A0A0A] border-none shadow-[0_4px_6px_rgba(0,0,0,0.07)] hover:enabled:opacity-[.88] disabled:bg-[#D1D5DB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed`}>
              {step1Checked ? (step1Ok ? "다음 →" : "권한 필요") : "점검 중..."}
            </button>
          </div>
        </>
      }
    />
  );
}
