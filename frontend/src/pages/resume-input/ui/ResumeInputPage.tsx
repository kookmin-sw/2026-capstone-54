import { useNavigate } from "react-router-dom";
import { useResumeInputStore } from "@/features/resume";

const MAX_CONTENT = 5000;
const MAX_TITLE = 40;
const PROGRESS_THRESHOLD = 200;

const CHIPS = [
  { key: "fe", icon: "🎨", label: "프론트엔드" },
  { key: "be", icon: "⚙️", label: "백엔드" },
  { key: "fs", icon: "🛠", label: "풀스택" },
  { key: "ds", icon: "✏️", label: "디자이너" },
  { key: "pm", icon: "📊", label: "PM" },
  { key: "nw", icon: "🌱", label: "신입" },
];

export function ResumeInputPage() {
  const navigate = useNavigate();
  const {
    title, content, detectedTags, previewSummary,
    showPreview, showCharWarn, isSubmitting, showSuccess, error,
    setTitle, setContent, applyTemplate, submit, closeSuccess,
  } = useResumeInputStore();

  const contentLen = content.length;
  const titleLen = title.length;
  const progressPct = Math.min((contentLen / PROGRESS_THRESHOLD) * 100, 100);
  const canSubmit = contentLen > 0 && !isSubmitting;

  const handleSubmit = () => {
    if (!title.trim()) {
      document.getElementById("ri-title-input")?.focus();
      return;
    }
    if (canSubmit) submit();
  };

  return (
    <div className="ri-root">

      {/* ── NAV ── */}
      <nav className="ri-nav">
        <div className="ri-nav-inner">
          <div className="ri-nav-left">
            <button className="ri-nav-back" onClick={() => navigate(-1)} aria-label="뒤로가기">←</button>
            <a href="/home" className="ri-logo">me<span>Fit</span></a>
          </div>
          <span className="ri-nav-title">이력서 등록</span>
          <div style={{ width: 36 }} />
        </div>
      </nav>

      {/* ── STEP BAR ── */}
      <div className="ri-stepbar">
        <div className="ri-stepbar-inner">
          <div className="ri-step">
            <div className="ri-sn ri-sn--done">✓</div>
            <span className="ri-sl">방식 선택</span>
          </div>
          <div className="ri-conn ri-conn--done" />
          <div className="ri-step">
            <div className="ri-sn ri-sn--act">2</div>
            <span className="ri-sl ri-sl--act">직접 입력</span>
          </div>
          <div className="ri-conn" />
          <div className="ri-step">
            <div className="ri-sn ri-sn--idle">3</div>
            <span className="ri-sl">AI 분석</span>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="ri-wrap">
        <div className="ri-layout">

          {/* ── LEFT FORM ── */}
          <div className="ri-form-col">

            {/* Method toggle */}
            <div className="ri-mtoggle">
              <button className="ri-mt-btn" onClick={() => navigate("/resume/upload")}>📎 파일 업로드</button>
              <button className="ri-mt-btn ri-mt-btn--on">✏️ 직접 입력</button>
            </div>

            <h1 className="ri-heading">경력을 자유롭게<br />적어주세요</h1>
            <p className="ri-sub">한 줄도 괜찮아요. 내용이 많을수록 더 정확한 면접 질문이 만들어져요 😊</p>

            {/* Title field */}
            <div className="ri-field">
              <label className="ri-flbl" htmlFor="ri-title-input">
                이력서 제목 <span className="ri-req">*</span>
                <span className="ri-fcnt">{titleLen}/{MAX_TITLE}</span>
              </label>
              <input
                id="ri-title-input"
                className={`ri-finput${error && !title.trim() ? " ri-finput--err" : ""}`}
                type="text"
                placeholder="예: 신입 프론트엔드 자기소개"
                maxLength={MAX_TITLE}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Template chips */}
            <div className="ri-tmpl">
              <span className="ri-tmpl-lbl">💡 빠른 템플릿으로 시작하기</span>
              <div className="ri-tmpl-chips">
                {CHIPS.map((c) => (
                  <button key={c.key} className="ri-tc" onClick={() => applyTemplate(c.key)}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="ri-ta-wrap">
              <textarea
                className="ri-ta"
                maxLength={MAX_CONTENT}
                placeholder={`예시)\n경력: 스타트업 백엔드 개발자 3년\n기술: Python, Django, PostgreSQL, Redis, AWS\n학력: 컴퓨터공학과 졸업 (2019~2023)\n\n주요 업무:\n- 월 500만 DAU 서비스의 API 설계 및 개발\n- 결제 시스템 도입 및 PG사 연동\n\n자기소개:\n기술적 문제 해결에 열정이 있으며 팀 소통을 중시합니다.`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <span className="ri-ta-cnt">{contentLen.toLocaleString()} / 5,000</span>
            </div>

            {/* Char warning */}
            {showCharWarn && (
              <div className="ri-warn">⚠️ 50자 이상 작성하면 더 정확한 질문이 만들어져요!</div>
            )}

            {/* Error */}
            {error && <div className="ri-error">{error}</div>}

            {/* Live preview */}
            {showPreview && (
              <div className="ri-lp">
                <div className="ri-lp-hd">
                  <span className="ri-lp-ttl">🤖 AI 실시간 미리보기</span>
                  <span className="ri-lp-live"><span className="ri-lp-dot" />Live</span>
                </div>
                <div className="ri-lp-tags">
                  {detectedTags.length === 0 ? (
                    <span className="ri-lp-notag">기술 스택을 입력하면 태그가 표시돼요</span>
                  ) : (
                    <>
                      {detectedTags.slice(0, 6).map((t, i) => (
                        <span key={i} className="ri-lp-tag" style={{ animationDelay: `${i * 0.05}s` }}>{t}</span>
                      ))}
                      {detectedTags.length > 6 && (
                        <span className="ri-lp-tag ri-lp-tag--more">+{detectedTags.length - 6}</span>
                      )}
                    </>
                  )}
                </div>
                <div className="ri-lp-sum">{previewSummary}</div>
              </div>
            )}

            <button className="ri-skip" onClick={() => navigate("/interview/setup")}>
              이력서 없이 면접 시작하기 →
            </button>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="ri-sidebar">

            {/* Stats card */}
            <div className="ri-card">
              <div className="ri-card-ttl">📊 작성 현황</div>
              <div className="ri-row">
                <span className="ri-row-lbl">작성 글자 수</span>
                <span className="ri-row-val">{contentLen}자</span>
              </div>
              <div className="ri-row">
                <span className="ri-row-lbl">감지된 기술 스택</span>
                <span className="ri-row-val">{detectedTags.length}개</span>
              </div>
              <div className="ri-row ri-row--last">
                <span className="ri-row-lbl">완성도</span>
                <span className="ri-row-val">{Math.min(Math.round(contentLen / PROGRESS_THRESHOLD * 100), 100)}%</span>
              </div>
            </div>

            {/* Hint card */}
            <div className="ri-card">
              <div className="ri-hc-hd">
                <div className="ri-hc-ico">💡</div>
                <span className="ri-card-ttl" style={{ margin: 0 }}>이렇게 작성하면 더 좋아요</span>
              </div>
              <div className="ri-hc-list">
                {[
                  { dot: "🎯", text: "구체적인 숫자나 성과를 포함하면 질문 깊이가 달라져요" },
                  { dot: "🛠", text: "기술 스택을 구체적으로 (React 18, TypeScript 5 등)" },
                  { dot: "📝", text: "자유 형식이라 형식에 구애받지 않아도 돼요" },
                  { dot: "🔒", text: "회사명 마스킹해도 분석에 지장 없어요" },
                ].map((h, i) => (
                  <div key={i} className="ri-hc-item">
                    <div className="ri-hc-dot">{h.dot}</div>
                    <span>{h.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample card */}
            <div className="ri-sample">
              <div className="ri-sample-ttl">✍️ 작성 예시</div>
              <pre className="ri-sample-txt">{`경력: 프론트엔드 2년 (스타트업)\n기술: React, TypeScript, Next.js\n학력: 컴공 졸업 (2022)\n\n- Lighthouse 45→92점 성능 개선\n- 디자인 시스템 구축\n- 코드 리뷰 문화 도입`}</pre>
            </div>

          </div>
        </div>
      </main>

      {/* ── BOTTOM CTA ── */}
      <div className="ri-cta">
        <div className="ri-cta-inner">
          <div className="ri-cta-prog">
            <div className="ri-cp-row">
              <span className="ri-cp-lbl">작성 완성도</span>
              <span className="ri-cp-val">{contentLen}자</span>
            </div>
            <div className="ri-cp-track">
              <div className="ri-cp-bar" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <button
            className="ri-cta-btn"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <><span className="ri-cta-spin" />저장 중...</>
            ) : contentLen > 0 ? (
              "✅  이력서 저장하기"
            ) : (
              "✏️ 내용을 입력해주세요"
            )}
          </button>
        </div>
      </div>

      {/* ── SUCCESS MODAL ── */}
      {showSuccess && (
        <div className="ri-ov" onClick={closeSuccess}>
          <div className="ri-ss" onClick={(e) => e.stopPropagation()}>
            <span className="ri-ss-em">🎉</span>
            <div className="ri-ss-ttl">이력서 저장 완료!</div>
            <div className="ri-ss-desc">
              AI가 지금 내용을 분석하고 있어요.<br />분석이 끝나면 알려드릴게요 😊
            </div>
            <button className="ri-ss-p" onClick={() => navigate("/resume")}>이력서 목록 보기</button>
            <button className="ri-ss-s" onClick={() => navigate("/interview/setup")}>바로 면접 시작하기</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ri-fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ri-pop     { 0%{transform:scale(.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes ri-spin    { to{transform:rotate(360deg)} }
        @keyframes ri-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(9,145,178,.35)} 50%{box-shadow:0 0 0 6px rgba(9,145,178,0)} }
        @keyframes ri-liveDot { 0%,100%{box-shadow:0 0 0 0 rgba(5,150,105,.3)} 50%{box-shadow:0 0 0 5px rgba(5,150,105,0)} }
        @keyframes ri-slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }

        /* ROOT */
        .ri-root {
          background: #FFFFFF;
          font-family: 'Inter', sans-serif;
          color: #0A0A0A;
          min-height: 100vh;
          padding-bottom: 100px;
          -webkit-font-smoothing: antialiased;
        }

        /* NAV */
        .ri-nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid #E5E7EB;
        }
        .ri-nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 24px; height: 64px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .ri-nav-left { display: flex; align-items: center; gap: 10px; }
        .ri-nav-back {
          width: 36px; height: 36px; border-radius: 14px;
          background: #F9FAFB; border: 1px solid #E5E7EB;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: var(--sw); color: #0A0A0A; font-size: 18px;
          transition: background .15s;
        }
        .ri-nav-back:hover { background: #F3F4F6; }
        .ri-logo {
          font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 900;
          color: #0A0A0A; text-decoration: none;
        }
        .ri-logo span { color: #0991B2; }
        .ri-nav-title {
          font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 800; color: #0A0A0A;
        }
        @media(min-width:768px){ .ri-nav-title{font-size:18px} }

        /* STEP BAR */
        .ri-stepbar {
          background: rgba(255,255,255,.5);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #E5E7EB;
        }
        .ri-stepbar-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 14px 24px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        @media(min-width:768px){ .ri-stepbar-inner{gap:12px;padding:16px 32px} }
        .ri-step { display: flex; align-items: center; gap: 6px; }
        .ri-sn {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; flex-shrink: 0;
        }
        .ri-sn--done { background: #059669; color: #fff; }
        .ri-sn--act  { background: #0991B2; color: #fff; animation: ri-pulse 2s infinite; }
        .ri-sn--idle { background: #F3F4F6; color: #9CA3AF; }
        .ri-sl       { font-size: 12px; font-weight: 700; color: #9CA3AF; }
        .ri-sl--act  { color: #0991B2; }
        .ri-conn {
          height: 2px; width: 28px; background: #E5E7EB; border-radius: 2px; flex-shrink: 0;
        }
        .ri-conn--done { background: #059669; }
        @media(min-width:768px){ .ri-sl{font-size:13px} .ri-conn{width:48px} }

        /* MAIN WRAP */
        .ri-wrap {
          max-width: 1200px; margin: 0 auto;
          padding: 40px 24px 0;
        }
        @media(min-width:768px){ .ri-wrap{padding:48px 32px 0} }

        /* 2-COL LAYOUT */
        .ri-layout {
          display: grid; grid-template-columns: 1fr; gap: 24px;
        }
        @media(min-width:900px){
          .ri-layout { grid-template-columns: 1.3fr 1fr; align-items: start; gap: 32px; }
        }

        /* FORM COL */
        .ri-form-col { animation: ri-fadeUp .45s ease both; }

        /* METHOD TOGGLE */
        .ri-mtoggle {
          display: flex; background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 14px; padding: 4px; margin-bottom: 24px;
          box-shadow: var(--sw);
        }
        .ri-mt-btn {
          flex: 1; padding: 11px 0; border: none; border-radius: 11px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all .2s; color: #6B7280; background: transparent;
        }
        .ri-mt-btn--on {
          background: #0A0A0A; color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,.18);
        }
        @media(min-width:768px){ .ri-mt-btn{font-size:14px;padding:12px 0} }

        /* HEADING */
        .ri-heading {
          font-family: 'Inter', sans-serif;
          font-size: clamp(22px, 3.5vw, 32px); font-weight: 900;
          color: #0A0A0A; margin-bottom: 6px; line-height: 1.25;
        }
        .ri-sub {
          font-size: 14px; color: #6B7280; line-height: 1.6; margin-bottom: 22px;
        }

        /* FIELD */
        .ri-field { margin-bottom: 16px; }
        .ri-flbl {
          font-size: 12px; font-weight: 700; color: #6B7280;
          margin-bottom: 7px; display: flex; align-items: center;
          justify-content: space-between; letter-spacing: .05em;
        }
        .ri-req { color: #DC2626; }
        .ri-fcnt { font-size: 11px; font-weight: 600; color: #9CA3AF; }
        .ri-finput {
          width: 100%; padding: 14px 18px; border-radius: 10px;
          border: 1px solid #E5E7EB; background: #F9FAFB;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
          color: #0A0A0A; outline: none; transition: border-color .2s, box-shadow .2s;
          box-sizing: border-box;
        }
        .ri-finput:focus {
          border-color: #0991B2; background: #fff;
          box-shadow: 0 0 0 3px rgba(9,145,178,.12);
        }
        .ri-finput::placeholder { color: #D1D5DB; }
        .ri-finput--err { border-color: #DC2626; box-shadow: 0 0 0 3px rgba(220,38,38,.1); }
        @media(min-width:768px){ .ri-finput{font-size:15px;padding:15px 20px} }

        /* TEMPLATES */
        .ri-tmpl { margin-bottom: 16px; }
        .ri-tmpl-lbl {
          font-size: 12px; font-weight: 700; color: #6B7280;
          margin-bottom: 8px; display: block;
        }
        .ri-tmpl-chips { display: flex; gap: 7px; flex-wrap: wrap; }
        .ri-tc {
          font-size: 12px; font-weight: 700; padding: 7px 15px;
          border-radius: 100px; border: 1px solid #E5E7EB;
          cursor: pointer; background: #F9FAFB; color: #0991B2;
          box-shadow: var(--sw); transition: all .15s;
        }
        .ri-tc:hover { background: #E6F7FA; border-color: #0991B2; }
        .ri-tc:active { transform: scale(.92); }
        @media(min-width:768px){ .ri-tc{font-size:13px;padding:8px 17px} }

        /* TEXTAREA */
        .ri-ta-wrap { position: relative; margin-bottom: 14px; }
        .ri-ta {
          width: 100%; min-height: clamp(200px, 28vh, 320px);
          padding: 18px; border-radius: 12px;
          border: 1px solid #E5E7EB; resize: vertical;
          background: #F9FAFB; box-sizing: border-box;
          font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.75;
          color: #0A0A0A; outline: none; transition: border-color .2s, box-shadow .2s;
        }
        .ri-ta:focus {
          border-color: #0991B2; background: #fff;
          box-shadow: 0 0 0 3px rgba(9,145,178,.12);
        }
        .ri-ta::placeholder { color: #D1D5DB; font-size: 13px; line-height: 1.7; }
        @media(min-width:768px){ .ri-ta{font-size:15px;min-height:clamp(240px,33vh,400px)} }
        .ri-ta-cnt {
          position: absolute; bottom: 12px; right: 14px;
          font-size: 11px; font-weight: 600; color: #9CA3AF;
          background: rgba(255,255,255,.9); border-radius: 100px; padding: 2px 9px;
          pointer-events: none;
        }

        /* WARN */
        .ri-warn {
          font-size: 12px; color: #D97706; font-weight: 600;
          padding: 9px 14px; border-radius: 10px;
          background: rgba(245,158,11,.08);
          border: 1px solid rgba(245,158,11,.2);
          margin-bottom: 12px; animation: ri-fadeUp .3s ease both;
        }

        /* ERROR */
        .ri-error {
          font-size: 12px; color: #DC2626; font-weight: 600;
          padding: 9px 14px; border-radius: 10px;
          background: #FEF2F2; border: 1px solid #FECACA;
          margin-bottom: 12px;
        }

        /* LIVE PREVIEW */
        .ri-lp {
          background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 14px; padding: 18px; margin-bottom: 14px;
          box-shadow: var(--sc); animation: ri-fadeUp .35s ease both;
        }
        .ri-lp-hd {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
        }
        .ri-lp-ttl { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 800; color: #0A0A0A; }
        .ri-lp-live {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; color: #059669;
        }
        .ri-lp-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #059669;
          animation: ri-liveDot 2s infinite;
        }
        .ri-lp-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
        .ri-lp-tag {
          font-size: 11px; font-weight: 700; padding: 4px 11px; border-radius: 100px;
          background: #E6F7FA; color: #0991B2; animation: ri-pop .3s ease both;
        }
        .ri-lp-tag--more { background: #F3F4F6; color: #9CA3AF; }
        .ri-lp-notag { font-size: 12px; color: #9CA3AF; }
        .ri-lp-sum { font-size: 12px; color: #6B7280; line-height: 1.6; font-weight: 500; }

        /* SKIP */
        .ri-skip {
          display: block; width: 100%; text-align: center;
          font-family: 'Inter', sans-serif; font-size: 13px; color: #9CA3AF;
          font-weight: 600; padding: 14px; cursor: pointer;
          background: none; border: none;
          text-decoration: underline; text-underline-offset: 2px;
          transition: color .2s;
        }
        .ri-skip:hover { color: #6B7280; }

        /* SIDEBAR */
        .ri-sidebar {
          display: flex; flex-direction: column; gap: 16px;
          animation: ri-fadeUp .45s ease .1s both;
        }
        @media(min-width:900px){ .ri-sidebar{position:sticky;top:80px} }

        /* CARD (stats + hint) */
        .ri-card {
          background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 20px; padding: 20px; box-shadow: var(--sc);
        }
        .ri-card-ttl {
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 800;
          color: #0A0A0A; margin-bottom: 12px;
        }
        .ri-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 0; border-bottom: 1px solid #E5E7EB;
        }
        .ri-row--last { border-bottom: none; }
        .ri-row-lbl { font-size: 12px; color: #6B7280; font-weight: 600; }
        .ri-row-val { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 800; color: #0A0A0A; }

        /* HINT CARD */
        .ri-hc-hd { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; }
        .ri-hc-ico {
          width: 32px; height: 32px; border-radius: 10px;
          background: #E6F7FA; border: 1px solid rgba(9,145,178,.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
        }
        .ri-hc-list { display: flex; flex-direction: column; gap: 10px; }
        .ri-hc-item {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 12px; color: #6B7280; line-height: 1.55; font-weight: 500;
        }
        .ri-hc-dot {
          width: 22px; height: 22px; border-radius: 8px;
          background: #E6F7FA; display: flex; align-items: center; justify-content: center;
          font-size: 12px; flex-shrink: 0; margin-top: 1px;
        }

        /* SAMPLE CARD */
        .ri-sample {
          background: linear-gradient(135deg, rgba(6,182,212,.1), rgba(9,145,178,.05));
          border-radius: 20px; padding: 18px;
          border: 1px solid rgba(9,145,178,.12);
        }
        .ri-sample-ttl {
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 800;
          color: #0991B2; margin-bottom: 10px;
        }
        .ri-sample-txt {
          font-family: 'Inter', sans-serif; font-size: 12px; color: #6B7280;
          line-height: 1.7; font-weight: 500; white-space: pre-wrap;
        }

        /* BOTTOM CTA */
        .ri-cta {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
          background: rgba(255,255,255,.95);
          backdrop-filter: blur(24px);
          border-top: 1px solid #E5E7EB;
          padding: 12px 24px max(20px, env(safe-area-inset-bottom));
        }
        @media(min-width:768px){ .ri-cta{padding:14px 32px max(20px,env(safe-area-inset-bottom))} }
        .ri-cta-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; gap: 16px;
        }
        .ri-cta-prog { flex: 1; display: none; }
        @media(min-width:768px){ .ri-cta-prog{display:block} }
        .ri-cp-row {
          display: flex; justify-content: space-between; margin-bottom: 5px;
        }
        .ri-cp-lbl { font-size: 11px; color: #9CA3AF; font-weight: 600; }
        .ri-cp-val { font-size: 11px; font-weight: 800; color: #0991B2; font-family: 'Inter', sans-serif; }
        .ri-cp-track {
          height: 5px; background: #E5E7EB; border-radius: 100px; overflow: hidden;
        }
        .ri-cp-bar {
          height: 100%; border-radius: 100px;
          background: linear-gradient(90deg, #06B6D4, #0991B2);
          transition: width .3s ease;
        }
        .ri-cta-btn {
          flex-shrink: 0; padding: 15px 28px; border: none; border-radius: 16px;
          cursor: pointer; font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 900;
          background: #0A0A0A; color: #fff;
          box-shadow: var(--sb); transition: opacity .15s;
          display: flex; align-items: center; gap: 8px; white-space: nowrap;
        }
        @media(max-width:767px){ .ri-cta-btn{flex:1;justify-content:center} }
        @media(min-width:768px){ .ri-cta-btn{font-size:16px;padding:15px 40px} }
        .ri-cta-btn:hover:not(:disabled){ opacity:.85 }
        .ri-cta-btn:active:not(:disabled){ transform:scale(.97) }
        .ri-cta-btn:disabled{ opacity:.4;cursor:not-allowed }
        .ri-cta-spin {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,.35); border-top-color: #fff;
          animation: ri-spin .7s linear infinite;
        }

        /* SUCCESS MODAL */
        .ri-ov {
          position: fixed; inset: 0; z-index: 400;
          background: rgba(0,0,0,.25); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .ri-ss {
          background: #FFFFFF; border-radius: 28px;
          padding: 36px 28px; text-align: center;
          max-width: 400px; width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,.15);
          animation: ri-slideUp .4s cubic-bezier(.4,0,.2,1) both;
        }
        .ri-ss-em { font-size: 64px; display: block; margin-bottom: 14px; }
        .ri-ss-ttl {
          font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 900;
          color: #0A0A0A; margin-bottom: 8px;
        }
        .ri-ss-desc { font-size: 14px; color: #6B7280; line-height: 1.65; margin-bottom: 24px; }
        .ri-ss-p {
          width: 100%; padding: 15px; border: none; border-radius: 16px;
          cursor: pointer; font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 900;
          background: #0A0A0A; color: #fff;
          box-shadow: var(--sb); margin-bottom: 10px;
          transition: opacity .2s;
        }
        .ri-ss-p:hover { opacity: .85; }
        .ri-ss-s {
          width: 100%; padding: 15px; border: 1px solid #0991B2;
          border-radius: 16px; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          background: #E6F7FA; color: #0991B2; transition: background .2s;
        }
        .ri-ss-s:hover { background: #cceef6; }
      `}</style>
    </div>
  );
}
