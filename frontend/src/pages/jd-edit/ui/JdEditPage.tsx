import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useJdEditStore, type JdStatus } from "@/features/jd";
import { useSessionStore } from "@/entities/session";

const STATUS_OPTIONS: { value: JdStatus; icon: string; label: string; desc: string }[] = [
  { value: "planned", icon: "📅", label: "지원 예정", desc: "곧 지원할 예정" },
  { value: "saved",   icon: "⭐", label: "관심 저장", desc: "관심만 저장" },
  { value: "applied", icon: "✅", label: "지원 완료", desc: "이미 지원함" },
];

export function JdEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    jd, customTitle, status, interviewActive,
    isLoading, isSubmitting, error,
    fetchJd, setCustomTitle, setStatus, setInterviewActive,
    submit, deleteJd, clearError, reset,
  } = useJdEditStore();

  useEffect(() => {
    reset();
    if (id) fetchJd(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async () => {
    clearError();
    const ok = await submit();
    if (ok) navigate(`/jd/detail/${jd?.id}`);
  };

  const handleDelete = async () => {
    if (!confirm("채용공고를 삭제하면 연결된 정보도 모두 삭제됩니다. 계속하시겠어요?")) return;
    const ok = await deleteJd();
    if (ok) navigate("/jd");
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="jde-page">
        <NavBar />
        <div className="jde-wrap"><div className="jde-loading">불러오는 중...</div></div>
        <Styles />
      </div>
    );
  }

  /* ── Error / Not Found ── */
  if (!jd) {
    return (
      <div className="jde-page">
        <NavBar />
        <div className="jde-wrap">
          <div className="jde-error-box">
            <p>{error ?? "채용공고를 찾을 수 없습니다."}</p>
            <Link to="/jd" className="jde-btn-primary" style={{ marginTop: 16 }}>목록으로</Link>
          </div>
        </div>
        <Styles />
      </div>
    );
  }

  return (
    <div className="jde-page">
      <NavBar />

      <div className="jde-wrap">
        {/* BREADCRUMB */}
        <div className="jde-breadcrumb">
          <Link to="/jd" className="jde-bc-link">채용공고</Link>
          <span className="jde-bc-sep">›</span>
          <Link to={`/jd/detail/${jd.id}`} className="jde-bc-link">
            {jd.company} {jd.title.split("—")[0].trim()}
          </Link>
          <span className="jde-bc-sep">›</span>
          <span className="jde-bc-current">수정</span>
        </div>

        {/* PAGE HEADER */}
        <div className="jde-page-hd">
          <div>
            <div className="jde-eyebrow">✏️ 공고 수정</div>
            <h1 className="jde-page-title">채용공고 수정</h1>
            <p className="jde-page-sub">공고 정보와 지원 상태를 업데이트하세요</p>
          </div>
        </div>

        {/* COMPANY CHIP */}
        <div className="jde-edit-header">
          <div className="jde-co-chip">
            <div className="jde-co-logo" style={{ background: jd.companyColor }}>
              {jd.companyInitial}
            </div>
            <div className="jde-co-name">{jd.company}</div>
          </div>
          <span className="jde-co-note">URL 원문은 변경할 수 없어요</span>
        </div>

        <div className="jde-layout">

          {/* ── MAIN FORM ── */}
          <div className="jde-main">
            <div className="jde-card jde-form-card">

              {/* 원본 URL (읽기 전용) */}
              <section className="jde-form-section">
                <div className="jde-section-title">
                  <span className="jde-section-icon" style={{ background: "rgba(9,145,178,0.1)" }}>🔗</span>
                  원본 URL
                </div>
                <div className="jde-field">
                  <input
                    className="jde-field-input jde-field-input--readonly"
                    type="text"
                    value={jd.originalUrl}
                    readOnly
                    aria-label="원본 URL (읽기 전용)"
                  />
                  <div className="jde-readonly-note">🔒 원본 URL은 수정할 수 없습니다. 새 공고로 추가해 주세요.</div>
                </div>
              </section>

              <div className="jde-divider" />

              {/* 식별 제목 */}
              <section className="jde-form-section">
                <div className="jde-section-title">
                  <span className="jde-section-icon" style={{ background: "linear-gradient(135deg,#60A5FA,#2563EB)" }}>✏️</span>
                  내 식별 제목
                </div>
                <p className="jde-section-sub">이 공고를 구별하기 위한 나만의 제목을 설정하세요</p>
                <div className="jde-field">
                  <div className="jde-field-label">
                    식별 제목
                    <span className="jde-field-hint">미입력 시 공고 원제목 표시</span>
                  </div>
                  <input
                    type="text"
                    className="jde-field-input"
                    placeholder={jd.title}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    aria-label="식별 제목"
                  />
                </div>
              </section>

              <div className="jde-divider" />

              {/* 지원 상태 */}
              <section className="jde-form-section">
                <div className="jde-section-title">
                  <span className="jde-section-icon" style={{ background: "linear-gradient(135deg,#67E8F9,#0891B2)" }}>📌</span>
                  지원 상태
                </div>
                <div className="jde-status-selector">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`jde-ss-opt${status === opt.value ? " jde-ss-opt--sel" : ""}`}
                      onClick={() => setStatus(opt.value)}
                      aria-pressed={status === opt.value}
                    >
                      <span className="jde-ss-icon">{opt.icon}</span>
                      <div className={`jde-ss-label${status === opt.value ? " jde-ss-label--sel" : ""}`}>{opt.label}</div>
                      <div className="jde-ss-desc">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </section>

              <div className="jde-divider" />

              {/* AI 면접 포함 */}
              <section className="jde-form-section">
                <div className="jde-section-title">
                  <span className="jde-section-icon" style={{ background: "linear-gradient(135deg,#34D399,#059669)" }}>⚡</span>
                  AI 면접 포함 설정
                </div>
                <div className="jde-toggle-row">
                  <div className="jde-toggle-info">
                    <div className="jde-toggle-label">AI 면접에 포함하기</div>
                    <div className="jde-toggle-sub">비활성화하면 이 공고는 면접 질문 생성에서 제외됩니다</div>
                  </div>
                  <label className="jde-toggle-switch" aria-label="AI 면접 포함">
                    <input
                      type="checkbox"
                      checked={interviewActive}
                      onChange={(e) => setInterviewActive(e.target.checked)}
                    />
                    <div className="jde-toggle-track">
                      <div
                        className="jde-toggle-thumb"
                        style={{ transform: interviewActive ? "translateX(20px)" : "translateX(0)" }}
                      />
                    </div>
                  </label>
                </div>
              </section>

              {/* ERROR */}
              {error && (
                <p className="jde-error" role="alert">{error}</p>
              )}

              {/* ACTIONS */}
              <div className="jde-form-actions">
                <Link to={`/jd/detail/${jd.id}`} className="jde-btn-ghost">취소</Link>
                <button
                  type="button"
                  className="jde-btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "저장 중..." : "변경사항 저장"}
                  {!isSubmitting && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── SIDE ── */}
          <div className="jde-side">

            {/* 현재 정보 */}
            <div className="jde-card jde-side-card">
              <div className="jde-side-title">
                <span style={{ fontSize: 18 }}>ℹ️</span> 현재 정보
              </div>
              <div className="jde-info-row">
                <span className="jde-info-key">회사</span>
                <span className="jde-info-val">{jd.company}</span>
              </div>
              <div className="jde-info-row">
                <span className="jde-info-key">원제목</span>
                <span className="jde-info-val jde-info-val--small">{jd.title}</span>
              </div>
              <div className="jde-info-row">
                <span className="jde-info-key">등록일</span>
                <span className="jde-info-val">{jd.registeredAt}</span>
              </div>
              <div className="jde-info-row">
                <span className="jde-info-key">면접 횟수</span>
                <span className="jde-info-val">{jd.interviewCount}회</span>
              </div>
            </div>

            {/* 위험 영역 */}
            <div className="jde-card jde-danger-zone">
              <div className="jde-danger-title">⚠️ 위험 영역</div>
              <p className="jde-danger-desc">
                채용공고를 삭제하면 연결된 지원 현황 정보도 함께 삭제됩니다. 이 작업은 되돌릴 수 없어요.
              </p>
              <button
                type="button"
                className="jde-btn-danger"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                🗑 채용공고 삭제
              </button>
            </div>

          </div>
        </div>
      </div>

      <Styles />
    </div>
  );
}

function NavBar() {
  const { user } = useSessionStore();
  
  return (
    <nav className="jde-nav">
      <div className="jde-nav-pill">
        <Link to="/home" className="jde-logo">
          me<span style={{ color: "#0991B2" }}>Fit</span>
        </Link>
        <ul className="jde-nav-links">
          <li><Link to="/home" className="jde-nav-link">홈</Link></li>
          <li><Link to="/jd" className="jde-nav-link jde-nav-link--active">채용공고</Link></li>
          <li><Link to="/interview" className="jde-nav-link">면접 시작</Link></li>
          <li><Link to="/resume" className="jde-nav-link">이력서</Link></li>
        </ul>
        <div className="jde-nav-avatar">{user?.initial || "U"}</div>
      </div>
    </nav>
  );
}

function Styles() {
  return (
    <style>{`
      @keyframes jde-fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .jde-page {
        min-height: 100vh;
        background: #FFFFFF;
        font-family: 'Inter', sans-serif;
        color: #0A0A0A;
      }

      /* NAV */
      .jde-nav {
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 200;
        padding: 14px 32px;
        display: flex;
        justify-content: center;
      }
      .jde-nav-pill {
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
      .jde-logo {
        font-family: 'Inter', sans-serif;
        font-size: 19px;
        font-weight: 900;
        letter-spacing: -.3px;
        color: #0A0A0A;
        text-decoration: none;
      }
      .jde-nav-links { display: flex; gap: 4px; list-style: none; }
      .jde-nav-link {
        font-size: 13px; font-weight: 500; color: #6B7280;
        text-decoration: none; padding: 8px 14px;
        border-radius: 8px; transition: all .2s;
      }
      .jde-nav-link:hover { color: #0A0A0A; background: rgba(9,145,178,0.06); }
      .jde-nav-link--active { color: #0991B2; background: #E6F7FA; font-weight: 700; }
      .jde-nav-avatar {
        width: 36px; height: 36px; border-radius: 50%;
        background: linear-gradient(135deg,#06B6D4,#0891B2);
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 700; color: #fff;
        box-shadow: var(--sb); cursor: pointer;
      }

      /* WRAP */
      .jde-wrap {
        max-width: 1140px;
        margin: 0 auto;
        padding: 100px 32px 60px;
      }

      /* CARD */
      .jde-card {
        background: #F9FAFB;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        box-shadow: var(--sc);
      }

      /* LOADING / ERROR */
      .jde-loading { text-align: center; padding: 80px 0; font-size: 15px; color: #6B7280; }
      .jde-error-box {
        text-align: center; padding: 60px 0;
        display: flex; flex-direction: column; align-items: center;
        font-size: 15px; color: #DC2626;
      }

      /* BREADCRUMB */
      .jde-breadcrumb {
        display: flex; align-items: center; gap: 8px;
        font-size: 13px; color: #6B7280; margin-bottom: 24px;
      }
      .jde-bc-link { color: #6B7280; text-decoration: none; transition: color .2s; }
      .jde-bc-link:hover { color: #0991B2; }
      .jde-bc-sep { opacity: .5; }
      .jde-bc-current { color: #0A0A0A; font-weight: 600; }

      /* PAGE HEADER */
      .jde-page-hd {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 20px;
        gap: 16px;
      }
      .jde-eyebrow {
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
        border-radius: 8px;
        margin-bottom: 10px;
      }
      .jde-page-title {
        font-family: 'Inter', sans-serif;
        font-size: clamp(24px,3vw,36px);
        font-weight: 900;
        letter-spacing: -.8px;
        color: #0A0A0A;
        line-height: 1.1;
      }
      .jde-page-sub { font-size: 14px; color: #6B7280; margin-top: 6px; }

      /* COMPANY CHIP */
      .jde-edit-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 28px;
      }
      .jde-co-chip {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        background: #F9FAFB;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        box-shadow: var(--sw);
      }
      .jde-co-logo {
        width: 32px; height: 32px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: 900; color: #fff;
      }
      .jde-co-name { font-size: 13px; font-weight: 700; color: #0A0A0A; }
      .jde-co-note { font-size: 12px; color: #9CA3AF; }

      /* LAYOUT */
      .jde-layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 24px;
        align-items: start;
      }
      .jde-main { animation: jde-fadeUp .5s ease both; }
      .jde-side { animation: jde-fadeUp .5s ease .08s both; display: flex; flex-direction: column; gap: 18px; }

      /* FORM */
      .jde-form-card { padding: 36px 32px; }
      .jde-form-section { margin-bottom: 32px; }
      .jde-form-section:last-child { margin-bottom: 0; }
      .jde-section-title {
        font-family: 'Inter', sans-serif;
        font-size: 15px; font-weight: 800; color: #0A0A0A;
        margin-bottom: 4px;
        display: flex; align-items: center; gap: 8px;
      }
      .jde-section-icon {
        width: 28px; height: 28px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; flex-shrink: 0;
      }
      .jde-section-sub { font-size: 13px; color: #6B7280; margin-bottom: 18px; margin-left: 36px; }
      .jde-divider { height: 1px; background: #E5E7EB; margin: 28px 0; }

      .jde-field { margin-bottom: 20px; }
      .jde-field:last-child { margin-bottom: 0; }
      .jde-field-label {
        display: flex; align-items: center; justify-content: space-between;
        font-size: 13px; font-weight: 700; color: #0A0A0A; margin-bottom: 8px;
      }
      .jde-field-hint { font-size: 11px; color: #6B7280; font-weight: 400; }
      .jde-field-input {
        width: 100%;
        background: #FFFFFF;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 13px 16px;
        font-family: 'Inter', sans-serif;
        font-size: 14px; font-weight: 500; color: #0A0A0A;
        outline: none; transition: border-color .2s;
        appearance: none; box-sizing: border-box;
      }
      .jde-field-input:focus { border-color: #0991B2; box-shadow: 0 0 0 3px rgba(9,145,178,0.1); }
      .jde-field-input::placeholder { color: #D1D5DB; }
      .jde-field-input--readonly {
        background: rgba(9,145,178,0.04);
        color: #9CA3AF;
        cursor: not-allowed;
        border-color: #F3F4F6;
      }
      .jde-field-input--readonly:focus { border-color: #F3F4F6; box-shadow: none; }
      .jde-readonly-note {
        font-size: 12px; color: #9CA3AF;
        margin-top: 6px;
        display: flex; align-items: center; gap: 4px;
      }

      /* STATUS SELECTOR */
      .jde-status-selector { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
      .jde-ss-opt {
        padding: 14px 12px;
        border-radius: 8px;
        border: 1px solid #E5E7EB;
        background: #FFFFFF;
        cursor: pointer; text-align: center;
        transition: all .25s; box-shadow: var(--sw);
      }
      .jde-ss-opt:hover { transform: translateY(-2px); box-shadow: var(--sc); border-color: #0991B2; }
      .jde-ss-opt--sel { border-color: #0991B2; background: #E6F7FA; box-shadow: var(--sc); }
      .jde-ss-icon { font-size: 22px; margin-bottom: 6px; display: block; }
      .jde-ss-label { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 800; color: #0A0A0A; }
      .jde-ss-label--sel { color: #0991B2; }
      .jde-ss-desc { font-size: 10px; color: #9CA3AF; margin-top: 2px; }

      /* TOGGLE */
      .jde-toggle-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 16px;
        background: #FFFFFF;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
      }
      .jde-toggle-info { flex: 1; }
      .jde-toggle-label { font-size: 13px; font-weight: 700; color: #0A0A0A; }
      .jde-toggle-sub { font-size: 11px; color: #6B7280; margin-top: 2px; }
      .jde-toggle-switch {
        position: relative; width: 44px; height: 24px;
        flex-shrink: 0; cursor: pointer;
      }
      .jde-toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
      .jde-toggle-track {
        position: absolute; inset: 0;
        border-radius: 8px; background: #E5E7EB;
        transition: background .25s;
      }
      .jde-toggle-switch input:checked ~ .jde-toggle-track { background: #0991B2; }
      .jde-toggle-thumb {
        position: absolute; left: 3px; top: 3px;
        width: 18px; height: 18px; border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        transition: transform .25s;
        pointer-events: none;
      }

      /* ERROR */
      .jde-error {
        font-size: 13px; color: #DC2626;
        margin-bottom: 14px; padding: 10px 14px;
        background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px;
      }

      /* BUTTONS */
      .jde-form-actions {
        display: flex; align-items: center; justify-content: flex-end;
        gap: 12px; margin-top: 28px; padding-top: 24px;
        border-top: 1px solid #E5E7EB;
      }
      .jde-btn-primary {
        display: inline-flex; align-items: center; gap: 8px;
        font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
        color: #fff; background: #0A0A0A; border: none;
        cursor: pointer; padding: 14px 24px; border-radius: 8px;
        box-shadow: var(--sb); transition: opacity .2s;
        text-decoration: none; white-space: nowrap;
      }
      .jde-btn-primary:hover:not(:disabled) { opacity: .85; }
      .jde-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
      .jde-btn-ghost {
        display: inline-flex; align-items: center; gap: 6px;
        font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
        color: #6B7280; background: none; border: none; cursor: pointer;
        padding: 10px 16px; border-radius: 8px;
        transition: all .2s; text-decoration: none;
      }
      .jde-btn-ghost:hover { color: #0A0A0A; background: #F3F4F6; }

      /* SIDE CARD */
      .jde-side-card { padding: 22px 20px; }
      .jde-side-title {
        font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 900;
        color: #0A0A0A; margin-bottom: 16px;
        display: flex; align-items: center; gap: 8px;
      }
      .jde-info-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px;
      }
      .jde-info-row:last-child { border-bottom: none; padding-bottom: 0; }
      .jde-info-key { color: #6B7280; font-weight: 600; }
      .jde-info-val { color: #0A0A0A; font-weight: 500; text-align: right; }
      .jde-info-val--small { font-size: 12px; max-width: 160px; line-height: 1.4; }

      /* DANGER ZONE */
      .jde-danger-zone {
        padding: 22px 20px;
        border: 1.5px solid rgba(185,28,28,0.15) !important;
      }
      .jde-danger-title {
        font-size: 13px; font-weight: 800; color: #B91C1C;
        margin-bottom: 12px;
        display: flex; align-items: center; gap: 6px;
      }
      .jde-danger-desc { font-size: 12px; color: #6B7280; line-height: 1.6; margin-bottom: 14px; }
      .jde-btn-danger {
        display: flex; align-items: center; justify-content: center; gap: 6px;
        width: 100%; padding: 12px; border-radius: 8px;
        border: 1.5px solid rgba(185,28,28,0.2);
        background: rgba(185,28,28,0.06);
        color: #B91C1C; font-size: 13px; font-weight: 700;
        cursor: pointer; transition: all .2s;
        font-family: 'Inter', sans-serif;
      }
      .jde-btn-danger:hover:not(:disabled) { background: rgba(185,28,28,0.12); border-color: rgba(185,28,28,0.4); }
      .jde-btn-danger:disabled { opacity: .5; cursor: not-allowed; }

      /* RESPONSIVE */
      @media (max-width: 900px) {
        .jde-layout { grid-template-columns: 1fr; }
        .jde-side { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      }
      @media (max-width: 640px) {
        .jde-wrap { padding: 80px 16px 40px; }
        .jde-nav { padding: 12px 16px; }
        .jde-side { grid-template-columns: 1fr; }
        .jde-form-card { padding: 24px 16px; }
        .jde-status-selector { grid-template-columns: 1fr; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}
