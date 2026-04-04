import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useHomeStore } from "@/features/home";

export function HomePage() {
  const { data, loading, fetchHome } = useHomeStore();
  const [revealed, setRevealed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchHome();
  }, [fetchHome]);

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => setRevealed(true), 50);
    return () => clearTimeout(t);
  }, [data]);

  return (
    <>
      <style>{`
        /* ── RESET & TOKENS ── */
        .hp-wrap *,
        .hp-wrap *::before,
        .hp-wrap *::after { box-sizing: border-box; }

        /* ── NAV ── */
        .hp-nav {
          position: sticky; top: 0; z-index: 200;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid #E5E7EB;
          height: 60px; display: flex; align-items: center;
          padding: 0 32px; gap: 16px;
        }
        .hp-nav-logo {
          font-size: 20px; font-weight: 900; color: #0A0A0A;
          text-decoration: none; letter-spacing: -.4px; margin-right: auto;
        }
        .hp-nav-logo .hi { color: #0991B2; }
        .hp-menu-btn {
          display: none;
          width: 40px; height: 40px;
          background: none; border: 1px solid #E5E7EB;
          border-radius: 8px; cursor: pointer;
          align-items: center; justify-content: center;
          transition: background .15s;
        }
        .hp-menu-btn:hover { background: #F9FAFB; }
        .hp-menu-icon {
          display: flex; flex-direction: column; gap: 4px;
        }
        .hp-menu-icon span {
          width: 18px; height: 2px; background: #0A0A0A;
          border-radius: 2px; transition: all .2s;
        }
        .hp-menu-btn.open .hp-menu-icon span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }
        .hp-menu-btn.open .hp-menu-icon span:nth-child(2) {
          opacity: 0;
        }
        .hp-menu-btn.open .hp-menu-icon span:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }
        .hp-nav-link {
          font-size: 14px; font-weight: 500; color: #6B7280;
          text-decoration: none; padding: 6px 12px; border-radius: 8px;
          transition: color .15s, background .15s;
        }
        .hp-nav-link:hover { color: #0A0A0A; background: #F9FAFB; }
        .hp-nav-link.active { color: #0A0A0A; font-weight: 600; }
        .hp-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          color: #FFFFFF; background: #0A0A0A;
          border: none; border-radius: 8px; padding: 9px 18px; cursor: pointer;
          transition: opacity .15s, transform .15s; text-decoration: none; white-space: nowrap;
        }
        .hp-btn-primary:hover { opacity: .85; transform: translateY(-1px); }
        .hp-btn-primary:active { transform: scale(.97); }

        /* ── LAYOUT ── */
        .hp-shell {
          display: grid; grid-template-columns: 220px 1fr;
          min-height: calc(100vh - 60px);
        }

        /* ── SIDEBAR ── */
        .hp-sidebar {
          position: sticky; top: 60px; height: calc(100vh - 60px);
          overflow-y: auto; border-right: 1px solid #E5E7EB;
          padding: 20px 12px; display: flex; flex-direction: column;
          gap: 2px; background: #FFFFFF;
        }
        .hp-sidebar-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 199;
          background: rgba(0,0,0,.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .hp-sidebar-overlay.open { display: block; }
        .hp-sb-sep {
          font-size: 10px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: #9CA3AF; padding: 16px 12px 6px;
        }
        .hp-sb-item {
          display: flex; align-items: center; gap: 9px; padding: 8px 12px;
          border-radius: 8px; font-size: 13px; font-weight: 500; color: #6B7280;
          cursor: pointer; transition: all .15s; text-decoration: none;
        }
        .hp-sb-item:hover { background: #F9FAFB; color: #0A0A0A; }
        .hp-sb-item.active { background: #E6F7FA; color: #0991B2; font-weight: 700; }
        .hp-sb-icon {
          width: 28px; height: 28px; border-radius: 8px; display: flex;
          align-items: center; justify-content: center; font-size: 14px;
          flex-shrink: 0; background: #F9FAFB;
        }
        .hp-sb-item.active .hp-sb-icon { background: rgba(9,145,178,.12); }
        .hp-sb-badge {
          margin-left: auto; font-size: 10px; font-weight: 700;
          background: #E6F7FA; color: #0991B2; padding: 2px 7px; border-radius: 100px;
        }
        .hp-sb-streak-card {
          margin-top: auto; background: #0991B2; border-radius: 8px;
          padding: 16px; color: #fff;
        }
        .hp-ssc-label { font-size: 10px; font-weight: 600; opacity: .7; margin-bottom: 4px; }
        .hp-ssc-num { font-size: 30px; font-weight: 900; line-height: 1; letter-spacing: -1px; }
        .hp-ssc-unit { font-size: 11px; opacity: .65; margin-top: 2px; }

        /* ── MAIN ── */
        .hp-main { padding: 28px 32px; min-width: 0; }

        /* ── BADGE ── */
        .hp-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 700; color: #0991B2;
          background: #E6F7FA; padding: 3px 10px; border-radius: 100px;
        }
        .hp-badge-neutral {
          color: #6B7280; background: #F9FAFB;
          border: 1px solid #E5E7EB;
        }

        /* ── ANIMATIONS ── */
        .hp-rv { opacity: 0; transform: translateY(14px); transition: opacity .4s ease, transform .4s ease; }
        .hp-rv-in { opacity: 1; transform: translateY(0); }
        @keyframes hp-fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        /* ── HOME HEADER ── */
        .hp-header { margin-bottom: 24px; animation: hp-fadeUp .4s ease both; }
        .hp-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: #0991B2; margin-bottom: 8px;
        }
        .hp-title {
          font-size: clamp(24px, 2.5vw, 32px); font-weight: 900;
          letter-spacing: -.6px; line-height: 1.15;
        }
        .hp-sub { font-size: 14px; color: #6B7280; margin-top: 6px; line-height: 1.6; }

        /* ── QUICK START HERO ── */
        .hp-qs-hero {
          background: #0A0A0A; color: #fff;
          border-radius: 8px; padding: 32px 36px; margin-bottom: 20px; cursor: pointer;
          display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,.05), 0 8px 20px rgba(0,0,0,.09), 0 16px 40px rgba(0,0,0,.08);
          transition: transform .2s, box-shadow .2s; text-decoration: none;
        }
        .hp-qs-hero:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(0,0,0,.06), 0 12px 28px rgba(0,0,0,.14), 0 24px 48px rgba(0,0,0,.1);
        }
        .hp-qsh-tag {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,.55);
          border: 1px solid rgba(255,255,255,.12); padding: 3px 10px;
          border-radius: 100px; margin-bottom: 10px;
        }
        .hp-qsh-tag .dot {
          width: 6px; height: 6px; border-radius: 50%; background: #06B6D4;
        }
        .hp-qsh-title {
          font-size: 22px; font-weight: 900; letter-spacing: -.4px;
          line-height: 1.2; margin-bottom: 6px;
        }
        .hp-qsh-sub {
          font-size: 13px; color: rgba(255,255,255,.55);
          margin-bottom: 20px; line-height: 1.5;
        }
        .hp-qsh-btns { display: flex; gap: 8px; flex-wrap: wrap; }
        .hp-qsh-btn-w {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          color: #0A0A0A; background: #fff; border: none; border-radius: 8px;
          padding: 9px 18px; cursor: pointer; transition: all .15s;
          text-decoration: none; display: inline-flex; align-items: center;
        }
        .hp-qsh-btn-w:hover { background: #F3F4F6; }
        .hp-qsh-btn-g {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,.7); background: rgba(255,255,255,.08);
          border: 1.5px solid rgba(255,255,255,.14); border-radius: 8px;
          padding: 9px 18px; cursor: pointer; transition: all .15s;
          text-decoration: none; display: inline-flex; align-items: center;
        }
        .hp-qsh-btn-g:hover { background: rgba(255,255,255,.14); color: #fff; }
        .hp-qs-visual {
          width: 180px; height: 140px; flex-shrink: 0;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
          border-radius: 8px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 6px;
        }
        .hp-qsv-icon { font-size: 36px; }
        .hp-qsv-text { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.5); }

        /* ── STATS ── */
        .hp-stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 12px; margin-bottom: 20px;
        }
        .hp-stat-card {
          background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;
          padding: 18px 20px;
          box-shadow: 0 1px 2px rgba(0,0,0,.03), 0 2px 8px rgba(0,0,0,.05);
          transition: box-shadow .2s, transform .2s; cursor: default;
        }
        .hp-stat-card:hover {
          box-shadow: 0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06);
          transform: translateY(-2px);
        }
        .hp-stat-icon { font-size: 18px; margin-bottom: 8px; display: block; }
        .hp-stat-num { font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #0A0A0A; }
        .hp-stat-label { font-size: 12px; color: #6B7280; font-weight: 500; margin-top: 2px; }
        .hp-stat-delta {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 11px; font-weight: 600; margin-top: 6px;
          padding: 2px 7px; border-radius: 100px;
        }
        .hp-delta-up { background: #ECFDF5; color: #059669; }
        .hp-delta-dn { background: #FFF1F2; color: #E11D48; }
        .hp-delta-neutral { background: #F9FAFB; color: #6B7280; }

        /* ── SECTION HEAD ── */
        .hp-sec-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .hp-sec-title { font-size: 15px; font-weight: 800; letter-spacing: -.2px; }
        .hp-sec-link { font-size: 12px; font-weight: 600; color: #0991B2; text-decoration: none; }

        /* ── SESSION LIST ── */
        .hp-session-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .hp-session-item {
          background: #fff; border: 1px solid #E5E7EB; border-radius: 8px;
          padding: 14px 18px; display: flex; align-items: center; gap: 14px;
          box-shadow: 0 1px 2px rgba(0,0,0,.03), 0 2px 8px rgba(0,0,0,.05);
          transition: all .15s; cursor: pointer; text-decoration: none; color: inherit;
        }
        .hp-session-item:hover {
          box-shadow: 0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06);
          transform: translateX(3px);
        }
        .hp-si-icon {
          width: 40px; height: 40px; border-radius: 8px; display: flex;
          align-items: center; justify-content: center; font-size: 16px;
          flex-shrink: 0; background: #F9FAFB; border: 1px solid #E5E7EB;
        }
        .hp-si-body { flex: 1; min-width: 0; }
        .hp-si-company {
          font-size: 13px; font-weight: 700; margin-bottom: 2px;
          display: flex; align-items: center; gap: 6px;
        }
        .hp-si-meta { font-size: 11px; color: #6B7280; }
        .hp-si-score { text-align: right; flex-shrink: 0; }
        .hp-si-num { font-size: 20px; font-weight: 900; letter-spacing: -.5px; color: #0991B2; }
        .hp-si-num-label { font-size: 10px; color: #6B7280; }

        /* ── BOTTOM GRID ── */
        .hp-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .hp-card-white {
          background: #fff; border: 1px solid #E5E7EB; border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06);
        }

        /* ── STREAK CAL ── */
        .hp-streak-cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin-bottom: 8px; }
        .hp-sc-day { aspect-ratio: 1; border-radius: 4px; }
        .hp-sc-0 { background: #E5E7EB; opacity: .5; }
        .hp-sc-1 { background: rgba(9,145,178,.18); }
        .hp-sc-2 { background: rgba(9,145,178,.38); }
        .hp-sc-3 { background: rgba(9,145,178,.62); }
        .hp-sc-4 { background: #0991B2; }
        .hp-sc-days-label { display: flex; justify-content: space-between; }
        .hp-sc-dl { font-size: 10px; color: #9CA3AF; }

        /* ── JOB LIST ── */
        .hp-job-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 0; border-bottom: 1px solid #E5E7EB;
        }
        .hp-job-item:last-child { border-bottom: none; }
        .hp-job-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .hp-jd-cyan { background: #0991B2; }
        .hp-jd-dark { background: #0A0A0A; }
        .hp-jd-gray { background: #9CA3AF; }
        .hp-job-body { flex: 1; min-width: 0; }
        .hp-job-name { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hp-job-sub { font-size: 11px; color: #6B7280; margin-top: 1px; }
        .hp-job-dday { font-size: 12px; font-weight: 800; color: #0991B2; }

        /* ── SKELETON ── */
        .hp-skeleton {
          background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
          background-size: 200% 100%;
          animation: hp-shimmer 1.4s infinite;
          border-radius: 8px;
        }
        @keyframes hp-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .hp-shell { grid-template-columns: 1fr; }
          .hp-menu-btn { display: flex; }
          .hp-nav-link:not(.active) { display: none; }
          .hp-sidebar {
            position: fixed; left: 0; top: 60px; bottom: 0;
            width: 280px; z-index: 201;
            transform: translateX(-100%);
            transition: transform .3s ease;
            border-right: 1px solid #E5E7EB;
            box-shadow: 2px 0 8px rgba(0,0,0,.1);
          }
          .hp-sidebar.open {
            transform: translateX(0);
          }
          .hp-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .hp-bottom { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .hp-nav { padding: 0 16px; }
          .hp-main { padding: 20px 16px; }
          .hp-stats-grid { grid-template-columns: 1fr 1fr; }
          .hp-qs-hero { grid-template-columns: 1fr; }
          .hp-qs-visual { display: none; }
        }
      `}</style>

      <div className="hp-wrap">
        {/* NAV */}
        <nav className="hp-nav">
          <button 
            className={`hp-menu-btn${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="메뉴"
          >
            <div className="hp-menu-icon">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
          <Link to="/home" className="hp-nav-logo">me<span className="hi">Fit</span></Link>
          <Link to="/home" className="hp-nav-link active">홈</Link>
          <Link to="/resume" className="hp-nav-link">이력서</Link>
          <Link to="/jd" className="hp-nav-link">채용공고</Link>
          <Link to="/interview/setup" className="hp-btn-primary">면접 시작 →</Link>
        </nav>

        {/* Sidebar Overlay */}
        <div 
          className={`hp-sidebar-overlay${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen(false)}
        />

        <div className="hp-shell">
          {/* SIDEBAR */}
          <aside className={`hp-sidebar${menuOpen ? " open" : ""}`}>
            <div className="hp-sb-sep">메인</div>
            <Link to="/home" className="hp-sb-item active">
              <span className="hp-sb-icon">🏠</span>홈
            </Link>
            <Link to="/interview/setup" className="hp-sb-item">
              <span className="hp-sb-icon">🎥</span>면접 시작
            </Link>
            <div className="hp-sb-sep">관리</div>
            <Link to="/resume" className="hp-sb-item">
              <span className="hp-sb-icon">📄</span>이력서
            </Link>
            <Link to="/jd" className="hp-sb-item">
              <span className="hp-sb-icon">🏢</span>채용공고
              <span className="hp-sb-badge">3</span>
            </Link>
            <div className="hp-sb-sep">분석</div>
            <Link to="#" className="hp-sb-item">
              <span className="hp-sb-icon">📊</span>리뷰 리포트
            </Link>
            <Link to="/streak" className="hp-sb-item">
              <span className="hp-sb-icon">🔥</span>스트릭
            </Link>
            <div className="hp-sb-sep">설정</div>
            <Link to="/subscription" className="hp-sb-item">
              <span className="hp-sb-icon">💳</span>요금제
            </Link>
            <Link to="/settings" className="hp-sb-item">
              <span className="hp-sb-icon">⚙️</span>계정 설정
            </Link>
            <div className="hp-sb-streak-card">
              <div className="hp-ssc-label">스트릭</div>
              <div className="hp-ssc-num">{data?.currentStreak ?? 0}</div>
              <div className="hp-ssc-unit">연속 일수</div>
            </div>
          </aside>

          {/* MAIN */}
          <main className="hp-main">
            {loading && !data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="hp-skeleton" style={{ height: 80 }} />
                <div className="hp-skeleton" style={{ height: 160 }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="hp-skeleton" style={{ height: 110 }} />
                  ))}
                </div>
              </div>
            ) : data ? (
              <>
                {/* Header */}
                <div className="hp-header">
                  <div className="hp-eyebrow">{data.user.greeting}</div>
                  <h1 className="hp-title">
                    안녕하세요, {data.user.name} 님.<br />오늘도 핏을 맞춰볼까요?
                  </h1>
                  <p className="hp-sub">
                    마지막 면접으로부터 {data.user.lastInterviewDaysAgo}일이 지났어요. 스트릭을 이어가세요!
                  </p>
                </div>

                {/* Quick Start Hero */}
                <Link
                  to="/interview/setup"
                  className={`hp-qs-hero hp-rv${revealed ? " hp-rv-in" : ""}`}
                  style={{ transitionDelay: "0ms" }}
                >
                  <div>
                    <div className="hp-qsh-tag">
                      <span className="dot" />빠른 시작
                    </div>
                    <div className="hp-qsh-title">AI 면접 바로 시작하기</div>
                    <div className="hp-qsh-sub">이전 설정을 불러와 바로 준비를 이어갈 수 있어요.</div>
                    <div className="hp-qsh-btns">
                      <span className="hp-qsh-btn-w">이어서 준비하기 →</span>
                      <span className="hp-qsh-btn-g">새 면접 설정</span>
                    </div>
                  </div>
                  <div className="hp-qs-visual">
                    <div className="hp-qsv-icon">🎙️</div>
                    <div className="hp-qsv-text">AI 면접관 대기 중</div>
                  </div>
                </Link>

                {/* Stats */}
                <div className="hp-stats-grid">
                  {data.stats.map((stat, i) => (
                    <div
                      key={i}
                      className={`hp-stat-card hp-rv${revealed ? " hp-rv-in" : ""}`}
                      style={{ transitionDelay: `${55 + i * 55}ms` }}
                    >
                      <span className="hp-stat-icon">{stat.icon}</span>
                      <div className="hp-stat-num">
                        {stat.value}
                        {stat.unit && (
                          <small style={{ fontSize: 14, opacity: 0.5 }}>{stat.unit}</small>
                        )}
                      </div>
                      <div className="hp-stat-label">{stat.label}</div>
                      <span
                        className={`hp-stat-delta ${
                          stat.deltaType === "up"
                            ? "hp-delta-up"
                            : stat.deltaType === "down"
                            ? "hp-delta-dn"
                            : "hp-delta-neutral"
                        }`}
                      >
                        {stat.delta}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Recent Sessions */}
                <div className={`hp-sec-head hp-rv${revealed ? " hp-rv-in" : ""}`} style={{ transitionDelay: "275ms" }}>
                  <div className="hp-sec-title">최근 면접 기록</div>
                  <a className="hp-sec-link" href="#">전체 보기 →</a>
                </div>
                <div className="hp-session-list">
                  {data.recentSessions.map((session, i) => (
                    <a
                      key={session.id}
                      className={`hp-session-item hp-rv${revealed ? " hp-rv-in" : ""}`}
                      style={{ transitionDelay: `${330 + i * 55}ms` }}
                      href="#"
                    >
                      <div className="hp-si-icon">{session.icon}</div>
                      <div className="hp-si-body">
                        <div className="hp-si-company">
                          {session.company}
                          <span
                            className={`hp-badge${session.badgeType === "neutral" ? " hp-badge-neutral" : ""}`}
                            style={{ fontSize: 10 }}
                          >
                            {session.badgeLabel}
                          </span>
                        </div>
                        <div className="hp-si-meta">
                          {session.role} · {session.round} · {session.date}
                        </div>
                      </div>
                      <div className="hp-si-score">
                        <div className="hp-si-num">{session.score}</div>
                        <div className="hp-si-num-label">종합 점수</div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Bottom Row */}
                <div className="hp-bottom">
                  {/* Streak Calendar */}
                  <div
                    className={`hp-card-white hp-rv${revealed ? " hp-rv-in" : ""}`}
                    style={{ padding: 20, transitionDelay: "495ms" }}
                  >
                    <div className="hp-sec-head" style={{ marginBottom: 12 }}>
                      <div className="hp-sec-title" style={{ fontSize: 13 }}>🔥 이번 달 스트릭</div>
                      <span className="hp-badge" style={{ fontSize: 10 }}>3월</span>
                    </div>
                    <div className="hp-streak-cal">
                      {data.streakData.map((v, i) => (
                        <div key={i} className={`hp-sc-day hp-sc-${v}`} />
                      ))}
                    </div>
                    <div className="hp-sc-days-label" style={{ marginTop: 6 }}>
                      {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
                        <span key={d} className="hp-sc-dl">{d}</span>
                      ))}
                    </div>
                  </div>

                  {/* Job Status */}
                  <div
                    className={`hp-card-white hp-rv${revealed ? " hp-rv-in" : ""}`}
                    style={{ padding: 20, transitionDelay: "550ms" }}
                  >
                    <div className="hp-sec-head" style={{ marginBottom: 12 }}>
                      <div className="hp-sec-title" style={{ fontSize: 13 }}>📋 지원 현황</div>
                      <Link to="/jd" className="hp-sec-link">관리 →</Link>
                    </div>
                    {data.jobs.map((job) => (
                      <div key={job.id} className="hp-job-item">
                        <div className={`hp-job-dot hp-jd-${job.dotColor}`} />
                        <div className="hp-job-body">
                          <div className="hp-job-name">{job.company} — {job.role}</div>
                          <div className="hp-job-sub">{job.stage}</div>
                        </div>
                        <div className="hp-job-dday">D-{job.dday}</div>
                      </div>
                    ))}
                    <div style={{ marginTop: 14 }}>
                      <Link
                        to="/interview/setup"
                        className="hp-btn-primary"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        면접 시작하기 →
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </main>
        </div>
      </div>
    </>
  );
}
