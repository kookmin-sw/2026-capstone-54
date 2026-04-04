import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useResumeUploadStore } from "@/features/resume-upload";

const MAX_FILE_MB = 10;

const INFO_CARDS = [
  { icon: "🤖", title: "AI 자동 분석", desc: "기술 스택, 경력, 역량 자동 추출" },
  { icon: "🎯", title: "맞춤 질문 생성", desc: "내 경력에 딱 맞는 면접 질문" },
  { icon: "🔒", title: "개인정보 보호", desc: "암호화 저장, 본인만 열람 가능" },
  { icon: "📚", title: "버전 관리", desc: "직무별로 다른 이력서 등록" },
];

const AI_STEPS = [
  { cls: "ru-asi-blue",  icon: "📥", text: "파일에서 텍스트를 추출해요" },
  { cls: "ru-asi-cyan",  icon: "🔍", text: "기술 스택, 경력 기간을 파악해요" },
  { cls: "ru-asi-green", icon: "✨", text: "직무 맞춤 면접 질문을 생성해요" },
];

const TIPS = [
  { dot: "📝", text: "텍스트가 추출 가능한 PDF를 사용해주세요 (스캔본 ✕)" },
  { dot: "🎯", text: "구체적인 수치와 성과를 포함하면 질문 품질이 높아져요" },
  { dot: "🔒", text: "개인정보는 마스킹 처리해도 분석에 지장 없어요" },
];

export function ResumeUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    title, file, isDragging, uploading, uploadPct, showSuccess, error,
    setTitle, setFile, removeFile, setDragging, upload, closeSuccess,
  } = useResumeUploadStore();

  const canUpload = !!file && !uploading;
  const ext = file ? file.name.split(".").pop()?.toUpperCase() ?? "" : "";
  const sizeMB = file ? (file.size / 1024 / 1024).toFixed(1) : "0";
  const titleError = error === "title";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      alert("10MB 이하 파일만 가능해요");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      alert("10MB 이하 파일만 가능해요");
      return;
    }
    setFile(f);
  };

  const handleRemove = () => {
    removeFile();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = () => {
    if (titleError || !title.trim()) {
      document.getElementById("ru-title-input")?.focus();
    }
    upload();
  };

  return (
    <div className="ru-root">

      {/* ── NAV ── */}
      <nav className="ru-nav">
        <div className="ru-nav-inner">
          <div className="ru-nav-left">
            <button className="ru-nav-back" onClick={() => navigate(-1)} aria-label="뒤로가기">←</button>
            <a href="/home" className="ru-logo">me<span>Fit</span></a>
          </div>
          <span className="ru-nav-title">이력서 등록</span>
          <div style={{ width: 36 }} />
        </div>
      </nav>

      {/* ── STEP BAR ── */}
      <div className="ru-stepbar">
        <div className="ru-stepbar-inner">
          <div className="ru-step">
            <div className="ru-sn ru-sn--done">✓</div>
            <span className="ru-sl">방식 선택</span>
          </div>
          <div className="ru-conn ru-conn--done" />
          <div className="ru-step">
            <div className="ru-sn ru-sn--act">2</div>
            <span className="ru-sl ru-sl--act">파일 업로드</span>
          </div>
          <div className="ru-conn" />
          <div className="ru-step">
            <div className="ru-sn ru-sn--idle">3</div>
            <span className="ru-sl">AI 분석</span>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="ru-wrap">

        {/* Page heading */}
        <div className="ru-heading-block">
          <div className="ru-eyebrow">📎 파일 업로드</div>
          <h1 className="ru-h1">이력서 파일을<br />업로드해주세요</h1>
          <p className="ru-sub">PDF 또는 DOCX 파일을 올리면 AI가 자동으로 내용을 분석해드려요</p>
        </div>

        {/* Method toggle */}
        <div className="ru-mtoggle-wrap">
          <div className="ru-mtoggle">
            <button className="ru-mt-btn ru-mt-btn--on">📎 파일 업로드</button>
            <button className="ru-mt-btn" onClick={() => navigate("/resume/input")}>✏️ 직접 입력</button>
          </div>
        </div>

        {/* 2-col grid */}
        <div className="ru-grid">

          {/* ── LEFT FORM ── */}
          <div className="ru-form-card">

            {/* Title field */}
            <div className="ru-field">
              <label className="ru-flbl" htmlFor="ru-title-input">
                이력서 제목 <span className="ru-req">*</span>
              </label>
              <input
                id="ru-title-input"
                className={`ru-finput${titleError ? " ru-finput--err" : ""}`}
                type="text"
                placeholder="예: 백엔드 개발자 이력서 v3"
                maxLength={40}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Upload zone */}
            <div
              className={`ru-zone${file ? " ru-zone--has" : ""}${isDragging ? " ru-zone--drag" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <span className="ru-zone-icon">{file ? "✅" : "📎"}</span>
              <div className="ru-zone-title">
                {file ? "파일이 선택됐어요!" : "이력서를 여기에 드롭하세요"}
              </div>
              <p className="ru-zone-hint">
                {file
                  ? <span onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>다른 파일로 <u>다시 선택</u></span>
                  : <>또는 <span>파일 직접 선택</span>하기</>
                }
              </p>
              <div className="ru-zone-types">
                <span className="ru-zt">PDF</span>
                <span className="ru-zt">DOCX</span>
                <span className="ru-zt">최대 10MB</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>

            {/* File preview */}
            {file && !uploading && (
              <div className="ru-fp">
                <div className="ru-fp-icon">{ext === "PDF" ? "📄" : "📝"}</div>
                <div className="ru-fp-info">
                  <div className="ru-fp-name">{file.name}</div>
                  <div className="ru-fp-size">{sizeMB} MB · {ext}</div>
                </div>
                <button className="ru-fp-del" onClick={handleRemove} aria-label="파일 삭제">✕</button>
              </div>
            )}

            {/* Upload progress */}
            {uploading && (
              <div className="ru-progress">
                <div className="ru-up-top">
                  <span className="ru-up-lbl">업로드 중…</span>
                  <span className="ru-up-pct">{uploadPct}%</span>
                </div>
                <div className="ru-prog-track">
                  <div className="ru-prog-bar" style={{ width: `${uploadPct}%` }} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && error !== "title" && (
              <div className="ru-error">{error}</div>
            )}

            {/* CTA (desktop: inside card) */}
            <div className="ru-cta-inline">
              <button className="ru-cta-btn" disabled={!canUpload} onClick={handleUpload}>
                {uploading
                  ? <><span className="ru-cta-spin" />업로드 중…</>
                  : file
                  ? "✅  이 이력서로 등록하기"
                  : "📎 파일을 선택해주세요"
                }
              </button>
            </div>

            <button className="ru-skip" onClick={() => navigate("/interview/setup")}>
              이력서 없이 면접 시작하기 →
            </button>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="ru-sidebar">

            {/* Info 2x2 grid */}
            <div className="ru-info-grid">
              {INFO_CARDS.map((c) => (
                <div key={c.title} className="ru-info-card">
                  <span className="ru-ic-emoji">{c.icon}</span>
                  <div className="ru-ic-title">{c.title}</div>
                  <div className="ru-ic-desc">{c.desc}</div>
                </div>
              ))}
            </div>

            {/* AI preview card */}
            <div className="ru-ai-card">
              <div className="ru-ai-hd">
                <span className="ru-ai-dot" />
                <span className="ru-ai-lbl">업로드 후 자동으로 진행</span>
              </div>
              <div className="ru-ai-title">AI가 이런 작업을 해드려요</div>
              <div className="ru-ai-steps">
                {AI_STEPS.map((s, i) => (
                  <div key={i} className="ru-ai-step">
                    <div className={`ru-as-icon ${s.cls}`}>{s.icon}</div>
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
              <div className="ru-divider" />
              <div className="ru-tip-title">💡 더 좋은 결과를 위한 팁</div>
              <div className="ru-tip-list">
                {TIPS.map((t, i) => (
                  <div key={i} className="ru-tip-item">
                    <div className="ru-tip-dot">{t.dot}</div>
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── MOBILE FIXED CTA ── */}
      <div className="ru-cta-bar">
        <button className="ru-cta-btn" disabled={!canUpload} onClick={handleUpload}>
          {uploading
            ? <><span className="ru-cta-spin" />업로드 중…</>
            : file
            ? "✅  이 이력서로 등록하기"
            : "📎 파일을 선택해주세요"
          }
        </button>
      </div>

      {/* ── SUCCESS MODAL ── */}
      {showSuccess && (
        <div className="ru-ov" onClick={closeSuccess}>
          <div className="ru-ss" onClick={(e) => e.stopPropagation()}>
            <span className="ru-ss-em">🎉</span>
            <div className="ru-ss-ttl">이력서 업로드 완료!</div>
            <div className="ru-ss-desc">
              AI가 지금 이력서를 분석하고 있어요.<br />분석이 끝나면 맞춤 질문이 준비돼요 😊
            </div>
            <button className="ru-ss-p" onClick={() => navigate("/resume")}>이력서 목록 보기</button>
            <button className="ru-ss-s" onClick={() => navigate("/interview/setup")}>바로 면접 시작하기</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ru-fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ru-bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ru-spin    { to{transform:rotate(360deg)} }
        @keyframes ru-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(9,145,178,.35)} 50%{box-shadow:0 0 0 6px rgba(9,145,178,0)} }
        @keyframes ru-liveDot { 0%,100%{box-shadow:0 0 0 0 rgba(5,150,105,.3)} 50%{box-shadow:0 0 0 5px rgba(5,150,105,0)} }
        @keyframes ru-slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }

        /* ROOT */
        .ru-root {
          background: #FFFFFF;
          font-family: 'Inter', sans-serif;
          color: #0A0A0A;
          min-height: 100vh;
          padding-bottom: 100px;
          -webkit-font-smoothing: antialiased;
        }

        /* NAV */
        .ru-nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid #E5E7EB;
        }
        .ru-nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 24px; height: 64px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .ru-nav-left { display: flex; align-items: center; gap: 10px; }
        .ru-nav-back {
          width: 36px; height: 36px; border-radius: 14px;
          background: #F9FAFB; border: 1px solid #E5E7EB;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: var(--sw); color: #0A0A0A; font-size: 18px; transition: background .15s;
        }
        .ru-nav-back:hover { background: #F3F4F6; }
        .ru-logo {
          font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 900;
          color: #0A0A0A; text-decoration: none;
        }
        .ru-logo span { color: #0991B2; }
        .ru-nav-title { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 800; color: #0A0A0A; }
        @media(min-width:768px){ .ru-nav-title{font-size:18px} }

        /* STEP BAR */
        .ru-stepbar {
          background: rgba(255,255,255,.5);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #E5E7EB;
        }
        .ru-stepbar-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 14px 24px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        @media(min-width:768px){ .ru-stepbar-inner{gap:12px;padding:16px 32px} }
        .ru-step { display: flex; align-items: center; gap: 6px; }
        .ru-sn {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; flex-shrink: 0;
        }
        .ru-sn--done { background: #059669; color: #fff; }
        .ru-sn--act  { background: #0991B2; color: #fff; animation: ru-pulse 2s infinite; }
        .ru-sn--idle { background: #F3F4F6; color: #9CA3AF; }
        .ru-sl       { font-size: 12px; font-weight: 700; color: #9CA3AF; }
        .ru-sl--act  { color: #0991B2; }
        .ru-conn { height: 2px; width: 28px; background: #E5E7EB; border-radius: 2px; flex-shrink: 0; }
        .ru-conn--done { background: #059669; }
        @media(min-width:768px){ .ru-sl{font-size:13px} .ru-conn{width:48px} }

        /* MAIN WRAP */
        .ru-wrap {
          max-width: 1200px; margin: 0 auto;
          padding: 40px 24px 0;
        }
        @media(min-width:768px){ .ru-wrap{padding:48px 32px 0} }

        /* PAGE HEADING */
        .ru-heading-block {
          padding-bottom: 28px; animation: ru-fadeUp .45s ease .05s both;
        }
        @media(min-width:768px){ .ru-heading-block{text-align:center;padding-bottom:36px} }
        .ru-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
          color: #0991B2; background: #E6F7FA;
          padding: 4px 12px; border-radius: 100px; margin-bottom: 10px;
        }
        .ru-h1 {
          font-family: 'Inter', sans-serif;
          font-size: clamp(26px, 4vw, 44px); font-weight: 900;
          line-height: 1.1; letter-spacing: -0.5px; margin-bottom: 8px;
        }
        .ru-sub { font-size: 14px; color: #6B7280; line-height: 1.65; }
        @media(min-width:768px){ .ru-sub{font-size:16px} }

        /* METHOD TOGGLE */
        .ru-mtoggle-wrap {
          display: flex; justify-content: center; margin-bottom: 32px;
          animation: ru-fadeUp .45s ease .08s both;
        }
        .ru-mtoggle {
          display: flex; background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 16px; padding: 4px; box-shadow: var(--sw);
          width: 100%; max-width: 480px;
        }
        .ru-mt-btn {
          flex: 1; padding: 11px 0; border: none; border-radius: 13px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all .2s; color: #6B7280; background: transparent;
        }
        .ru-mt-btn--on { background: #0A0A0A; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.18); }
        @media(min-width:768px){ .ru-mt-btn{font-size:14px;padding:13px 0} }

        /* 2-COL GRID */
        .ru-grid {
          display: grid; grid-template-columns: 1fr; gap: 20px;
          max-width: 900px; margin: 0 auto;
        }
        @media(min-width:900px){ .ru-grid{grid-template-columns:1.2fr 1fr;gap:28px;align-items:start} }

        /* FORM CARD */
        .ru-form-card {
          background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 24px; padding: 24px; box-shadow: var(--sc);
          animation: ru-fadeUp .45s ease .1s both;
        }
        @media(min-width:768px){ .ru-form-card{border-radius:28px;padding:32px} }

        /* FIELD */
        .ru-field { margin-bottom: 18px; }
        .ru-flbl {
          font-size: 12px; font-weight: 700; color: #6B7280;
          margin-bottom: 7px; display: flex; align-items: center; letter-spacing: .04em;
        }
        .ru-req { color: #DC2626; margin-left: 3px; }
        .ru-finput {
          width: 100%; padding: 14px 16px; border-radius: 10px;
          border: 1px solid #E5E7EB; background: #FFFFFF;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
          color: #0A0A0A; outline: none; transition: border-color .2s, box-shadow .2s;
          box-sizing: border-box;
        }
        .ru-finput:focus { border-color: #0991B2; box-shadow: 0 0 0 3px rgba(9,145,178,.12); }
        .ru-finput::placeholder { color: #D1D5DB; }
        .ru-finput--err { border-color: #DC2626; box-shadow: 0 0 0 3px rgba(220,38,38,.1); }
        @media(min-width:768px){ .ru-finput{font-size:15px;padding:15px 18px} }

        /* UPLOAD ZONE */
        .ru-zone {
          border: 2px dashed #E5E7EB; border-radius: 18px;
          padding: 36px 24px; text-align: center; background: #FFFFFF;
          cursor: pointer; transition: all .25s; position: relative;
          overflow: hidden; margin-bottom: 16px;
        }
        @media(min-width:768px){ .ru-zone{padding:48px 40px;border-radius:20px} }
        .ru-zone:hover { border-color: #0991B2; background: rgba(9,145,178,.03); }
        .ru-zone--drag { border-color: #0991B2; background: rgba(9,145,178,.05); transform: scale(1.01); }
        .ru-zone--has  { border-color: #059669; background: rgba(16,185,129,.03); cursor: default; }
        .ru-zone-icon  { font-size: clamp(36px,6vw,52px); margin-bottom: 12px; display: block; animation: ru-bounce 3s ease-in-out infinite; }
        .ru-zone-title { font-family: 'Inter', sans-serif; font-size: clamp(14px,2vw,17px); font-weight: 800; margin-bottom: 6px; }
        .ru-zone-hint  { font-size: 13px; color: #6B7280; margin-bottom: 14px; cursor: pointer; }
        .ru-zone-hint span, .ru-zone-hint u { color: #0991B2; font-weight: 700; text-decoration: underline; text-underline-offset: 2px; }
        .ru-zone-types { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
        .ru-zt { font-size: 11px; font-weight: 700; color: #6B7280; background: #F3F4F6; padding: 4px 11px; border-radius: 100px; }

        /* FILE PREVIEW */
        .ru-fp {
          display: flex; align-items: center; gap: 12px;
          background: #FFFFFF; border: 1px solid #E5E7EB;
          border-radius: 14px; padding: 14px 16px; margin-bottom: 16px;
          box-shadow: var(--sc); animation: ru-fadeUp .3s ease both;
        }
        .ru-fp-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, #BAE6FD, #2563EB);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .ru-fp-info { flex: 1; min-width: 0; }
        .ru-fp-name { font-size: 14px; font-weight: 700; color: #0A0A0A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ru-fp-size { font-size: 12px; color: #6B7280; margin-top: 2px; }
        .ru-fp-del {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(239,68,68,.1); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #EF4444; font-size: 13px; flex-shrink: 0; transition: background .15s;
        }
        .ru-fp-del:hover { background: rgba(239,68,68,.18); }

        /* UPLOAD PROGRESS */
        .ru-progress {
          background: #FFFFFF; border: 1px solid #E5E7EB;
          border-radius: 14px; padding: 16px; margin-bottom: 16px; box-shadow: var(--sc);
        }
        .ru-up-top { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .ru-up-lbl { font-size: 13px; font-weight: 700; color: #0A0A0A; }
        .ru-up-pct { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; color: #0991B2; }
        .ru-prog-track { height: 8px; background: #E5E7EB; border-radius: 100px; overflow: hidden; }
        .ru-prog-bar {
          height: 100%; border-radius: 100px;
          background: linear-gradient(90deg, #06B6D4, #0991B2); transition: width .4s ease;
        }

        /* ERROR */
        .ru-error {
          font-size: 12px; color: #DC2626; font-weight: 600;
          padding: 9px 14px; border-radius: 10px;
          background: #FEF2F2; border: 1px solid #FECACA; margin-bottom: 12px;
        }

        /* CTA INLINE (desktop only) */
        .ru-cta-inline { display: none; margin-top: 4px; }
        @media(min-width:768px){ .ru-cta-inline{display:block} }

        /* SKIP */
        .ru-skip {
          display: block; width: 100%; text-align: center;
          font-family: 'Inter', sans-serif; font-size: 13px; color: #9CA3AF;
          font-weight: 600; padding: 14px; cursor: pointer;
          background: none; border: none;
          text-decoration: underline; text-underline-offset: 2px; transition: color .2s;
        }
        .ru-skip:hover { color: #6B7280; }

        /* SIDEBAR */
        .ru-sidebar { display: flex; flex-direction: column; gap: 16px; animation: ru-fadeUp .45s ease .18s both; }
        @media(min-width:900px){ .ru-sidebar{position:sticky;top:80px} }

        /* INFO GRID */
        .ru-info-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          margin-bottom: 0;
        }
        @media(min-width:768px){ .ru-info-grid{gap:12px} }
        .ru-info-card {
          background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 16px; padding: 14px; box-shadow: var(--sw);
        }
        @media(min-width:768px){ .ru-info-card{border-radius:18px;padding:18px} }
        .ru-ic-emoji { font-size: 20px; margin-bottom: 6px; display: block; }
        @media(min-width:768px){ .ru-ic-emoji{font-size:22px;margin-bottom:8px} }
        .ru-ic-title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; margin-bottom: 3px; }
        .ru-ic-desc  { font-size: 11px; color: #6B7280; line-height: 1.55; }
        @media(min-width:768px){ .ru-ic-desc{font-size:12px} }

        /* AI CARD */
        .ru-ai-card {
          background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 20px; padding: 20px; box-shadow: var(--sc);
        }
        @media(min-width:768px){ .ru-ai-card{border-radius:24px;padding:28px} }
        .ru-ai-hd   { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .ru-ai-dot  { width: 8px; height: 8px; border-radius: 50%; background: #059669; animation: ru-liveDot 2s infinite; }
        .ru-ai-lbl  { font-size: 12px; font-weight: 700; color: #059669; }
        .ru-ai-title{ font-family: 'Inter', sans-serif; font-size: clamp(14px,1.8vw,16px); font-weight: 800; margin-bottom: 14px; }
        .ru-ai-steps{ display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .ru-ai-step { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #6B7280; font-weight: 500; }
        .ru-as-icon {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }
        .ru-asi-blue  { background: linear-gradient(135deg,#BAE6FD,#38BDF8); }
        .ru-asi-cyan  { background: linear-gradient(135deg,#CFFAFE,#0991B2); }
        .ru-asi-green { background: linear-gradient(135deg,#A7F3D0,#34D399); }
        .ru-divider   { height: 1px; background: #E5E7EB; margin: 16px 0; }
        .ru-tip-title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; margin-bottom: 10px; }
        .ru-tip-list  { display: flex; flex-direction: column; gap: 8px; }
        .ru-tip-item  {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 12px; color: #6B7280; line-height: 1.55; font-weight: 500;
        }
        .ru-tip-dot {
          width: 22px; height: 22px; border-radius: 7px;
          background: #E6F7FA; display: flex; align-items: center; justify-content: center;
          font-size: 11px; flex-shrink: 0; margin-top: 1px;
        }

        /* MOBILE FIXED CTA */
        .ru-cta-bar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
          padding: 12px 24px max(20px, env(safe-area-inset-bottom));
          background: rgba(255,255,255,.95);
          backdrop-filter: blur(24px);
          border-top: 1px solid #E5E7EB;
        }
        @media(min-width:768px){ .ru-cta-bar{display:none} }

        /* CTA BUTTON (shared) */
        .ru-cta-btn {
          width: 100%; padding: 16px; border: none; border-radius: 16px;
          cursor: pointer; font-family: 'Inter', sans-serif;
          font-size: 16px; font-weight: 900;
          background: #0A0A0A; color: #fff;
          box-shadow: var(--sb); transition: opacity .15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .ru-cta-btn:hover:not(:disabled){ opacity:.85 }
        .ru-cta-btn:active:not(:disabled){ transform:scale(.97) }
        .ru-cta-btn:disabled{ opacity:.4;cursor:not-allowed }
        .ru-cta-spin {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,.35); border-top-color: #fff;
          animation: ru-spin .7s linear infinite;
        }

        /* SUCCESS MODAL */
        .ru-ov {
          position: fixed; inset: 0; z-index: 400;
          background: rgba(0,0,0,.25); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .ru-ss {
          background: #FFFFFF; border-radius: 28px;
          padding: 40px 32px; text-align: center;
          max-width: 440px; width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,.15);
          animation: ru-slideUp .4s cubic-bezier(.4,0,.2,1) both;
        }
        .ru-ss-em   { font-size: 64px; display: block; margin-bottom: 16px; }
        .ru-ss-ttl  { font-family: 'Inter', sans-serif; font-size: 26px; font-weight: 900; color: #0A0A0A; margin-bottom: 8px; }
        .ru-ss-desc { font-size: 14px; color: #6B7280; line-height: 1.65; margin-bottom: 28px; }
        .ru-ss-p {
          width: 100%; padding: 15px; border: none; border-radius: 16px;
          cursor: pointer; font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 900;
          background: #0A0A0A; color: #fff;
          box-shadow: var(--sb); margin-bottom: 10px; transition: opacity .2s;
        }
        .ru-ss-p:hover { opacity: .85; }
        .ru-ss-s {
          width: 100%; padding: 15px; border: 1px solid #0991B2;
          border-radius: 16px; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          background: #E6F7FA; color: #0991B2; transition: background .2s;
        }
        .ru-ss-s:hover { background: #cceef6; }
      `}</style>
    </div>
  );
}
