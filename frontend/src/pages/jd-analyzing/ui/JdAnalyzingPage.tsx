import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useJdAnalyzingStore, type StepStatus } from "@/features/jd";
import { useSessionStore } from "@/entities/session";

function StepBadge({ label, status }: { label: string; status: StepStatus }) {
  const cls =
    status === "done"
      ? "jan-step jan-step--done"
      : status === "active"
      ? "jan-step jan-step--active"
      : "jan-step jan-step--pending";

  return (
    <span className={cls}>
      {status === "done" ? `✓ ${label}` : status === "active" ? `⟳ ${label}` : label}
    </span>
  );
}

export function JdAnalyzingPage() {
  const navigate = useNavigate();
  const { steps, progress, isRunning, startAnalysis, reset } = useJdAnalyzingStore();
  const { user } = useSessionStore();

  useEffect(() => {
    reset();
    startAnalysis(() => {
      // 분석 완료 후 상세 페이지로 이동 (mock id 사용)
      setTimeout(() => navigate("/jd/detail/mock-jd-1"), 600);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = steps.find((s) => s.status === "active");
  const subText = isRunning
    ? currentStep
      ? `${currentStep.label} 처리 중...`
      : "잠깐만요, 금방 끝나요 ✨"
    : "분석 완료! 잠시 후 이동합니다...";

  return (
    <div className="jan-page">
      {/* NAV */}
      <nav className="jan-nav">
        <div className="jan-nav-pill">
          <Link to="/home" className="jan-logo">
            me<span style={{ color: "#0991B2" }}>Fit</span>
          </Link>
          <ul className="jan-nav-links">
            <li><Link to="/home" className="jan-nav-link">홈</Link></li>
            <li><Link to="/jd" className="jan-nav-link jan-nav-link--active">채용공고</Link></li>
            <li><Link to="/interview" className="jan-nav-link">면접 시작</Link></li>
            <li><Link to="/resume" className="jan-nav-link">이력서</Link></li>
          </ul>
          <div className="jan-nav-avatar">{user?.initial || "U"}</div>
        </div>
      </nav>

      <div className="jan-wrap">

        {/* BREADCRUMB */}
        <div className="jan-breadcrumb">
          <Link to="/jd" className="jan-bc-link">채용공고</Link>
          <span className="jan-bc-sep">›</span>
          <span className="jan-bc-current">분석 중</span>
        </div>

        {/* ANALYZING HERO */}
        <div className="jan-card jan-hero">
          <div className="jan-hero-bg" />

          <div className="jan-spinner-wrap">
            <div className="jan-spinner" />
          </div>

          <div className="jan-hero-title">AI가 공고를 분석하고 있어요</div>
          <div className="jan-hero-sub">{subText}</div>

          <div className="jan-progress">
            <div className="jan-prog-bar">
              <div
                className="jan-prog-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="jan-steps">
              {steps.map((s) => (
                <StepBadge key={s.key} label={s.label} status={s.status} />
              ))}
            </div>
          </div>
        </div>

        {/* SKELETON CARD 1 */}
        <div className="jan-card jan-skeleton-card">
          <div className="jan-sk-line jan-sk-w20" style={{ marginBottom: 18 }} />
          <div className="jan-sk-line jan-sk-w60" />
          <div className="jan-sk-line jan-sk-w80" />
          <div className="jan-sk-line jan-sk-w35" style={{ marginBottom: 20 }} />
          <div className="jan-sk-block" style={{ height: 80 }} />
          <div className="jan-sk-block" style={{ height: 60 }} />
        </div>

        {/* SKELETON CARD 2 */}
        <div className="jan-card jan-skeleton-card">
          <div className="jan-sk-line jan-sk-w20" style={{ marginBottom: 14 }} />
          <div className="jan-sk-line jan-sk-w100" />
          <div className="jan-sk-line jan-sk-w80" />
          <div className="jan-sk-line jan-sk-w60" />
        </div>

        {/* BACK CTA */}
        <div className="jan-back-cta">
          <p className="jan-back-desc">분석 중에도 다른 작업을 진행할 수 있어요</p>
          <Link to="/jd" className="jan-btn-secondary">목록으로 돌아가기</Link>
        </div>
      </div>

      <style>{`
        @keyframes jan-spin { to { transform: rotate(360deg); } }
        @keyframes jan-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes jan-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes jan-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .jan-page {
          min-height: 100vh;
          background: #FFFFFF;
          font-family: 'Inter', sans-serif;
          color: #0A0A0A;
        }

        /* NAV */
        .jan-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 200;
          padding: 14px 32px;
          display: flex;
          justify-content: center;
        }
        .jan-nav-pill {
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
        .jan-logo {
          font-family: 'Inter', sans-serif;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: -.3px;
          color: #0A0A0A;
          text-decoration: none;
        }
        .jan-nav-links {
          display: flex;
          gap: 4px;
          list-style: none;
        }
        .jan-nav-link {
          font-size: 13px;
          font-weight: 500;
          color: #6B7280;
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 8px;
          transition: all .2s;
        }
        .jan-nav-link:hover { color: #0A0A0A; background: rgba(9,145,178,0.06); }
        .jan-nav-link--active { color: #0991B2; background: #E6F7FA; font-weight: 700; }
        .jan-nav-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg,#06B6D4,#0891B2);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff;
          box-shadow: var(--sb);
          cursor: pointer;
        }

        /* WRAP */
        .jan-wrap {
          max-width: 720px;
          margin: 0 auto;
          padding: 100px 32px 60px;
        }

        /* CARD */
        .jan-card {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          box-shadow: var(--sc);
        }

        /* BREADCRUMB */
        .jan-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6B7280;
          margin-bottom: 24px;
        }
        .jan-bc-link { color: #6B7280; text-decoration: none; transition: color .2s; }
        .jan-bc-link:hover { color: #0991B2; }
        .jan-bc-sep { opacity: .5; }
        .jan-bc-current { color: #0A0A0A; font-weight: 600; }

        /* HERO */
        .jan-hero {
          padding: 48px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
          margin-bottom: 18px;
          animation: jan-fadeUp .45s ease both;
        }
        .jan-hero-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(9,145,178,0.06), rgba(6,182,212,0.04));
          pointer-events: none;
        }
        .jan-spinner-wrap {
          width: 80px; height: 80px;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: var(--sc);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          position: relative;
        }
        .jan-spinner {
          width: 44px; height: 44px;
          border: 4px solid rgba(9,145,178,0.15);
          border-top-color: #0991B2;
          border-radius: 50%;
          animation: jan-spin 0.9s linear infinite;
        }
        .jan-hero-title {
          font-family: 'Inter', sans-serif;
          font-size: 22px;
          font-weight: 900;
          color: #0A0A0A;
          margin-bottom: 8px;
          position: relative;
        }
        .jan-hero-sub {
          font-size: 14px;
          color: #6B7280;
          position: relative;
          min-height: 20px;
        }

        /* PROGRESS */
        .jan-progress { margin-top: 24px; position: relative; }
        .jan-prog-bar {
          height: 6px;
          background: #E5E7EB;
          border-radius: 100px;
          overflow: hidden;
          max-width: 320px;
          margin: 0 auto;
        }
        .jan-prog-fill {
          height: 100%;
          background: linear-gradient(90deg, #06B6D4, #0991B2);
          border-radius: 100px;
          transition: width 0.5s ease;
        }
        .jan-steps {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .jan-step {
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 100px;
        }
        .jan-step--done    { background: #D1FAE5; color: #047857; }
        .jan-step--active  { background: #E6F7FA; color: #0991B2; animation: jan-pulse 1.5s ease-in-out infinite; }
        .jan-step--pending { background: #F3F4F6; color: #9CA3AF; }

        /* SKELETON */
        .jan-skeleton-card {
          padding: 28px 32px;
          margin-bottom: 18px;
          animation: jan-fadeUp .45s ease .1s both;
        }
        .jan-sk-line {
          height: 14px;
          border-radius: 100px;
          background: linear-gradient(
            90deg,
            rgba(9,145,178,0.05) 25%,
            rgba(9,145,178,0.12) 50%,
            rgba(9,145,178,0.05) 75%
          );
          background-size: 200% 100%;
          animation: jan-shimmer 1.8s infinite;
          margin-bottom: 10px;
        }
        .jan-sk-w20  { width: 20%; }
        .jan-sk-w35  { width: 35%; }
        .jan-sk-w60  { width: 60%; }
        .jan-sk-w80  { width: 80%; }
        .jan-sk-w100 { width: 100%; }
        .jan-sk-block {
          border-radius: 8px;
          background: linear-gradient(
            90deg,
            rgba(9,145,178,0.05) 25%,
            rgba(9,145,178,0.12) 50%,
            rgba(9,145,178,0.05) 75%
          );
          background-size: 200% 100%;
          animation: jan-shimmer 1.8s infinite;
          margin-bottom: 14px;
        }

        /* BACK CTA */
        .jan-back-cta { text-align: center; margin-top: 24px; }
        .jan-back-desc { font-size: 13px; color: #6B7280; margin-bottom: 16px; }
        .jan-btn-secondary {
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
          transition: background .2s;
          text-decoration: none;
          white-space: nowrap;
        }
        .jan-btn-secondary:hover { background: #cceef6; }

        /* RESPONSIVE */
        @media (max-width: 640px) {
          .jan-wrap { padding: 80px 16px 40px; }
          .jan-nav { padding: 12px 16px; }
          .jan-hero { padding: 36px 20px; }
          .jan-skeleton-card { padding: 20px 16px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
