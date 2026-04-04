import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useJdDetailStore, type JdStatus } from "@/features/jd";
import { useSessionStore } from "@/entities/session";

const STATUS_OPTIONS: { value: JdStatus; icon: string; label: string; sub: string }[] = [
  { value: "planned", icon: "📅", label: "지원 예정",  sub: "곧 지원할 예정" },
  { value: "saved",   icon: "⭐", label: "관심 저장",  sub: "관심만 저장" },
  { value: "applied", icon: "✅", label: "지원 완료",  sub: "이미 지원 완료" },
];

const STATUS_LABEL: Record<JdStatus, string> = {
  planned: "지원 예정",
  saved:   "관심 저장",
  applied: "지원 완료",
};

export function JdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jd, isLoading, isUpdating, error, fetchJd, updateStatus, deleteJd, clearError } =
    useJdDetailStore();

  useEffect(() => {
    if (id) fetchJd(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("채용공고를 삭제하시겠어요?")) return;
    const ok = await deleteJd();
    if (ok) navigate("/jd");
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="jdd-page">
        <NavBar />
        <div className="jdd-wrap">
          <div className="jdd-loading">불러오는 중...</div>
        </div>
        <Styles />
      </div>
    );
  }

  /* ── Error / Not Found ── */
  if (error || !jd) {
    return (
      <div className="jdd-page">
        <NavBar />
        <div className="jdd-wrap">
          <div className="jdd-error-box">
            <p>{error ?? "채용공고를 찾을 수 없습니다."}</p>
            <Link to="/jd" className="jdd-btn-primary" style={{ marginTop: 16 }}>
              목록으로
            </Link>
          </div>
        </div>
        <Styles />
      </div>
    );
  }

  return (
    <div className="jdd-page">
      <NavBar />

      <div className="jdd-wrap">
        {/* BREADCRUMB */}
        <div className="jdd-breadcrumb">
          <Link to="/jd" className="jdd-bc-link">채용공고</Link>
          <span className="jdd-bc-sep">›</span>
          <span className="jdd-bc-current">{jd.company} {jd.title.split("—")[0].trim()}</span>
        </div>

        <div className="jdd-layout">
          {/* ── MAIN ── */}
          <div className="jdd-main">

            {/* HERO CARD */}
            <div className="jdd-card jdd-hero">
              <div className="jdd-hero-bg" />
              <div className="jdd-co-row">
                <div className="jdd-co-logo" style={{ background: jd.companyColor }}>
                  {jd.companyInitial}
                </div>
                <div>
                  <div className="jdd-co-name">{jd.company} · {jd.source}</div>
                  <div className="jdd-title">{jd.title}</div>
                </div>
              </div>

              <div className="jdd-meta">
                <span className="jdd-chip">🏢 {jd.company}</span>
                <span className="jdd-chip">📍 {jd.location}</span>
                <span className="jdd-chip">💼 {jd.experience}</span>
                <span className="jdd-chip">🕐 {jd.period}</span>
                <span className="jdd-chip jdd-chip--accent">
                  {STATUS_OPTIONS.find((o) => o.value === jd.status)?.icon} {STATUS_LABEL[jd.status]}
                </span>
              </div>

              <div className="jdd-actions">
                <Link to="/interview" className="jdd-btn-primary">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  면접 시작하기
                </Link>
                <Link to={`/jd/edit/${jd.id}`} className="jdd-btn-secondary">✏️ 수정</Link>
                <a href={jd.originalUrl} target="_blank" rel="noopener noreferrer" className="jdd-btn-ghost">
                  🔗 원문 보기
                </a>
                <button type="button" className="jdd-btn-ghost jdd-btn-danger" onClick={handleDelete}>
                  🗑 삭제
                </button>
              </div>
            </div>

            {/* 직무 요약 */}
            <div className="jdd-card jdd-section">
              <div className="jdd-section-title">
                <span className="jdd-section-icon" style={{ background: "linear-gradient(135deg,#67E8F9,#0891B2)" }}>📄</span>
                직무 요약
              </div>
              <p className="jdd-summary">{jd.summary}</p>
            </div>

            {/* 필수 자격 요건 */}
            <div className="jdd-card jdd-section">
              <div className="jdd-section-title">
                <span className="jdd-section-icon" style={{ background: "linear-gradient(135deg,#34D399,#059669)" }}>⚡</span>
                필수 자격 요건
              </div>
              <div className="jdd-req-list">
                {jd.requirements.map((req, i) => (
                  <div key={i} className="jdd-req-item">
                    <div className={`jdd-req-check jdd-req-check--${req.level}`}>✓</div>
                    {req.text}
                  </div>
                ))}
              </div>
            </div>

            {/* 우대 사항 */}
            <div className="jdd-card jdd-section">
              <div className="jdd-section-title">
                <span className="jdd-section-icon" style={{ background: "linear-gradient(135deg,#FCD34D,#D97706)" }}>⭐</span>
                우대 사항
              </div>
              <div className="jdd-pref-grid">
                {jd.preferences.map((pref, i) => (
                  <div key={i} className="jdd-pref-item">
                    <div className="jdd-pref-dot" />
                    {pref}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── SIDE ── */}
          <div className="jdd-side">

            {/* 지원 상태 변경 */}
            <div className="jdd-card jdd-side-card">
              <div className="jdd-side-title">
                <span style={{ fontSize: 18 }}>📌</span> 지원 상태 변경
                {isUpdating && <span className="jdd-updating">저장 중...</span>}
              </div>
              <div className="jdd-status-list">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`jdd-sc-opt${jd.status === opt.value ? " jdd-sc-opt--sel" : ""}`}
                    onClick={() => { clearError(); updateStatus(opt.value); }}
                    disabled={isUpdating}
                    aria-pressed={jd.status === opt.value}
                  >
                    <span className="jdd-sc-icon">{opt.icon}</span>
                    <div className="jdd-sc-radio">
                      {jd.status === opt.value && <div className="jdd-sc-radio-dot" />}
                    </div>
                    <div>
                      <div className="jdd-sc-label">{opt.label}</div>
                      <div className="jdd-sc-sub">{opt.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 빠른 액션 */}
            <div className="jdd-card jdd-side-card">
              <div className="jdd-side-title">
                <span style={{ fontSize: 18 }}>🚀</span> 빠른 액션
              </div>
              <div className="jdd-qa-list">
                <Link to="/interview" className="jdd-qa-btn">
                  <div className="jdd-qa-icon" style={{ background: "linear-gradient(135deg,#67E8F9,#0891B2)" }}>🎤</div>
                  <div className="jdd-qa-info">
                    <div className="jdd-qa-title">꼬리질문 면접</div>
                    <div className="jdd-qa-sub">심화 질문 집중 연습</div>
                  </div>
                  <span className="jdd-qa-arrow">›</span>
                </Link>
                <Link to="/interview" className="jdd-qa-btn">
                  <div className="jdd-qa-icon" style={{ background: "linear-gradient(135deg,#34D399,#059669)" }}>📋</div>
                  <div className="jdd-qa-info">
                    <div className="jdd-qa-title">전체 프로세스</div>
                    <div className="jdd-qa-sub">처음부터 끝까지 연습</div>
                  </div>
                  <span className="jdd-qa-arrow">›</span>
                </Link>
                <Link to={`/jd/edit/${jd.id}`} className="jdd-qa-btn">
                  <div className="jdd-qa-icon" style={{ background: "linear-gradient(135deg,#60A5FA,#2563EB)" }}>✏️</div>
                  <div className="jdd-qa-info">
                    <div className="jdd-qa-title">공고 정보 수정</div>
                    <div className="jdd-qa-sub">제목·상태 변경</div>
                  </div>
                  <span className="jdd-qa-arrow">›</span>
                </Link>
              </div>
            </div>

            {/* 등록 정보 */}
            <div className="jdd-card jdd-side-card">
              <div className="jdd-side-title">
                <span style={{ fontSize: 18 }}>ℹ️</span> 등록 정보
              </div>
              <div className="jdd-info-row">
                <span className="jdd-info-key">등록일</span>
                <span className="jdd-info-val">{jd.registeredAt}</span>
              </div>
              <div className="jdd-info-row">
                <span className="jdd-info-key">분석 완료</span>
                <span className="jdd-info-val">
                  {jd.analyzed
                    ? <span className="jdd-badge jdd-badge--ok">✓ 완료</span>
                    : <span className="jdd-badge jdd-badge--pending">분석 중</span>}
                </span>
              </div>
              <div className="jdd-info-row">
                <span className="jdd-info-key">면접 횟수</span>
                <span className="jdd-info-val">{jd.interviewCount}회 진행</span>
              </div>
              <div className="jdd-info-row">
                <span className="jdd-info-key">AI 활성화</span>
                <span className="jdd-info-val">
                  {jd.interviewActive
                    ? <span className="jdd-badge jdd-badge--ok">활성</span>
                    : <span className="jdd-badge jdd-badge--off">비활성</span>}
                </span>
              </div>
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
    <nav className="jdd-nav">
      <div className="jdd-nav-pill">
        <Link to="/home" className="jdd-logo">
          me<span style={{ color: "#0991B2" }}>Fit</span>
        </Link>
        <ul className="jdd-nav-links">
          <li><Link to="/home" className="jdd-nav-link">홈</Link></li>
          <li><Link to="/jd" className="jdd-nav-link jdd-nav-link--active">채용공고</Link></li>
          <li><Link to="/interview" className="jdd-nav-link">면접 시작</Link></li>
          <li><Link to="/resume" className="jdd-nav-link">이력서</Link></li>
        </ul>
        <div className="jdd-nav-avatar">{user?.initial || "U"}</div>
      </div>
    </nav>
  );
}

const JDD_STYLES = `
      @keyframes jdd-fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .jdd-page {
        min-height: 100vh;
        background: #FFFFFF;
        font-family: 'Inter', sans-serif;
        color: #0A0A0A;
      }

      /* NAV */
      .jdd-nav {
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 200;
        padding: 14px 32px;
        display: flex;
        justify-content: center;
      }
      .jdd-nav-pill {
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
      .jdd-logo {
        font-family: 'Inter', sans-serif;
        font-size: 19px;
        font-weight: 900;
        letter-spacing: -.3px;
        color: #0A0A0A;
        text-decoration: none;
      }
      .jdd-nav-links { display: flex; gap: 4px; list-style: none; }
      .jdd-nav-link {
        font-size: 13px; font-weight: 500; color: #6B7280;
        text-decoration: none; padding: 8px 14px; border-radius: 8px;
        transition: all .2s;
      }
      .jdd-nav-link:hover { color: #0A0A0A; background: rgba(9,145,178,0.06); }
      .jdd-nav-link--active { color: #0991B2; background: #E6F7FA; font-weight: 700; }
      .jdd-nav-avatar {
        width: 36px; height: 36px; border-radius: 50%;
        background: linear-gradient(135deg,#06B6D4,#0891B2);
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 700; color: #fff;
        box-shadow: var(--sb); cursor: pointer;
      }

      /* WRAP */
      .jdd-wrap {
        max-width: 1140px;
        margin: 0 auto;
        padding: 100px 32px 60px;
      }

      /* CARD */
      .jdd-card {
        background: #F9FAFB;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        box-shadow: var(--sc);
        transition: box-shadow .25s;
      }
      .jdd-card:hover { box-shadow: var(--sch); }

      /* LOADING / ERROR */
      .jdd-loading {
        text-align: center; padding: 80px 0;
        font-size: 15px; color: #6B7280;
      }
      .jdd-error-box {
        text-align: center; padding: 60px 0;
        display: flex; flex-direction: column; align-items: center;
        font-size: 15px; color: #DC2626;
      }

      /* BREADCRUMB */
      .jdd-breadcrumb {
        display: flex; align-items: center; gap: 8px;
        font-size: 13px; color: #6B7280; margin-bottom: 24px;
      }
      .jdd-bc-link { color: #6B7280; text-decoration: none; transition: color .2s; }
      .jdd-bc-link:hover { color: #0991B2; }
      .jdd-bc-sep { opacity: .5; }
      .jdd-bc-current { color: #0A0A0A; font-weight: 600; }

      /* LAYOUT */
      .jdd-layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 24px;
        align-items: start;
      }
      .jdd-main { animation: jdd-fadeUp .5s ease both; display: flex; flex-direction: column; gap: 18px; }
      .jdd-side { animation: jdd-fadeUp .5s ease .08s both; display: flex; flex-direction: column; gap: 18px; }

      /* HERO */
      .jdd-hero {
        padding: 36px 32px;
        position: relative;
        overflow: hidden;
      }
      .jdd-hero-bg {
        position: absolute; inset: 0;
        background: linear-gradient(135deg,rgba(9,145,178,0.05),rgba(6,182,212,0.03));
        pointer-events: none;
      }
      .jdd-co-row {
        display: flex; align-items: center; gap: 14px;
        margin-bottom: 18px; position: relative;
      }
      .jdd-co-logo {
        width: 54px; height: 54px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 22px; font-weight: 900; color: #fff;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      }
      .jdd-co-name { font-size: 13px; color: #6B7280; font-weight: 600; margin-bottom: 2px; }
      .jdd-title {
        font-family: 'Inter', sans-serif;
        font-size: clamp(18px, 2.5vw, 26px);
        font-weight: 900; letter-spacing: -.5px; line-height: 1.2; color: #0A0A0A;
        position: relative;
      }
      .jdd-meta {
        display: flex; flex-wrap: wrap; gap: 8px;
        margin-top: 16px; position: relative;
      }
      .jdd-chip {
        display: inline-flex; align-items: center; gap: 5px;
        font-size: 12px; font-weight: 600; padding: 5px 12px;
        border-radius: 100px; background: #FFFFFF;
        color: #6B7280; border: 1px solid #E5E7EB;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .jdd-chip--accent { background: #E6F7FA; color: #0991B2; border-color: #0991B2; }

      /* BUTTONS */
      .jdd-actions {
        display: flex; gap: 10px; margin-top: 20px;
        position: relative; flex-wrap: wrap;
      }
      .jdd-btn-primary {
        display: inline-flex; align-items: center; gap: 8px;
        font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
        color: #fff; background: #0A0A0A; border: none; cursor: pointer;
        padding: 12px 20px; border-radius: 8px; box-shadow: var(--sb);
        transition: opacity .2s; text-decoration: none; white-space: nowrap;
      }
      .jdd-btn-primary:hover { opacity: .85; }
      .jdd-btn-secondary {
        display: inline-flex; align-items: center; gap: 8px;
        font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
        color: #0991B2; background: #E6F7FA; border: 1px solid #0991B2;
        cursor: pointer; padding: 12px 20px; border-radius: 8px;
        transition: background .2s; text-decoration: none; white-space: nowrap;
      }
      .jdd-btn-secondary:hover { background: #cceef6; }
      .jdd-btn-ghost {
        display: inline-flex; align-items: center; gap: 6px;
        font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
        color: #6B7280; background: none; border: none; cursor: pointer;
        padding: 10px 16px; border-radius: 8px;
        transition: all .2s; text-decoration: none;
      }
      .jdd-btn-ghost:hover { color: #0A0A0A; background: #F3F4F6; }
      .jdd-btn-danger:hover { color: #DC2626 !important; background: #FEF2F2 !important; }

      /* SECTION */
      .jdd-section { padding: 28px 32px; }
      .jdd-section-title {
        font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 900;
        color: #0A0A0A; margin-bottom: 18px;
        display: flex; align-items: center; gap: 8px;
      }
      .jdd-section-icon {
        width: 32px; height: 32px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 15px; flex-shrink: 0;
      }
      .jdd-summary {
        font-size: 14px; color: #6B7280; line-height: 1.8;
        padding: 16px 18px;
        background: rgba(9,145,178,0.04);
        border-radius: 8px;
        border-left: 3px solid #0991B2;
      }

      /* REQ LIST */
      .jdd-req-list { display: flex; flex-direction: column; gap: 8px; }
      .jdd-req-item {
        display: flex; align-items: flex-start; gap: 10px;
        padding: 10px 14px; background: #FFFFFF;
        border: 1px solid #E5E7EB; border-radius: 8px;
        font-size: 13px; color: #0A0A0A; line-height: 1.6;
      }
      .jdd-req-check {
        width: 20px; height: 20px; border-radius: 8px;
        flex-shrink: 0; display: flex; align-items: center;
        justify-content: center; font-size: 10px; font-weight: 700; margin-top: 1px;
      }
      .jdd-req-check--required {
        background: linear-gradient(135deg,#34D399,#059669);
        color: #fff; box-shadow: 0 2px 6px rgba(5,150,105,0.25);
      }
      .jdd-req-check--accent { background: #E6F7FA; color: #0991B2; }

      /* PREF GRID */
      .jdd-pref-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .jdd-pref-item {
        padding: 10px 14px; background: #FFFFFF;
        border: 1px solid #E5E7EB; border-radius: 8px;
        font-size: 12px; font-weight: 600; color: #6B7280;
        display: flex; align-items: center; gap: 8px;
      }
      .jdd-pref-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: #D97706; flex-shrink: 0;
      }

      /* SIDE CARD */
      .jdd-side-card { padding: 22px 20px; }
      .jdd-side-title {
        font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 900;
        color: #0A0A0A; margin-bottom: 16px;
        display: flex; align-items: center; gap: 8px;
      }
      .jdd-updating { font-size: 11px; color: #6B7280; font-weight: 400; margin-left: auto; }

      /* STATUS CHANGE */
      .jdd-status-list { display: flex; flex-direction: column; gap: 8px; }
      .jdd-sc-opt {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 14px; border-radius: 8px;
        cursor: pointer; border: 1.5px solid #E5E7EB;
        background: #FFFFFF; transition: all .2s; width: 100%; text-align: left;
      }
      .jdd-sc-opt:hover:not(:disabled) { border-color: #0991B2; background: #F0FAFD; }
      .jdd-sc-opt--sel { border-color: #0991B2; background: #E6F7FA; }
      .jdd-sc-opt:disabled { opacity: .6; cursor: not-allowed; }
      .jdd-sc-icon { font-size: 18px; flex-shrink: 0; }
      .jdd-sc-radio {
        width: 18px; height: 18px; border-radius: 50%;
        border: 2px solid #E5E7EB;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; transition: all .2s;
      }
      .jdd-sc-opt--sel .jdd-sc-radio { border-color: #0991B2; background: #0991B2; }
      .jdd-sc-radio-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; }
      .jdd-sc-label { font-size: 13px; font-weight: 700; color: #0A0A0A; }
      .jdd-sc-sub { font-size: 11px; color: #6B7280; margin-top: 1px; }

      /* QUICK ACTIONS */
      .jdd-qa-list { display: flex; flex-direction: column; gap: 8px; }
      .jdd-qa-btn {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 14px; border-radius: 8px;
        border: 1px solid #E5E7EB; background: #FFFFFF;
        cursor: pointer; font-size: 13px; font-weight: 600; color: #0A0A0A;
        transition: all .2s; text-align: left; width: 100%; text-decoration: none;
      }
      .jdd-qa-btn:hover { background: #F9FAFB; transform: translateY(-1px); box-shadow: var(--sc); }
      .jdd-qa-icon {
        width: 32px; height: 32px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 15px; flex-shrink: 0;
      }
      .jdd-qa-info { flex: 1; }
      .jdd-qa-title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; }
      .jdd-qa-sub { font-size: 11px; color: #6B7280; margin-top: 1px; }
      .jdd-qa-arrow { color: #9CA3AF; font-size: 16px; }

      /* INFO TABLE */
      .jdd-info-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px;
      }
      .jdd-info-row:last-child { border-bottom: none; padding-bottom: 0; }
      .jdd-info-key { color: #6B7280; font-weight: 600; }
      .jdd-info-val { color: #0A0A0A; font-weight: 500; text-align: right; }
      .jdd-badge {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px;
      }
      .jdd-badge--ok      { background: #D1FAE5; color: #047857; }
      .jdd-badge--pending { background: #FEF3C7; color: #D97706; }
      .jdd-badge--off     { background: #F3F4F6; color: #9CA3AF; }

      /* RESPONSIVE */
      @media (max-width: 900px) {
        .jdd-layout { grid-template-columns: 1fr; }
        .jdd-side { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .jdd-pref-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 640px) {
        .jdd-wrap { padding: 80px 16px 40px; }
        .jdd-nav { padding: 12px 16px; }
        .jdd-side { grid-template-columns: 1fr; }
        .jdd-hero { padding: 24px 16px; }
        .jdd-section { padding: 20px 16px; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation: none !important; transition: none !important; }
      }
    `;

function Styles() {
  return <style>{JDD_STYLES}</style>;
}
