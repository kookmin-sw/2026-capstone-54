import { useEffect, useState } from "react";
import { usePrecheckStore } from "@/features/interview-precheck";

const IPC_STYLES = `
        /* ── TOKENS ── */
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --ipc-bg:#FFFFFF;
          --ipc-fg:#0A0A0A;
          --ipc-muted:#6B7280;
          --ipc-muted-light:#9CA3AF;
          --ipc-accent:#0991B2;
          --ipc-accent-mid:#06B6D4;
          --ipc-accent-light:#E6F7FA;
          --ipc-card-bg:#F9FAFB;
          --ipc-card-border:#E5E7EB;
          --ipc-btn-bg:#0A0A0A;
          --ipc-btn-fg:#FFFFFF;
          --ipc-sc:0 1px 2px rgba(0,0,0,.04),0 4px 12px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.06);
          --ipc-sch:0 2px 4px rgba(0,0,0,.05),0 8px 20px rgba(0,0,0,.09),0 16px 40px rgba(0,0,0,.08);
          --ipc-sw:0 1px 2px rgba(0,0,0,.03),0 2px 8px rgba(0,0,0,.05);
          --ipc-r-sm:8px;--ipc-r-md:12px;--ipc-r-lg:16px;--ipc-r-xl:20px;--ipc-r-2xl:24px;--ipc-r-3xl:32px;
        }
        html{height:100%;scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;background:var(--ipc-bg);color:var(--ipc-fg);-webkit-font-smoothing:antialiased;overflow-x:hidden;line-height:1.5}
        @keyframes ipc-fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ipc-blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes ipc-spin{to{transform:rotate(360deg)}}
        @keyframes ipc-checkPulse{0%,100%{box-shadow:var(--ipc-sw)}50%{box-shadow:0 0 0 3px rgba(9,145,178,.15),var(--ipc-sc)}}
        .ipc-rv{opacity:0;transform:translateY(14px);transition:opacity .4s ease,transform .4s ease}
        .ipc-rv.ipc-rv-in{opacity:1;transform:translateY(0)}
        .ipc-nav{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--ipc-card-border);height:60px;display:flex;align-items:center;padding:0 32px;gap:16px}
        .ipc-nav-logo{font-size:20px;font-weight:900;color:var(--ipc-fg);text-decoration:none;letter-spacing:-.4px;margin-right:auto}
        .ipc-nav-logo .ipc-hi{color:var(--ipc-accent)}
        .ipc-nav-link{font-size:14px;font-weight:500;color:var(--ipc-muted);text-decoration:none;padding:6px 12px;border-radius:8px;transition:color .15s,background .15s}
        .ipc-nav-link:hover{color:var(--ipc-fg);background:var(--ipc-card-bg)}
        .ipc-btn-primary{display:inline-flex;align-items:center;gap:6px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;color:var(--ipc-btn-fg);background:var(--ipc-btn-bg);border:none;border-radius:8px;padding:9px 18px;cursor:pointer;transition:opacity .15s,transform .15s;text-decoration:none;white-space:nowrap}
        .ipc-btn-primary:hover{opacity:.85;transform:translateY(-1px)}
        .ipc-precheck{max-width:820px;margin:0 auto;padding:36px 32px 60px}
        .ipc-breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ipc-muted);margin-bottom:24px;animation:ipc-fadeUp .3s ease both}
        .ipc-bc-sep{opacity:.4}
        .ipc-bc-cur{color:var(--ipc-accent);font-weight:700}
        .ipc-breadcrumb a{color:inherit;text-decoration:none}
        .ipc-breadcrumb a:hover{color:var(--ipc-fg)}
        .ipc-stepper{display:flex;align-items:center;background:var(--ipc-card-bg);border:1px solid var(--ipc-card-border);border-radius:8px;padding:14px 22px;margin-bottom:32px;box-shadow:var(--ipc-sw);animation:ipc-fadeUp .35s .05s ease both}
        .ipc-step-item{display:flex;align-items:center;gap:7px}
        .ipc-step-circle{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;transition:all .25s}
        .ipc-sc-done{background:var(--ipc-accent);color:#fff}
        .ipc-sc-active{background:var(--ipc-btn-bg);color:#fff}
        .ipc-sc-idle{background:var(--ipc-card-border);color:var(--ipc-muted)}
        .ipc-step-label-text{font-size:12px;font-weight:600;color:var(--ipc-muted)}
        .ipc-step-label-text.ipc-active{color:var(--ipc-fg);font-weight:700}
        .ipc-step-line{flex:1;height:1.5px;background:var(--ipc-card-border);margin:0 10px}
        .ipc-step-line.ipc-done{background:var(--ipc-accent)}
        .ipc-pch-header{text-align:center;margin-bottom:28px;animation:ipc-fadeUp .4s .1s ease both}
        .ipc-pch-eyebrow{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ipc-accent);margin-bottom:8px}
        .ipc-pch-title{font-size:clamp(26px,3.5vw,38px);font-weight:900;letter-spacing:-.7px;line-height:1.15;margin-bottom:10px}
        .ipc-pch-sub{font-size:14px;color:var(--ipc-muted);line-height:1.6;max-width:440px;margin:0 auto}
        .ipc-perm-bar{border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px}
        .ipc-pb-ok{background:#ECFDF5;border:1px solid #BBF7D0}
        .ipc-pb-warn{background:#FFFBEB;border:1px solid #FDE68A}
        .ipc-pb-icon{font-size:14px;flex-shrink:0}
        .ipc-pb-text{font-size:13px;color:var(--ipc-fg);line-height:1.5}
        .ipc-pb-text strong{font-weight:700}
        .ipc-check-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
        .ipc-check-card{background:var(--ipc-card-bg);border:1px solid var(--ipc-card-border);border-radius:8px;padding:22px 18px;text-align:center;box-shadow:var(--ipc-sw);transition:all .3s;position:relative;overflow:hidden}
        .ipc-check-card.ipc-ok{border-color:rgba(5,150,105,.25);background:#F0FDF4}
        .ipc-check-card.ipc-fail{border-color:rgba(225,29,72,.2);background:#FFF1F2}
        .ipc-check-card.ipc-checking{animation:ipc-checkPulse 1.8s ease-in-out infinite}
        .ipc-cc-indicator{position:absolute;top:12px;right:12px;width:8px;height:8px;border-radius:50%}
        .ipc-ind-ok{background:#10B981}
        .ipc-ind-checking{background:var(--ipc-accent);animation:ipc-blink 1s ease infinite}
        .ipc-ind-fail{background:#E11D48}
        .ipc-ind-idle{background:var(--ipc-card-border)}
        .ipc-cc-icon{width:52px;height:52px;border-radius:8px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:22px;transition:all .3s}
        .ipc-cc-idle{background:var(--ipc-card-bg);border:1px solid var(--ipc-card-border)}
        .ipc-cc-checking{background:var(--ipc-accent-light);border:1px solid rgba(9,145,178,.2)}
        .ipc-cc-ok{background:#ECFDF5;border:1px solid #BBF7D0}
        .ipc-cc-fail{background:#FFF1F2;border:1px solid #FECDD3}
        .ipc-cc-name{font-size:14px;font-weight:800;margin-bottom:5px}
        .ipc-cc-status{font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:4px}
        .ipc-cs-ok{color:#059669}
        .ipc-cs-checking{color:var(--ipc-accent)}
        .ipc-cs-fail{color:#E11D48}
        .ipc-cs-idle{color:var(--ipc-muted)}
        .ipc-cc-detail{font-size:11px;color:var(--ipc-muted);margin-top:5px;line-height:1.5}
        .ipc-level-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
        .ipc-level-card{background:var(--ipc-card-bg);border:1px solid var(--ipc-card-border);border-radius:8px;padding:16px;box-shadow:var(--ipc-sw)}
        .ipc-lc-label{font-size:11px;font-weight:700;color:var(--ipc-muted);margin-bottom:9px;display:flex;align-items:center;gap:5px}
        .ipc-lc-track{height:5px;border-radius:3px;background:var(--ipc-card-border);overflow:hidden;margin-bottom:5px}
        .ipc-lc-fill{height:100%;border-radius:3px;transition:width 1s ease}
        .ipc-fill-cyan{background:var(--ipc-accent)}
        .ipc-fill-amber{background:#F59E0B}
        .ipc-fill-green{background:#10B981}
        .ipc-lc-val{font-size:11px;font-weight:700;color:var(--ipc-fg)}
        .ipc-cam-section{background:#fff;border:1px solid var(--ipc-card-border);border-radius:8px;padding:22px;box-shadow:var(--ipc-sc);margin-bottom:20px}
        .ipc-cam-sec-title{font-size:13px;font-weight:800;margin-bottom:14px}
        .ipc-cam-layout{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
        .ipc-cam-video{aspect-ratio:16/9;background:#0A0A0A;border-radius:8px;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center}
        .ipc-cam-guide{position:absolute;width:90px;height:110px;border:1.5px solid rgba(255,255,255,.25);border-radius:50%;top:50%;left:50%;transform:translate(-50%,-55%)}
        .ipc-cam-placeholder{text-align:center;color:rgba(255,255,255,.35)}
        .ipc-cam-pl-icon{font-size:32px;margin-bottom:6px}
        .ipc-cam-pl-text{font-size:12px;font-weight:500}
        .ipc-cam-live{position:absolute;top:10px;left:10px;display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:#fff;background:rgba(225,29,72,.85);padding:3px 9px;border-radius:100px;backdrop-filter:blur(6px)}
        .ipc-live-dot{width:5px;height:5px;border-radius:50%;background:#fff;animation:ipc-blink 1s ease infinite}
        .ipc-cam-tips{display:flex;flex-direction:column;gap:8px}
        .ipc-cam-tip{display:flex;align-items:flex-start;gap:9px;padding:10px 12px;background:var(--ipc-card-bg);border:1px solid var(--ipc-card-border);border-radius:8px}
        .ipc-ct-icon{font-size:13px;flex-shrink:0;margin-top:1px}
        .ipc-ct-text{font-size:12px;color:var(--ipc-muted);line-height:1.45}
        .ipc-ct-text strong{color:var(--ipc-fg);font-weight:700}
        .ipc-recap{background:var(--ipc-card-bg);border:1px solid var(--ipc-card-border);border-radius:8px;padding:14px 18px;box-shadow:var(--ipc-sw);margin-bottom:24px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .ipc-recap-label{font-size:12px;color:var(--ipc-muted);font-weight:500;margin-right:2px}
        .ipc-recap-chip{font-size:12px;font-weight:700;color:var(--ipc-fg);background:#fff;border:1px solid var(--ipc-card-border);padding:4px 10px;border-radius:100px}
        .ipc-recap-chip.ipc-accent{color:var(--ipc-accent);background:var(--ipc-accent-light);border-color:rgba(9,145,178,.15)}
        .ipc-start-sec{text-align:center;padding-bottom:12px}
        .ipc-btn-start-main{display:inline-flex;align-items:center;gap:9px;font-family:'Inter',sans-serif;font-size:16px;font-weight:800;color:var(--ipc-btn-fg);background:var(--ipc-btn-bg);border:none;border-radius:8px;padding:17px 44px;cursor:pointer;box-shadow:var(--ipc-sch);transition:all .2s}
        .ipc-btn-start-main:hover:not(:disabled){opacity:.88;transform:translateY(-2px)}
        .ipc-btn-start-main:active:not(:disabled){transform:scale(.97)}
        .ipc-btn-start-main:disabled{background:#D1D5DB;color:#9CA3AF;cursor:not-allowed;box-shadow:none}
        .ipc-start-hint{font-size:12px;color:var(--ipc-muted);margin-top:10px}
        .ipc-btn-start-back{font-size:13px;font-weight:600;color:var(--ipc-muted);background:none;border:none;cursor:pointer;display:block;margin:10px auto 0;text-decoration:underline;text-decoration-color:var(--ipc-card-border)}
        .ipc-btn-start-back:hover{color:var(--ipc-fg)}
        .ipc-spin{display:inline-block;animation:ipc-spin 1s linear infinite}
        @media(max-width:768px){.ipc-precheck{padding:24px 16px 48px}.ipc-check-grid{grid-template-columns:1fr 1fr}.ipc-level-row{grid-template-columns:1fr 1fr}.ipc-cam-layout{grid-template-columns:1fr}}
        @media(max-width:480px){.ipc-nav{padding:0 16px}.ipc-check-grid{grid-template-columns:1fr}.ipc-level-row{grid-template-columns:1fr}}
      `;

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

  const rvStyle = (delayMs: number): React.CSSProperties => ({
    transitionDelay: revealed ? `${delayMs}ms` : "0ms",
  });

  /* ── card class helpers ── */
  const camCardClass = () => {
    if (cameraStatus === "ok") return "ipc-check-card ipc-ok";
    if (cameraStatus === "checking") return "ipc-check-card ipc-checking";
    if (cameraStatus === "fail") return "ipc-check-card ipc-fail";
    return "ipc-check-card";
  };
  const micCardClass = () => {
    if (micStatus === "ok") return "ipc-check-card ipc-ok";
    if (micStatus === "checking") return "ipc-check-card ipc-checking";
    if (micStatus === "fail") return "ipc-check-card ipc-fail";
    return "ipc-check-card";
  };
  const netCardClass = () => {
    if (networkStatus === "ok") return "ipc-check-card ipc-ok";
    if (networkStatus === "checking") return "ipc-check-card ipc-checking";
    if (networkStatus === "fail") return "ipc-check-card ipc-fail";
    return "ipc-check-card";
  };

  const indClass = (s: string) => {
    if (s === "ok") return "ipc-cc-indicator ipc-ind-ok";
    if (s === "checking") return "ipc-cc-indicator ipc-ind-checking";
    if (s === "fail") return "ipc-cc-indicator ipc-ind-fail";
    return "ipc-cc-indicator ipc-ind-idle";
  };

  const iconClass = (s: string) => {
    if (s === "ok") return "ipc-cc-icon ipc-cc-ok";
    if (s === "checking") return "ipc-cc-icon ipc-cc-checking";
    if (s === "fail") return "ipc-cc-icon ipc-cc-fail";
    return "ipc-cc-icon ipc-cc-idle";
  };

  const statusEl = (s: string, okText: string, checkText = "⟳ 측정 중...") => {
    if (s === "ok") return <div className="ipc-cc-status ipc-cs-ok">✓ {okText}</div>;
    if (s === "checking") return <div className="ipc-cc-status ipc-cs-checking">{checkText}</div>;
    if (s === "fail") return <div className="ipc-cc-status ipc-cs-fail">✕ 오류 발생</div>;
    return <div className="ipc-cc-status ipc-cs-idle">대기 중</div>;
  };

  return (
    <>
      <style>{IPC_STYLES}</style>
      
      {/* ── NAV ── */}
      <nav className="ipc-nav">
        <a className="ipc-nav-logo" href="/home">me<span className="ipc-hi">Fit</span></a>
        <a className="ipc-nav-link" href="/home">홈</a>
        <a className="ipc-nav-link" href="#">이력서</a>
        <a className="ipc-nav-link" href="#">채용공고</a>
        <a className="ipc-btn-primary" href="/interview/setup">면접 설정</a>
      </nav>

      <div className="ipc-precheck">

        {/* ── BREADCRUMB ── */}
        <div className="ipc-breadcrumb">
          <a href="/home">홈</a>
          <span className="ipc-bc-sep">/</span>
          <a href="/interview/setup">면접 설정</a>
          <span className="ipc-bc-sep">/</span>
          <span className="ipc-bc-cur">환경 점검</span>
        </div>

        {/* ── STEPPER ── */}
        <div className="ipc-stepper">
          <div className="ipc-step-item">
            <div className="ipc-step-circle ipc-sc-done">✓</div>
            <span className="ipc-step-label-text">지원 컨텍스트</span>
          </div>
          <div className="ipc-step-line ipc-done"></div>
          <div className="ipc-step-item">
            <div className="ipc-step-circle ipc-sc-done">✓</div>
            <span className="ipc-step-label-text">면접 방식</span>
          </div>
          <div className="ipc-step-line ipc-done"></div>
          <div className="ipc-step-item">
            <div className="ipc-step-circle ipc-sc-active">3</div>
            <span className="ipc-step-label-text ipc-active">환경 점검</span>
          </div>
        </div>

        {/* ── HEADER ── */}
        <div className="ipc-pch-header">
          <div className="ipc-pch-eyebrow">사전 환경 점검</div>
          <h1 className="ipc-pch-title">면접 전 준비를 확인할게요</h1>
          <p className="ipc-pch-sub">카메라, 마이크, 네트워크를 자동으로 점검해요. 좋은 환경이 좋은 결과로 이어집니다.</p>
        </div>

        {/* ── PERMISSION BANNER ── */}
        <div
          className={`ipc-perm-bar ipc-pb-ok ipc-rv${revealed ? " ipc-rv-in" : ""}`}
          style={rvStyle(0)}
        >
          <span className="ipc-pb-icon">✅</span>
          <div className="ipc-pb-text"><strong>카메라 및 마이크 권한이 허용됐어요.</strong> 테스트 영상은 저장되지 않습니다.</div>
        </div>

        {/* ── CHECK CARDS ── */}
        <div className="ipc-check-grid">
          {/* Camera card */}
          <div className={`${camCardClass()} ipc-rv${revealed ? " ipc-rv-in" : ""}`} style={rvStyle(55)}>
            <div className={indClass(cameraStatus)}></div>
            <div className={iconClass(cameraStatus)}>📷</div>
            <div className="ipc-cc-name">카메라</div>
            {statusEl(cameraStatus, "정상 감지")}
            <div className="ipc-cc-detail">
              {cameraStatus === "ok" && cameraInfo
                ? <>{cameraInfo.resolution} · {cameraInfo.deviceName}<br />얼굴 인식 활성화</>
                : <>카메라 점검 중<br />잠시만 기다려주세요</>
              }
            </div>
          </div>

          {/* Mic card */}
          <div className={`${micCardClass()} ipc-rv${revealed ? " ipc-rv-in" : ""}`} style={rvStyle(110)}>
            <div className={indClass(micStatus)}></div>
            <div className={iconClass(micStatus)}>🎙️</div>
            <div className="ipc-cc-name">마이크</div>
            {statusEl(micStatus, "정상 감지")}
            <div className="ipc-cc-detail">
              {micStatus === "ok" && micInfo
                ? <>{micInfo.deviceName}<br />입력 레벨 양호</>
                : <>마이크 점검 중<br />잠시만 기다려주세요</>
              }
            </div>
          </div>

          {/* Network card */}
          <div className={`${netCardClass()} ipc-rv${revealed ? " ipc-rv-in" : ""}`} style={rvStyle(165)}>
            <div className={indClass(networkStatus)}></div>
            <div className={iconClass(networkStatus)}>🌐</div>
            <div className="ipc-cc-name">네트워크</div>
            {networkStatus === "checking"
              ? <div className="ipc-cc-status ipc-cs-checking">⟳ 측정 중...</div>
              : networkStatus === "ok"
                ? <div className="ipc-cc-status ipc-cs-ok">✓ 정상 연결</div>
                : <div className="ipc-cc-status ipc-cs-idle">대기 중</div>
            }
            <div className="ipc-cc-detail">
              {networkStatus === "ok"
                ? <>응답속도 {networkLatency} · 안정적<br />TTS·STT 서버 연결 완료</>
                : <>TTS·STT 서버 연결<br />속도 테스트 중</>
              }
            </div>
          </div>
        </div>

        {/* ── LEVEL METERS ── */}
        <div
          className={`ipc-level-row ipc-rv${revealed ? " ipc-rv-in" : ""}`}
          style={rvStyle(220)}
        >
          <div className="ipc-level-card">
            <div className="ipc-lc-label">🎙️ 마이크 레벨</div>
            <div className="ipc-lc-track">
              <div className="ipc-lc-fill ipc-fill-green" style={{ width: `${micLevel}%` }}></div>
            </div>
            <div className="ipc-lc-val">{micLevel} dB — 양호</div>
          </div>
          <div className="ipc-level-card">
            <div className="ipc-lc-label">🌐 네트워크 속도</div>
            <div className="ipc-lc-track">
              <div className="ipc-lc-fill ipc-fill-cyan" style={{ width: `${networkProgress}%` }}></div>
            </div>
            <div className="ipc-lc-val">
              {networkStatus === "ok" ? networkSpeed : "측정 중..."}
            </div>
          </div>
          <div className="ipc-level-card">
            <div className="ipc-lc-label">💡 조명 밝기</div>
            <div className="ipc-lc-track">
              <div className="ipc-lc-fill ipc-fill-amber" style={{ width: "83%" }}></div>
            </div>
            <div className="ipc-lc-val">83% — 밝음</div>
          </div>
        </div>

        {/* ── CAMERA PREVIEW ── */}
        <div
          className={`ipc-cam-section ipc-rv${revealed ? " ipc-rv-in" : ""}`}
          style={rvStyle(275)}
        >
          <div className="ipc-cam-sec-title">📹 카메라 미리보기</div>
          <div className="ipc-cam-layout">
            <div className="ipc-cam-video">
              <div className="ipc-cam-guide"></div>
              <div className="ipc-cam-placeholder">
                <div className="ipc-cam-pl-icon">👤</div>
                <div className="ipc-cam-pl-text">카메라 연결 중</div>
              </div>
              <div className="ipc-cam-live">
                <div className="ipc-live-dot"></div>LIVE
              </div>
            </div>
            <div className="ipc-cam-tips">
              <div className="ipc-cam-tip">
                <span className="ipc-ct-icon">💡</span>
                <div className="ipc-ct-text"><strong>조명</strong>은 얼굴 앞에서 비추도록 하세요. 역광은 인식률을 낮춥니다.</div>
              </div>
              <div className="ipc-cam-tip">
                <span className="ipc-ct-icon">👁️</span>
                <div className="ipc-ct-text"><strong>카메라를 정면으로</strong> 바라보세요. 시선 이탈은 자신감 점수에 영향을 줍니다.</div>
              </div>
              <div className="ipc-cam-tip">
                <span className="ipc-ct-icon">🎙️</span>
                <div className="ipc-ct-text"><strong>조용한 환경</strong>에서 진행하세요. 배경 소음은 STT 정확도를 낮춥니다.</div>
              </div>
              <div className="ipc-cam-tip">
                <span className="ipc-ct-icon">📐</span>
                <div className="ipc-ct-text"><strong>얼굴을 가이드 원 안</strong>에 맞춰 위치를 조정해주세요.</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RECAP CHIPS ── */}
        <div
          className={`ipc-recap ipc-rv${revealed ? " ipc-rv-in" : ""}`}
          style={rvStyle(330)}
        >
          <span className="ipc-recap-label">설정 확인</span>
          <span className="ipc-recap-chip ipc-accent">카카오뱅크</span>
          <span className="ipc-recap-chip">백엔드 개발자</span>
          <span className="ipc-recap-chip">1차 면접</span>
          <span className="ipc-recap-chip ipc-accent">꼬리질문</span>
          <span className="ipc-recap-chip">연습 모드</span>
        </div>

        {/* ── START SECTION ── */}
        <div
          className={`ipc-start-sec ipc-rv${revealed ? " ipc-rv-in" : ""}`}
          style={rvStyle(385)}
        >
          <button
            className="ipc-btn-start-main"
            disabled={!allPassed}
          >
            {allPassed
              ? <><span>🎬</span><span>면접 시작하기</span></>
              : <><span className="ipc-spin">⟳</span><span>환경 점검 중...</span></>
            }
          </button>
          <div className="ipc-start-hint">
            {allPassed
              ? "모든 환경 점검이 완료됐어요. 면접을 시작하세요!"
              : "네트워크 속도를 측정하고 있어요. 잠시만 기다려주세요."
            }
          </div>
          <button className="ipc-btn-start-back" onClick={() => history.back()}>
            ← 설정으로 돌아가기
          </button>
        </div>

      </div>
    </>
  );
}
