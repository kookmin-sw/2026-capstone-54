import { Link, useNavigate } from "react-router-dom";
import { useJdAddStore, type JdStatus } from "@/features/jd";
import { useSessionStore } from "@/entities/session";

const STATUS_OPTIONS: { value: JdStatus; icon: string; label: string; desc: string }[] = [
  { value: "planned", icon: "📅", label: "지원 예정", desc: "곧 지원할 예정" },
  { value: "saved",   icon: "⭐", label: "관심 저장",  desc: "관심만 저장" },
  { value: "applied", icon: "✅", label: "지원 완료",  desc: "이미 지원함" },
];

const PLATFORMS = [
  { name: "사람인", ok: true },
  { name: "잡코리아", ok: true },
  { name: "원티드", ok: true },
  { name: "링크드인", ok: true },
  { name: "회사 홈페이지", ok: null },
];

export function JdAddPage() {
  const navigate = useNavigate();
  const {
    url, customTitle, status, interviewActive,
    urlValidState, urlAnalysis,
    isSubmitting, isSaving, error,
    setUrl, setCustomTitle, setStatus, setInterviewActive,
    clearError, submit, saveDraft,
  } = useJdAddStore();
  
  const { user } = useSessionStore();

  const handleSubmit = async () => {
    clearError();
    const jdId = await submit();
    if (jdId) navigate("/jd/analyzing");
  };

  const handleSaveDraft = async () => {
    clearError();
    await saveDraft();
  };

  return (
    <div className="jda-page">
      {/* NAV */}
      <nav className="jda-nav">
        <div className="jda-nav-pill">
          <Link to="/home" className="jda-logo">
            me<span style={{ color: "#0991B2" }}>Fit</span>
          </Link>
          <ul className="jda-nav-links">
            <li><Link to="/home" className="jda-nav-link">홈</Link></li>
            <li><Link to="/jd" className="jda-nav-link jda-nav-link--active">채용공고</Link></li>
            <li><Link to="/interview" className="jda-nav-link">면접 시작</Link></li>
            <li><Link to="/resume" className="jda-nav-link">이력서</Link></li>
          </ul>
          <div className="jda-nav-avatar">{user?.initial || "U"}</div>
        </div>
      </nav>

      <div className="jda-wrap">
        {/* PAGE HEADER */}
        <div className="jda-page-hd">
          <div>
            <div className="jda-eyebrow">+ 채용공고 추가</div>
            <h1 className="jda-page-title">새 채용공고 등록</h1>
            <p className="jda-page-sub">URL만 붙여넣으면 AI가 나머지를 분석해 드려요</p>
          </div>
          <Link to="/jd" className="jda-btn-ghost">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            목록으로
          </Link>
        </div>

        {/* FORM LAYOUT */}
        <div className="jda-form-layout">

          {/* MAIN FORM */}
          <div className="jda-form-main">
            <div className="jda-card jda-form-card">

              {/* URL 섹션 */}
              <section className="jda-form-section">
                <div className="jda-section-title">
                  <span className="jda-section-icon" style={{ background: "linear-gradient(135deg,#60A5FA,#2563EB)" }}>🔗</span>
                  채용공고 URL
                </div>
                <p className="jda-section-sub">{'⚠️정확한 채용공고 페이지 URL을 입력해주세요.'}</p>

                <div className="jda-field">
                  <div className="jda-field-label">
                    URL <span className="jda-req">*</span>
                    <span className="jda-field-hint">사람인, 잡코리아, 원티드, 링크드인 등</span>
                  </div>
                  <div className="jda-field-wrap">
                    <span className="jda-url-prefix">🔗</span>
                    <input
                      type="url"
                      className="jda-field-input jda-url-input"
                      placeholder="https://www.saramin.co.kr/zf_user/jobs/relay/view?..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      aria-label="채용공고 URL"
                    />
                  </div>

                  {urlValidState !== "idle" && (
                    <div className={`jda-field-status jda-field-status--${urlValidState}`}>
                      {urlValidState === "checking" && "⟳ URL 확인 중..."}
                      {urlValidState === "ok" && "✓ 유효한 URL입니다"}
                      {urlValidState === "error" && "✗ 올바른 URL을 입력해 주세요"}
                    </div>
                  )}

                  {urlValidState === "ok" && urlAnalysis && (
                    <div className="jda-url-preview">
                      <div className="jda-url-prev-icon">🏢</div>
                      <div className="jda-url-prev-info">
                        <div className="jda-url-prev-co">{urlAnalysis.company} · {urlAnalysis.domain}</div>
                        <div className="jda-url-prev-title">{urlAnalysis.title}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="jda-field">
                  <div className="jda-field-label">
                    내 식별 제목 (선택)
                    <span className="jda-field-hint">미입력 시 공고 원제목 사용</span>
                  </div>
                  <input
                    type="text"
                    className="jda-field-input"
                    placeholder="예: 네이버 백엔드 — 2차 지원"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    aria-label="내 식별 제목"
                  />
                </div>
              </section>

              <div className="jda-divider" />

              {/* 지원 상태 */}
              <section className="jda-form-section">
                <div className="jda-section-title">
                  <span className="jda-section-icon" style={{ background: "linear-gradient(135deg,#67E8F9,#0891B2)" }}>📌</span>
                  지원 상태
                </div>
                <p className="jda-section-sub">현재 지원 진행 상태를 선택해 주세요</p>
                <div className="jda-status-selector">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`jda-ss-opt${status === opt.value ? " jda-ss-opt--sel" : ""}`}
                      onClick={() => setStatus(opt.value)}
                      aria-pressed={status === opt.value}
                    >
                      <span className="jda-ss-icon">{opt.icon}</span>
                      <div className={`jda-ss-label${status === opt.value ? " jda-ss-label--sel" : ""}`}>{opt.label}</div>
                      <div className="jda-ss-desc">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </section>

              <div className="jda-divider" />

              {/* 면접 활성화 */}
              <section className="jda-form-section">
                <div className="jda-section-title">
                  <span className="jda-section-icon" style={{ background: "linear-gradient(135deg,#34D399,#059669)" }}>⚡</span>
                  면접 활성화
                </div>
                <div className="jda-toggle-row">
                  <div className="jda-toggle-info">
                    <div className="jda-toggle-label">AI 면접에 포함하기</div>
                    <div className="jda-toggle-sub">비활성화 시 면접 질문 생성에서 제외됩니다</div>
                  </div>
                  <label className="jda-toggle-switch" aria-label="AI 면접 포함">
                    <input
                      type="checkbox"
                      checked={interviewActive}
                      onChange={(e) => setInterviewActive(e.target.checked)}
                    />
                    <div className="jda-toggle-track">
                      <div className="jda-toggle-thumb" style={{ transform: interviewActive ? "translateX(20px)" : "translateX(0)" }} />
                    </div>
                  </label>
                </div>
              </section>

              {/* ERROR */}
              {error && (
                <p className="jda-error" role="alert">{error}</p>
              )}

              {/* ACTIONS */}
              <div className="jda-form-actions">
                <Link to="/jd" className="jda-btn-ghost">취소</Link>
                <button
                  type="button"
                  className="jda-btn-secondary"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                >
                  {isSaving ? "저장 중..." : "임시저장"}
                </button>
                <button
                  type="button"
                  className="jda-btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "분석 중..." : "채용공고 추가하기"}
                  {!isSubmitting && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="jda-form-side">
            <div className="jda-card jda-side-card">
              <div className="jda-side-title">
                <span style={{ fontSize: 18 }}>💡</span>
                이렇게 활용해요
              </div>
              {[
                "채용공고 URL을 복사해서 붙여넣으세요",
                "AI가 자동으로 요구 역량과 우대 사항을 분석해요",
                "분석이 완료되면 맞춤 면접 질문이 생성됩니다",
                "이력서와 연결해 더 정밀한 피드백을 받으세요",
              ].map((tip, i) => (
                <div key={i} className="jda-tip-item">
                  <div className="jda-tip-num">{i + 1}</div>
                  {tip}
                </div>
              ))}
            </div>

            <div className="jda-card jda-side-card">
              <div className="jda-side-title">
                <span style={{ fontSize: 18 }}>🌐</span>
                지원 플랫폼
              </div>
              {PLATFORMS.map((p) => (
                <div key={p.name} className="jda-info-row">
                  <span className="jda-info-key">{p.name}</span>
                  {p.ok === true && (
                    <span className="jda-badge jda-badge--ok">✓ 지원</span>
                  )}
                  {p.ok === null && (
                    <span className="jda-badge jda-badge--partial">대부분</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .jda-page {
          min-height: 100vh;
          background: #FFFFFF;
          font-family: 'Inter', sans-serif;
          color: #0A0A0A;
        }

        /* NAV */
        .jda-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 200;
          padding: 14px 32px;
          display: flex;
          justify-content: center;
        }
        .jda-nav-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1140px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 8px 8px 8px 24px;
          box-shadow: var(--sc);
        }
        .jda-logo {
          font-family: 'Inter', sans-serif;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: -.3px;
          color: #0A0A0A;
          text-decoration: none;
        }
        .jda-nav-links {
          display: flex;
          gap: 4px;
          list-style: none;
        }
        .jda-nav-link {
          font-size: 13px;
          font-weight: 500;
          color: #6B7280;
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 8px;
          transition: all .2s;
        }
        .jda-nav-link:hover { color: #0A0A0A; background: rgba(9,145,178,0.06); }
        .jda-nav-link--active { color: #0991B2; background: #E6F7FA; font-weight: 700; }
        .jda-nav-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg,#06B6D4,#0891B2);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff;
          box-shadow: var(--sb);
          cursor: pointer;
        }

        /* WRAP */
        .jda-wrap {
          position: relative;
          max-width: 1140px;
          margin: 0 auto;
          padding: 100px 32px 60px;
        }

        /* CARD */
        .jda-card {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          box-shadow: var(--sc);
        }

        /* PAGE HEADER */
        .jda-page-hd {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
          gap: 16px;
        }
        .jda-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: #0991B2;
          background: #E6F7FA;
          padding: 4px 12px;
          border-radius: 100px;
          margin-bottom: 10px;
        }
        .jda-page-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(24px,3vw,36px);
          font-weight: 900;
          letter-spacing: -.8px;
          color: #0A0A0A;
          line-height: 1.1;
        }
        .jda-page-sub {
          font-size: 14px;
          color: #6B7280;
          margin-top: 6px;
        }

        /* BUTTONS */
        .jda-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          background: #0A0A0A;
          border: none;
          cursor: pointer;
          padding: 14px 24px;
          border-radius: 8px;
          box-shadow: var(--sb);
          transition: opacity .2s;
          white-space: nowrap;
          text-decoration: none;
        }
        .jda-btn-primary:hover:not(:disabled) { opacity: .85; }
        .jda-btn-primary:disabled { opacity: .5; cursor: not-allowed; }

        .jda-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #0991B2;
          background: #E6F7FA;
          border: 1px solid #0991B2;
          cursor: pointer;
          padding: 14px 24px;
          border-radius: 8px;
          transition: all .2s;
          white-space: nowrap;
        }
        .jda-btn-secondary:hover:not(:disabled) { background: #cceef6; }
        .jda-btn-secondary:disabled { opacity: .5; cursor: not-allowed; }

        .jda-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #6B7280;
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px 16px;
          border-radius: 8px;
          transition: all .2s;
          text-decoration: none;
        }
        .jda-btn-ghost:hover { color: #0A0A0A; background: #F3F4F6; }

        /* FORM LAYOUT */
        .jda-form-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: start;
        }
        .jda-form-card { padding: 36px 32px; }
        .jda-form-section { margin-bottom: 32px; }
        .jda-form-section:last-child { margin-bottom: 0; }
        .jda-section-title {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 800;
          color: #0A0A0A;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .jda-section-icon {
          width: 28px; height: 28px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
        }
        .jda-section-sub {
          font-size: 13px;
          color: #6B7280;
          margin-bottom: 18px;
          margin-left: 36px;
        }
        .jda-divider {
          height: 1px;
          background: #E5E7EB;
          margin: 28px 0;
        }

        /* FIELDS */
        .jda-field { margin-bottom: 20px; }
        .jda-field:last-child { margin-bottom: 0; }
        .jda-field-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 700;
          color: #0A0A0A;
          margin-bottom: 8px;
        }
        .jda-req { color: #0991B2; margin-left: 2px; }
        .jda-field-hint { font-size: 11px; color: #6B7280; font-weight: 400; }
        .jda-field-input {
          width: 100%;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 13px 16px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #0A0A0A;
          outline: none;
          transition: border-color .2s;
          appearance: none;
          box-sizing: border-box;
        }
        .jda-field-input:focus { border-color: #0991B2; box-shadow: 0 0 0 3px rgba(9,145,178,0.1); }
        .jda-field-input::placeholder { color: #D1D5DB; }
        .jda-url-input { padding-left: 44px; }
        .jda-field-wrap { position: relative; }
        .jda-url-prefix {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          pointer-events: none;
        }
        .jda-field-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 6px;
        }
        .jda-field-status--checking { color: #0991B2; }
        .jda-field-status--ok { color: #059669; }
        .jda-field-status--error { color: #DC2626; }

        /* URL PREVIEW */
        .jda-url-preview {
          margin-top: 12px;
          padding: 14px 16px;
          background: #ECFDF5;
          border-radius: 8px;
          border: 1px solid #A7F3D0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .jda-url-prev-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          background: #D1FAE5;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .jda-url-prev-info { flex: 1; min-width: 0; }
        .jda-url-prev-co { font-size: 12px; font-weight: 600; color: #6B7280; }
        .jda-url-prev-title {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 800;
          color: #0A0A0A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* STATUS SELECTOR */
        .jda-status-selector {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 8px;
        }
        .jda-ss-opt {
          padding: 14px 12px;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          cursor: pointer;
          text-align: center;
          transition: all .25s;
          box-shadow: var(--sw);
        }
        .jda-ss-opt:hover { transform: translateY(-2px); box-shadow: var(--sc); border-color: #0991B2; }
        .jda-ss-opt--sel { border-color: #0991B2; background: #E6F7FA; box-shadow: var(--sc); }
        .jda-ss-icon { font-size: 22px; margin-bottom: 6px; display: block; }
        .jda-ss-label { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 800; color: #0A0A0A; }
        .jda-ss-label--sel { color: #0991B2; }
        .jda-ss-desc { font-size: 10px; color: #9CA3AF; margin-top: 2px; }

        /* TOGGLE */
        .jda-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
        }
        .jda-toggle-info { flex: 1; }
        .jda-toggle-label { font-size: 13px; font-weight: 700; color: #0A0A0A; }
        .jda-toggle-sub { font-size: 11px; color: #6B7280; margin-top: 2px; }
        .jda-toggle-switch {
          position: relative;
          width: 44px; height: 24px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .jda-toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
        .jda-toggle-track {
          position: absolute;
          inset: 0;
          border-radius: 100px;
          background: #E5E7EB;
          transition: background .25s;
        }
        .jda-toggle-switch input:checked ~ .jda-toggle-track { background: #0991B2; }
        .jda-toggle-thumb {
          position: absolute;
          left: 3px; top: 3px;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: transform .25s;
          pointer-events: none;
        }

        /* ERROR */
        .jda-error {
          font-size: 13px;
          color: #DC2626;
          margin-bottom: 14px;
          padding: 10px 14px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 8px;
        }

        /* FORM ACTIONS */
        .jda-form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid #E5E7EB;
        }

        /* SIDE PANEL */
        .jda-side-card { padding: 28px 24px; margin-bottom: 18px; }
        .jda-side-card:last-child { margin-bottom: 0; }
        .jda-side-title {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 900;
          color: #0A0A0A;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .jda-tip-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
          font-size: 13px;
          color: #6B7280;
          line-height: 1.6;
        }
        .jda-tip-item:last-child { margin-bottom: 0; }
        .jda-tip-num {
          width: 22px; height: 22px;
          border-radius: 8px;
          background: #E6F7FA;
          color: #0991B2;
          font-size: 11px;
          font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .jda-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #F3F4F6;
          font-size: 13px;
        }
        .jda-info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .jda-info-key { color: #6B7280; font-weight: 600; }
        .jda-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 100px;
        }
        .jda-badge--ok { background: #D1FAE5; color: #047857; }
        .jda-badge--partial { background: #E6F7FA; color: #0991B2; }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .jda-form-layout { grid-template-columns: 1fr; }
          .jda-form-side { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        }
        @media (max-width: 640px) {
          .jda-wrap { padding: 80px 16px 40px; }
          .jda-nav { padding: 12px 16px; }
          .jda-form-side { grid-template-columns: 1fr; }
          .jda-form-card { padding: 24px 16px; }
          .jda-status-selector { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
