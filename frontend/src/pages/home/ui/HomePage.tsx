import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useHomeStore } from "@/features/home";
import "./HomePage.css";

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
