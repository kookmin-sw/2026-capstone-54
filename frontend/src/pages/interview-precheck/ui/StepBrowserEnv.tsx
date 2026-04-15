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

const statusText = (s: CheckStatus, ok: string) =>
  s === "ok" ? <span className="text-emerald-400">✓ {ok}</span>
  : s === "checking" ? <span className="text-cyan-400">⟳ 측정 중...</span>
  : s === "fail" ? <span className="text-red-400">✕ 오류</span>
  : <span className="text-slate-500">대기 중</span>;

export function StepBrowserEnv({
  networkStatus, gpuStatus, gpuInfo, networkLatency, networkProgress, networkSpeed,
  step2Checked, step2Ok, onNext, onBack,
}: StepBrowserEnvProps) {
  return (
    <div>
      <div className="mb-6">
        <div className="text-[11px] font-bold tracking-[.1em] uppercase text-cyan-400 mb-2">STEP 2</div>
        <h2 className="text-[20px] font-black tracking-[-0.3px] mb-1">브라우저 환경을 확인합니다</h2>
        <p className="text-[13px] text-slate-400">네트워크 속도와 그래픽 가속을 점검합니다.</p>
      </div>

      <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
        {/* Left: measurement results */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-800/60 border border-white/10 rounded-xl p-6">
            <div className="text-[13px] font-extrabold text-slate-200 mb-5">환경 측정 결과</div>
            <div className="mb-5">
              <div className="text-[11px] font-bold text-slate-400 mb-2">네트워크 속도</div>
              <div className="h-[6px] rounded-full bg-slate-700 overflow-hidden mb-1.5">
                <div className="h-full rounded-full bg-cyan-500 transition-all duration-500" style={{ width: `${networkProgress}%` }} />
              </div>
              <div className="text-[12px] font-bold text-slate-300">{networkStatus === "ok" ? networkSpeed : "측정 중..."}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-2">GPU 렌더러</div>
              <div className="h-[6px] rounded-full bg-slate-700 overflow-hidden mb-1.5">
                <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: gpuStatus === "ok" ? "100%" : gpuStatus === "fail" ? "30%" : "0%" }} />
              </div>
              <div className="text-[12px] font-bold text-slate-300">{gpuStatus === "ok" ? "하드웨어 가속" : gpuStatus === "fail" ? "소프트웨어 렌더링" : "확인 중..."}</div>
            </div>
          </div>
        </div>

        {/* Right: status cards + tips + nav */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-[20px] mb-1">🌐</div>
              <div className="text-[13px] font-extrabold text-slate-200 mb-1">네트워크</div>
              <div className="text-[12px] font-semibold">{statusText(networkStatus, "정상 연결")}</div>
              <div className="text-[10px] text-slate-500 mt-1">{networkStatus === "ok" ? `응답 ${networkLatency}` : "측정 중"}</div>
            </div>
            <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-[20px] mb-1">⚡</div>
              <div className="text-[13px] font-extrabold text-slate-200 mb-1">GPU 가속</div>
              <div className="text-[12px] font-semibold">{statusText(gpuStatus, "활성화")}</div>
              <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{gpuStatus === "ok" && gpuInfo ? gpuInfo : gpuStatus === "fail" ? "소프트웨어" : "확인 중"}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { t: "안정적인 Wi-Fi", d: " 또는 유선 연결을 권장합니다." },
              { t: "GPU 가속이 없어도", d: " 면접은 진행 가능합니다." },
              { t: "충전기를 연결", d: "하고 진행하세요." },
            ].map((tip) => (
              <div key={tip.t} className="text-[12px] text-slate-400 bg-slate-800/40 border border-white/5 rounded-lg px-3 py-2">
                <strong className="text-slate-200">{tip.t}</strong>{tip.d}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-auto">
            <button className="flex-1 py-3 rounded-xl font-bold text-[13px] text-slate-400 bg-transparent border border-white/10 hover:bg-white/5 transition-colors cursor-pointer" onClick={onBack}>← 이전</button>
            <button disabled={!step2Ok} onClick={onNext} className="flex-1 py-3 rounded-xl font-bold text-[13px] text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              {step2Checked ? (step2Ok ? "다음 →" : "네트워크 필요") : "점검 중..."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
