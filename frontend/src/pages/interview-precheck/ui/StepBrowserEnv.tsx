import { CheckStatusCard } from "@/shared/ui/CheckStatusCard";
import { InfoTip } from "@/shared/ui/InfoTip";
import { LevelMeter } from "@/shared/ui/LevelMeter";
import { StepLayout } from "@/shared/ui/StepLayout";
import type { CheckStatus } from "@/features/interview-precheck";

interface StepBrowserEnvProps {
  networkStatus: CheckStatus;
  gpuStatus: CheckStatus;
  gpuInfo: string;
  networkLatency: string;
  networkProgress: number;
  networkSpeed: string;
  step2Checked: boolean;
  step2Ok: boolean;
  onNext: () => void;
  onBack: () => void;
}

export function StepBrowserEnv({
  networkStatus, gpuStatus, gpuInfo, networkLatency, networkProgress, networkSpeed,
  step2Checked, step2Ok, onNext, onBack,
}: StepBrowserEnvProps) {
  const navBtnCls = "flex-1 text-center py-[13px] rounded-lg font-bold text-[13px] cursor-pointer transition-all";

  return (
    <StepLayout
      stepLabel="STEP 2"
      title="브라우저 환경을 확인합니다"
      description="네트워크 속도와 그래픽 가속을 점검합니다."
      left={
        <>
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="text-[13px] font-extrabold mb-5">📊 환경 측정 결과</div>
            <LevelMeter icon="🌐" label="네트워크 속도" value={networkProgress} color="#0991B2" displayText={networkStatus === "ok" ? networkSpeed : "측정 중..."} className="mb-4 shadow-none border-0 p-0 bg-transparent" />
            <LevelMeter icon="⚡" label="GPU 렌더러" value={gpuStatus === "ok" ? 100 : gpuStatus === "fail" ? 30 : 0} color="#8B5CF6" displayText={gpuStatus === "ok" ? "하드웨어 가속" : gpuStatus === "fail" ? "소프트웨어 렌더링" : "확인 중..."} className="shadow-none border-0 p-0 bg-transparent" />
          </div>
        </>
      }
      right={
        <>
          <div className="grid grid-cols-2 gap-3">
            <CheckStatusCard status={networkStatus} icon="🌐" title="네트워크" okText="정상 연결">
              {networkStatus === "ok" ? <>응답 {networkLatency}</> : <>측정 중</>}
            </CheckStatusCard>
            <CheckStatusCard status={gpuStatus} icon="⚡" title="GPU 가속" okText="활성화" checkingText="⟳ 확인 중...">
              {gpuStatus === "ok" && gpuInfo ? <span className="line-clamp-1">{gpuInfo}</span> : gpuStatus === "fail" ? <>소프트웨어</> : <>확인 중</>}
            </CheckStatusCard>
          </div>

          <div className="flex flex-col gap-2">
            <InfoTip icon="🌐" title="안정적인 Wi-Fi" description=" 또는 유선 연결을 권장합니다." />
            <InfoTip icon="⚡" title="GPU 가속이 없어도" description=" 면접은 진행 가능합니다." />
            <InfoTip icon="🔋" title="충전기를 연결" description="하고 진행하세요." />
          </div>

          <div className="flex gap-3 mt-auto">
            <button className={`${navBtnCls} text-[#6B7280] bg-transparent border border-[#E5E7EB] hover:bg-[#F9FAFB]`} onClick={onBack}>← 이전</button>
            <button disabled={!step2Ok} onClick={onNext} className={`${navBtnCls} text-white bg-[#0A0A0A] border-none shadow-[0_4px_6px_rgba(0,0,0,0.07)] hover:enabled:opacity-[.88] disabled:bg-[#D1D5DB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed`}>
              {step2Checked ? (step2Ok ? "다음 →" : "네트워크 필요") : "점검 중..."}
            </button>
          </div>
        </>
      }
    />
  );
}
