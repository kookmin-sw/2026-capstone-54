import { useEffect, useState } from "react";
import { usePrecheckStore } from "@/features/interview-precheck";

export function InterviewPreCheckPage() {
  const {
    cameraStatus,
    micStatus,
    networkStatus,
    cameraInfo,
    micInfo,
    micLevel,
    networkProgress,
    networkSpeed,
    networkLatency,
    allPassed,
    startChecks,
    stopMicTimer,
  } = usePrecheckStore();

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    startChecks();
    const t = setTimeout(() => setRevealed(true), 50);
    return () => {
      clearTimeout(t);
      stopMicTimer();
    };
  }, [startChecks, stopMicTimer]);

  const rvCls = () =>
    `ipc-rv${revealed ? " ipc-rv-in" : ""}`;
  const rvStyle = (delayMs: number): React.CSSProperties => ({
    transitionDelay: revealed ? `${delayMs}ms` : "0ms",
  });

  /* ── card class helpers ── */
  const cardBase =
    "rounded-lg py-[22px] px-[18px] text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden";

  const camCardClass = () => {
    if (cameraStatus === "ok") return `${cardBase} bg-[#F0FDF4] border border-[rgba(5,150,105,.25)]`;
    if (cameraStatus === "checking") return `${cardBase} bg-[#F9FAFB] border border-[#E5E7EB] animate-[ipc-cardGlow_1.8s_ease-in-out_infinite]`;
    if (cameraStatus === "fail") return `${cardBase} bg-[#FFF1F2] border border-[rgba(225,29,72,.2)]`;
    return `${cardBase} bg-[#F9FAFB] border border-[#E5E7EB]`;
  };
  const micCardClass = () => {
    if (micStatus === "ok") return `${cardBase} bg-[#F0FDF4] border border-[rgba(5,150,105,.25)]`;
    if (micStatus === "checking") return `${cardBase} bg-[#F9FAFB] border border-[#E5E7EB] animate-[ipc-cardGlow_1.8s_ease-in-out_infinite]`;
    if (micStatus === "fail") return `${cardBase} bg-[#FFF1F2] border border-[rgba(225,29,72,.2)]`;
    return `${cardBase} bg-[#F9FAFB] border border-[#E5E7EB]`;
  };
  const netCardClass = () => {
    if (networkStatus === "ok") return `${cardBase} bg-[#F0FDF4] border border-[rgba(5,150,105,.25)]`;
    if (networkStatus === "checking") return `${cardBase} bg-[#F9FAFB] border border-[#E5E7EB] animate-[ipc-cardGlow_1.8s_ease-in-out_infinite]`;
    if (networkStatus === "fail") return `${cardBase} bg-[#FFF1F2] border border-[rgba(225,29,72,.2)]`;
    return `${cardBase} bg-[#F9FAFB] border border-[#E5E7EB]`;
  };

  const indClass = (s: string) => {
    const base = "absolute top-3 right-3 w-2 h-2 rounded-full";
    if (s === "ok") return `${base} bg-[#10B981]`;
    if (s === "checking") return `${base} bg-[#0991B2] animate-[ipc-blink_1s_ease_infinite]`;
    if (s === "fail") return `${base} bg-[#E11D48]`;
    return `${base} bg-[#E5E7EB]`;
  };

  const iconClass = (s: string) => {
    const base = "w-[52px] h-[52px] rounded-lg mx-auto mb-3 flex items-center justify-center text-[22px] transition-all";
    if (s === "ok") return `${base} bg-[#ECFDF5] border border-[#BBF7D0]`;
    if (s === "checking") return `${base} bg-[#E6F7FA] border border-[rgba(9,145,178,.2)]`;
    if (s === "fail") return `${base} bg-[#FFF1F2] border border-[#FECDD3]`;
    return `${base} bg-[#F9FAFB] border border-[#E5E7EB]`;
  };

  const statusEl = (s: string, okText: string, checkText = "⟳ 측정 중...") => {
    const base = "text-[12px] font-semibold flex items-center justify-center gap-1";
    if (s === "ok") return <div className={`${base} text-[#059669]`}>✓ {okText}</div>;
    if (s === "checking") return <div className={`${base} text-[#0991B2]`}>{checkText}</div>;
    if (s === "fail") return <div className={`${base} text-[#E11D48]`}>✕ 오류 발생</div>;
    return <div className={`${base} text-[#6B7280]`}>대기 중</div>;
  };

  return (
    <>
      <div className="max-w-container-md mx-auto px-8 pt-9 pb-[60px]">

        {/* ── BREADCRUMB ── */}
        <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] mb-6 animate-[ipc-fadeUp_.3s_ease_both]">
          <a className="text-[#6B7280] no-underline hover:text-[#0A0A0A]" href="/home">홈</a>
          <span className="opacity-40">/</span>
          <a className="text-[#6B7280] no-underline hover:text-[#0A0A0A]" href="/interview/setup">면접 설정</a>
          <span className="opacity-40">/</span>
          <span className="text-[#0991B2] font-bold">환경 점검</span>
        </div>

        {/* ── STEPPER ── */}
        <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-[14px_22px] mb-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-[ipc-fadeUp_.35s_.05s_ease_both]">
          <div className="flex items-center gap-[7px]">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 transition-all bg-[#0991B2] text-white">✓</div>
            <span className="text-[12px] font-semibold text-[#6B7280]">지원 컨텍스트</span>
          </div>
          <div className="flex-1 h-[1.5px] bg-[#0991B2] mx-[10px]"></div>
          <div className="flex items-center gap-[7px]">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 transition-all bg-[#0991B2] text-white">✓</div>
            <span className="text-[12px] font-semibold text-[#6B7280]">면접 방식</span>
          </div>
          <div className="flex-1 h-[1.5px] bg-[#0991B2] mx-[10px]"></div>
          <div className="flex items-center gap-[7px]">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 transition-all bg-[#0A0A0A] text-white">3</div>
            <span className="text-[12px] font-bold text-[#0A0A0A]">환경 점검</span>
          </div>
        </div>

        {/* ── HEADER ── */}
        <div className="text-center mb-7 animate-[ipc-fadeUp_.4s_.1s_ease_both]">
          <div className="text-[11px] font-bold tracking-[.1em] uppercase text-[#0991B2] mb-2">사전 환경 점검</div>
          <h1 className="text-[clamp(26px,3.5vw,38px)] font-black tracking-[-0.7px] leading-[1.15] mb-2.5">면접 전 준비를 확인할게요</h1>
          <p className="text-sm text-[#6B7280] leading-relaxed max-w-text mx-auto">카메라, 마이크, 네트워크를 자동으로 점검해요. 좋은 환경이 좋은 결과로 이어집니다.</p>
        </div>

        {/* ── PERMISSION BANNER ── */}
        <div
          className={`rounded-lg p-[12px_16px] mb-5 flex items-center gap-2.5 bg-[#ECFDF5] border border-[#BBF7D0] ${rvCls()}`}
          style={rvStyle(0)}
        >
          <span className="text-sm shrink-0">✅</span>
          <div className="text-[13px] text-[#0A0A0A] leading-[1.5]"><strong className="font-bold">카메라 및 마이크 권한이 허용됐어요.</strong> 테스트 영상은 저장되지 않습니다.</div>
        </div>

        {/* ── CHECK CARDS ── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* Camera card */}
          <div className={`${camCardClass()} ${rvCls()}`} style={rvStyle(55)}>
            <div className={indClass(cameraStatus)}></div>
            <div className={iconClass(cameraStatus)}>📷</div>
            <div className="text-sm font-extrabold mb-[5px]">카메라</div>
            {statusEl(cameraStatus, "정상 감지")}
            <div className="text-[11px] text-[#6B7280] mt-[5px] leading-[1.5]">
              {cameraStatus === "ok" && cameraInfo
                ? <>{cameraInfo.resolution} · {cameraInfo.deviceName}<br />얼굴 인식 활성화</>
                : <>카메라 점검 중<br />잠시만 기다려주세요</>
              }
            </div>
          </div>

          {/* Mic card */}
          <div className={`${micCardClass()} ${rvCls()}`} style={rvStyle(110)}>
            <div className={indClass(micStatus)}></div>
            <div className={iconClass(micStatus)}>🎙️</div>
            <div className="text-sm font-extrabold mb-[5px]">마이크</div>
            {statusEl(micStatus, "정상 감지")}
            <div className="text-[11px] text-[#6B7280] mt-[5px] leading-[1.5]">
              {micStatus === "ok" && micInfo
                ? <>{micInfo.deviceName}<br />입력 레벨 양호</>
                : <>마이크 점검 중<br />잠시만 기다려주세요</>
              }
            </div>
          </div>

          {/* Network card */}
          <div className={`${netCardClass()} ${rvCls()}`} style={rvStyle(165)}>
            <div className={indClass(networkStatus)}></div>
            <div className={iconClass(networkStatus)}>🌐</div>
            <div className="text-sm font-extrabold mb-[5px]">네트워크</div>
            {networkStatus === "checking"
              ? <div className="text-[12px] font-semibold flex items-center justify-center gap-1 text-[#0991B2]">⟳ 측정 중...</div>
              : networkStatus === "ok"
                ? <div className="text-[12px] font-semibold flex items-center justify-center gap-1 text-[#059669]">✓ 정상 연결</div>
                : <div className="text-[12px] font-semibold flex items-center justify-center gap-1 text-[#6B7280]">대기 중</div>
            }
            <div className="text-[11px] text-[#6B7280] mt-[5px] leading-[1.5]">
              {networkStatus === "ok"
                ? <>응답속도 {networkLatency} · 안정적<br />TTS·STT 서버 연결 완료</>
                : <>TTS·STT 서버 연결<br />속도 테스트 중</>
              }
            </div>
          </div>
        </div>

        {/* ── LEVEL METERS ── */}
        <div
          className={`grid grid-cols-3 gap-3 mb-5 ${rvCls()}`}
          style={rvStyle(220)}
        >
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="text-[11px] font-bold text-[#6B7280] mb-[9px] flex items-center gap-[5px]">🎙️ 마이크 레벨</div>
            <div className="h-[5px] rounded-[3px] bg-[#E5E7EB] overflow-hidden mb-[5px]">
              <div className="h-full rounded-[3px] bg-[#10B981] [transition:width_1s_ease]" style={{ width: `${micLevel}%` }}></div>
            </div>
            <div className="text-[11px] font-bold text-[#0A0A0A]">{micLevel} dB — 양호</div>
          </div>
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="text-[11px] font-bold text-[#6B7280] mb-[9px] flex items-center gap-[5px]">🌐 네트워크 속도</div>
            <div className="h-[5px] rounded-[3px] bg-[#E5E7EB] overflow-hidden mb-[5px]">
              <div className="h-full rounded-[3px] bg-[#0991B2] [transition:width_1s_ease]" style={{ width: `${networkProgress}%` }}></div>
            </div>
            <div className="text-[11px] font-bold text-[#0A0A0A]">
              {networkStatus === "ok" ? networkSpeed : "측정 중..."}
            </div>
          </div>
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="text-[11px] font-bold text-[#6B7280] mb-[9px] flex items-center gap-[5px]">💡 조명 밝기</div>
            <div className="h-[5px] rounded-[3px] bg-[#E5E7EB] overflow-hidden mb-[5px]">
              <div className="h-full rounded-[3px] bg-[#F59E0B] [transition:width_1s_ease]" style={{ width: "83%" }}></div>
            </div>
            <div className="text-[11px] font-bold text-[#0A0A0A]">83% — 밝음</div>
          </div>
        </div>

        {/* ── CAMERA PREVIEW ── */}
        <div
          className={`bg-white border border-[#E5E7EB] rounded-lg p-[22px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] mb-5 ${rvCls()}`}
          style={rvStyle(275)}
        >
          <div className="text-[13px] font-extrabold mb-3.5">📹 카메라 미리보기</div>
          <div className="grid grid-cols-2 gap-5 items-start max-md:grid-cols-1">
            <div className="aspect-video bg-[#0A0A0A] rounded-lg overflow-hidden relative flex items-center justify-center">
              <div className="absolute w-[90px] h-[110px] border-[1.5px] border-[rgba(255,255,255,.25)] rounded-[50%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%]"></div>
              <div className="text-center text-[rgba(255,255,255,.35)]">
                <div className="text-[32px] mb-1.5">👤</div>
                <div className="text-[12px] font-medium">카메라 연결 중</div>
              </div>
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] font-bold text-white bg-[rgba(225,29,72,.85)] py-[3px] px-[9px] rounded-full backdrop-blur-[6px]">
                <div className="w-[5px] h-[5px] rounded-full bg-white animate-[ipc-blink_1s_ease_infinite]"></div>
                LIVE
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-[9px] p-[10px_12px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                <span className="text-[13px] shrink-0 mt-px">💡</span>
                <div className="text-[12px] text-[#6B7280] leading-[1.45]"><strong className="text-[#0A0A0A] font-bold">조명</strong>은 얼굴 앞에서 비추도록 하세요. 역광은 인식률을 낮춥니다.</div>
              </div>
              <div className="flex items-start gap-[9px] p-[10px_12px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                <span className="text-[13px] shrink-0 mt-px">👁️</span>
                <div className="text-[12px] text-[#6B7280] leading-[1.45]"><strong className="text-[#0A0A0A] font-bold">카메라를 정면으로</strong> 바라보세요. 시선 이탈은 자신감 점수에 영향을 줍니다.</div>
              </div>
              <div className="flex items-start gap-[9px] p-[10px_12px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                <span className="text-[13px] shrink-0 mt-px">🎙️</span>
                <div className="text-[12px] text-[#6B7280] leading-[1.45]"><strong className="text-[#0A0A0A] font-bold">조용한 환경</strong>에서 진행하세요. 배경 소음은 STT 정확도를 낮춥니다.</div>
              </div>
              <div className="flex items-start gap-[9px] p-[10px_12px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                <span className="text-[13px] shrink-0 mt-px">📐</span>
                <div className="text-[12px] text-[#6B7280] leading-[1.45]"><strong className="text-[#0A0A0A] font-bold">얼굴을 가이드 원 안</strong>에 맞춰 위치를 조정해주세요.</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RECAP CHIPS ── */}
        <div
          className={`bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-[14px_18px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] mb-6 flex items-center gap-1.5 flex-wrap ${rvCls()}`}
          style={rvStyle(330)}
        >
          <span className="text-[12px] text-[#6B7280] font-medium mr-0.5">설정 확인</span>
          <span className="text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] border border-[rgba(9,145,178,.15)] py-1 px-2.5 rounded-full">카카오뱅크</span>
          <span className="text-[12px] font-bold text-[#0A0A0A] bg-white border border-[#E5E7EB] py-1 px-2.5 rounded-full">백엔드 개발자</span>
          <span className="text-[12px] font-bold text-[#0A0A0A] bg-white border border-[#E5E7EB] py-1 px-2.5 rounded-full">1차 면접</span>
          <span className="text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] border border-[rgba(9,145,178,.15)] py-1 px-2.5 rounded-full">꼬리질문</span>
          <span className="text-[12px] font-bold text-[#0A0A0A] bg-white border border-[#E5E7EB] py-1 px-2.5 rounded-full">연습 모드</span>
        </div>

        {/* ── START SECTION ── */}
        <div
          className={`text-center pb-3 ${rvCls()}`}
          style={rvStyle(385)}
        >
          <button
            className="inline-flex items-center gap-[9px] text-base font-extrabold text-white bg-[#0A0A0A] border-none rounded-lg py-[17px] px-11 cursor-pointer shadow-[0_4px_6px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.06)] transition-all hover:enabled:opacity-[.88] hover:enabled:-translate-y-0.5 active:enabled:scale-[.97] disabled:bg-[#D1D5DB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed disabled:shadow-none"
            disabled={!allPassed}
          >
            {allPassed
              ? <><span>🎬</span><span>면접 시작하기</span></>
              : <><span className="inline-block animate-[ipc-spin_1s_linear_infinite]">⟳</span><span>환경 점검 중...</span></>
            }
          </button>
          <div className="text-[12px] text-[#6B7280] mt-2.5">
            {allPassed
              ? "모든 환경 점검이 완료됐어요. 면접을 시작하세요!"
              : "네트워크 속도를 측정하고 있어요. 잠시만 기다려주세요."
            }
          </div>
          <button
            className="text-[13px] font-semibold text-[#6B7280] bg-transparent border-none cursor-pointer block mx-auto mt-2.5 underline decoration-[#E5E7EB] hover:text-[#0A0A0A]"
            onClick={() => history.back()}
          >
            ← 설정으로 돌아가기
          </button>
        </div>

      </div>
    </>
  );
}
