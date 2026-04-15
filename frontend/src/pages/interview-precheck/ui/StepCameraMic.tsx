import type { RefObject } from "react";
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

const statusText = (s: CheckStatus, ok: string) =>
  s === "ok" ? <span className="text-emerald-400">✓ {ok}</span>
  : s === "checking" ? <span className="text-cyan-400">⟳ 측정 중...</span>
  : s === "fail" ? <span className="text-red-400">✕ 오류</span>
  : <span className="text-slate-500">대기 중</span>;

export function StepCameraMic({
  cameraStatus, micStatus, cameraInfo, micInfo, micLevel,
  cameraStream, videoRef, step1Checked, step1Ok, onNext, onBack,
}: StepCameraMicProps) {
  const camDenied = cameraStatus === "fail";
  const micDenied = micStatus === "fail";
  const anyDenied = camDenied || micDenied;

  return (
    <div>
      <div className="mb-6">
        <div className="text-[11px] font-bold tracking-[.1em] uppercase text-cyan-400 mb-2">STEP 1</div>
        <h2 className="text-[20px] font-black tracking-[-0.3px] mb-1">카메라와 마이크를 확인합니다</h2>
        <p className="text-[13px] text-slate-400">면접에 필요한 장치 권한을 점검해요.</p>
      </div>

      <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
        {/* Left: preview + mic level */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
            <div className="text-[13px] font-extrabold mb-3 text-slate-200">카메라 미리보기</div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
              {cameraStream ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
              ) : (
                <div className="text-center text-slate-600">
                  <div className="text-[32px] mb-1.5">{cameraStatus === "fail" ? "🚫" : "👤"}</div>
                  <div className="text-[12px] font-medium">{cameraStatus === "fail" ? "카메라 권한 차단됨" : "카메라 연결 중"}</div>
                </div>
              )}
              {cameraStream && (
                <>
                  <div className="absolute w-[90px] h-[110px] border-[1.5px] border-white/25 rounded-[50%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] pointer-events-none" />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] font-bold text-white bg-red-500/85 py-[3px] px-[9px] rounded-full backdrop-blur-sm">
                    <div className="w-[5px] h-[5px] rounded-full bg-white animate-pulse" /> LIVE
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4">
            <div className="text-[11px] font-bold text-slate-400 mb-2">마이크 레벨</div>
            <div className="h-[5px] rounded-full bg-slate-700 overflow-hidden mb-1.5">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${micLevel}%` }} />
            </div>
            <div className="text-[11px] font-bold text-slate-300">{micLevel} — {micLevel >= 30 ? "양호" : "낮음"}</div>
          </div>
        </div>

        {/* Right: status + tips + nav */}
        <div className="flex flex-col gap-4">
          {step1Checked && (
            <div className={`rounded-xl p-3 flex items-center gap-2.5 ${anyDenied ? "bg-red-500/10 border border-red-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
              <span className="text-sm shrink-0">{anyDenied ? "🚫" : "✅"}</span>
              <div className="text-[13px] text-slate-200 leading-[1.5]">
                {anyDenied
                  ? <strong className="font-bold text-red-400">{camDenied && micDenied ? "카메라 및 마이크 권한 차단" : camDenied ? "카메라 권한 차단" : "마이크 권한 차단"}</strong>
                  : <strong className="font-bold text-emerald-400">카메라 및 마이크 권한 허용됨</strong>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-[20px] mb-1">📷</div>
              <div className="text-[13px] font-extrabold text-slate-200 mb-1">카메라</div>
              <div className="text-[12px] font-semibold">{statusText(cameraStatus, "정상 감지")}</div>
              <div className="text-[10px] text-slate-500 mt-1">
                {cameraStatus === "ok" && cameraInfo ? <>{cameraInfo.resolution}</> : cameraStatus === "fail" ? <>권한 차단됨</> : <>점검 중</>}
              </div>
            </div>
            <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-[20px] mb-1">🎙️</div>
              <div className="text-[13px] font-extrabold text-slate-200 mb-1">마이크</div>
              <div className="text-[12px] font-semibold">{statusText(micStatus, "정상 감지")}</div>
              <div className="text-[10px] text-slate-500 mt-1">
                {micStatus === "ok" && micInfo ? <>{micInfo.deviceName}</> : micStatus === "fail" ? <>권한 차단됨</> : <>점검 중</>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { t: "조명", d: "은 얼굴 앞에서 비추도록 하세요." },
              { t: "카메라를 정면으로", d: " 바라보세요." },
              { t: "조용한 환경", d: "에서 진행하세요." },
            ].map((tip) => (
              <div key={tip.t} className="text-[12px] text-slate-400 bg-slate-800/40 border border-white/5 rounded-lg px-3 py-2">
                <strong className="text-slate-200">{tip.t}</strong>{tip.d}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-auto">
            <button className="flex-1 py-3 rounded-xl font-bold text-[13px] text-slate-400 bg-transparent border border-white/10 hover:bg-white/5 transition-colors cursor-pointer" onClick={onBack}>닫기</button>
            <button disabled={!step1Ok} onClick={onNext} className="flex-1 py-3 rounded-xl font-bold text-[13px] text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              {step1Checked ? (step1Ok ? "다음 →" : "권한 필요") : "점검 중..."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
