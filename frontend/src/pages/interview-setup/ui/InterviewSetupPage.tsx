import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useInterviewSetupStore } from "@/features/interview-setup";

export function InterviewSetupPage() {
  const {
    jdList, jdListLoading, jdTab, selectedJdId,
    directCompany, directRole, directStage, directUrl,
    interviewMode, practiceMode,
    loadJdList, setJdTab, selectJd, setDirectField,
    setInterviewMode, setPracticeMode, getSummary,
  } = useInterviewSetupStore();

  const summary = getSummary();

  useEffect(() => {
    loadJdList();
  }, [loadJdList]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rv = (..._args: unknown[]) => "";
  const rvd = (delay: number): React.CSSProperties =>
    ({ transitionDelay: `${delay}ms` });

  return (
    <>
      <style>{`
        /* ── RESET ── */
        .isetup-wrap *, .isetup-wrap *::before, .isetup-wrap *::after { box-sizing: border-box; }

        /* ── NAV ── */
        .isetup-nav {
          position: sticky; top: 0; z-index: 200;
          background: rgba(255,255,255,.92); backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid #E5E7EB;
          height: 60px; display: flex; align-items: center; padding: 0 32px; gap: 16px;
        }
        .isetup-logo { font-size: 20px; font-weight: 900; color: #0A0A0A; text-decoration: none; letter-spacing: -.4px; margin-right: auto; }
        .isetup-logo .hi { color: #0991B2; }
        .isetup-nav-link { font-size: 14px; font-weight: 500; color: #6B7280; text-decoration: none; padding: 6px 12px; border-radius: 8px; transition: color .15s, background .15s; }
        .isetup-nav-link:hover { color: #0A0A0A; background: #F9FAFB; }
        .isetup-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          color: #fff; background: #0A0A0A; border: none; border-radius: 8px;
          padding: 9px 18px; cursor: pointer; transition: opacity .15s, transform .15s;
          text-decoration: none; white-space: nowrap;
        }
        .isetup-btn-primary:hover { opacity: .85; transform: translateY(-1px); }

        /* ── LAYOUT ── */
        .isetup-shell { display: grid; grid-template-columns: 220px 1fr; min-height: calc(100vh - 60px); }

        /* ── SIDEBAR ── */
        .isetup-sidebar {
          position: sticky; top: 60px; height: calc(100vh - 60px); overflow-y: auto;
          border-right: 1px solid #E5E7EB; padding: 20px 12px;
          display: flex; flex-direction: column; gap: 2px; background: #FFFFFF;
        }
        .isetup-sb-sep { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #9CA3AF; padding: 16px 12px 6px; }
        .isetup-sb-item { display: flex; align-items: center; gap: 9px; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 500; color: #6B7280; cursor: pointer; transition: all .15s; text-decoration: none; }
        .isetup-sb-item:hover { background: #F9FAFB; color: #0A0A0A; }
        .isetup-sb-item.active { background: #E6F7FA; color: #0991B2; font-weight: 700; }
        .isetup-sb-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; background: #F9FAFB; }
        .isetup-sb-item.active .isetup-sb-icon { background: rgba(9,145,178,.12); }
        .isetup-sb-badge { margin-left: auto; font-size: 10px; font-weight: 700; background: #E6F7FA; color: #0991B2; padding: 2px 7px; border-radius: 100px; }
        .isetup-sb-streak { margin-top: auto; background: #0991B2; border-radius: 8px; padding: 16px; color: #fff; }
        .isetup-ssc-label { font-size: 10px; font-weight: 600; opacity: .7; margin-bottom: 4px; }
        .isetup-ssc-num { font-size: 30px; font-weight: 900; line-height: 1; letter-spacing: -1px; }
        .isetup-ssc-unit { font-size: 11px; opacity: .65; margin-top: 2px; }

        /* ── MAIN ── */
        .isetup-main { padding: 28px 32px; min-width: 0; }

        /* ── ANIMATIONS ── */
        .isetup-rv { opacity: 0; transform: translateY(14px); transition: opacity .4s ease, transform .4s ease; }
        .isetup-rv-in { opacity: 1; transform: translateY(0); }
        @keyframes isetup-fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        /* ── PAGE HEADER ── */
        .isetup-page-header { margin-bottom: 24px; animation: isetup-fadeUp .4s ease both; }
        .isetup-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6B7280; margin-bottom: 10px; }
        .isetup-bc-sep { opacity: .4; }
        .isetup-bc-cur { color: #0991B2; font-weight: 700; }
        .isetup-breadcrumb a { color: inherit; text-decoration: none; }
        .isetup-breadcrumb a:hover { color: #0A0A0A; }
        .isetup-page-title { font-size: clamp(22px, 2.5vw, 30px); font-weight: 900; letter-spacing: -.5px; margin-bottom: 6px; }
        .isetup-page-sub { font-size: 14px; color: #6B7280; }

        /* ── STEPPER ── */
        .isetup-stepper {
          display: flex; align-items: center;
          background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;
          padding: 14px 22px; margin-bottom: 24px;
          box-shadow: 0 1px 2px rgba(0,0,0,.03), 0 2px 8px rgba(0,0,0,.05);
        }
        .isetup-step-item { display: flex; align-items: center; gap: 7px; }
        .isetup-step-circle {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; flex-shrink: 0; transition: all .25s;
        }
        .isetup-sc-done { background: #0991B2; color: #fff; }
        .isetup-sc-active { background: #0A0A0A; color: #fff; }
        .isetup-sc-idle { background: #E5E7EB; color: #6B7280; }
        .isetup-step-label { font-size: 12px; font-weight: 600; color: #6B7280; }
        .isetup-step-label.active { color: #0A0A0A; font-weight: 700; }
        .isetup-step-line { flex: 1; height: 1.5px; background: #E5E7EB; margin: 0 10px; }
        .isetup-step-line.done { background: #0991B2; }

        /* ── SETUP BODY ── */
        .isetup-body { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }

        /* ── FORM BLOCK ── */
        .isetup-form-block {
          background: #fff; border: 1px solid #E5E7EB; border-radius: 8px;
          padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06);
          margin-bottom: 14px;
        }
        .isetup-form-block:last-child { margin-bottom: 0; }
        .isetup-fb-label { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #0991B2; margin-bottom: 10px; display: block; }
        .isetup-fb-title { font-size: 15px; font-weight: 800; margin-bottom: 3px; }
        .isetup-fb-desc { font-size: 13px; color: #6B7280; margin-bottom: 14px; line-height: 1.5; }

        /* ── JD TABS ── */
        .isetup-jd-tabs { display: flex; gap: 6px; margin-bottom: 14px; }
        .isetup-jd-tab {
          flex: 1; padding: 8px; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          border: 1.5px solid #E5E7EB; background: transparent; color: #6B7280;
          cursor: pointer; transition: all .15s;
        }
        .isetup-jd-tab.active { background: #E6F7FA; border-color: #0991B2; color: #0991B2; }

        /* ── JD LIST ── */
        .isetup-jd-list { display: flex; flex-direction: column; gap: 7px; max-height: 210px; overflow-y: auto; }
        .isetup-jd-item {
          display: flex; align-items: center; gap: 11px; padding: 12px 14px;
          border-radius: 8px; border: 1.5px solid #E5E7EB; background: #F9FAFB;
          cursor: pointer; transition: all .15s;
        }
        .isetup-jd-item:hover { border-color: #0991B2; background: #E6F7FA; }
        .isetup-jd-item.sel { border-color: #0991B2; background: #E6F7FA; }
        .isetup-jd-logo { width: 32px; height: 32px; border-radius: 8px; background: #fff; border: 1px solid #E5E7EB; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .isetup-jd-info { flex: 1; min-width: 0; }
        .isetup-jd-company { font-size: 12px; font-weight: 700; }
        .isetup-jd-role { font-size: 11px; color: #6B7280; margin-top: 1px; }
        .isetup-jd-check { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid #E5E7EB; display: flex; align-items: center; justify-content: center; font-size: 9px; flex-shrink: 0; transition: all .15s; }
        .isetup-jd-item.sel .isetup-jd-check { background: #0991B2; border-color: #0991B2; color: #fff; }
        .isetup-badge { display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; color: #0991B2; background: #E6F7FA; padding: 3px 10px; border-radius: 100px; }
        .isetup-badge-green { color: #059669; background: #ECFDF5; }
        .isetup-badge-dark { color: #fff; background: #0991B2; }

        /* ── INPUTS ── */
        .isetup-inp {
          width: 100%; padding: 10px 13px; border-radius: 8px;
          border: 1.5px solid #E5E7EB; background: #fff;
          font-family: 'Inter', sans-serif; font-size: 13px; color: #0A0A0A;
          outline: none; transition: border-color .15s; appearance: none;
        }
        .isetup-inp:focus { border-color: #0991B2; box-shadow: 0 0 0 3px rgba(9,145,178,.1); }
        .isetup-inp::placeholder { color: #9CA3AF; }
        .isetup-inp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .isetup-inp-label { font-size: 11px; font-weight: 600; color: #6B7280; margin-bottom: 4px; }

        /* ── SKIP BOX ── */
        .isetup-skip-box {
          padding: 18px; background: #F9FAFB; border-radius: 8px;
          border: 1.5px dashed #E5E7EB; text-align: center;
        }

        /* ── MODE CARDS ── */
        .isetup-mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .isetup-mode-card { border-radius: 8px; padding: 18px; border: 1.5px solid #E5E7EB; background: #F9FAFB; cursor: pointer; transition: all .15s; }
        .isetup-mode-card:hover:not(.locked) { border-color: #0991B2; }
        .isetup-mode-card.sel { border-color: #0991B2; background: #E6F7FA; }
        .isetup-mode-card.locked { opacity: .45; cursor: not-allowed; }
        .isetup-mc-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .isetup-mc-title { font-size: 13px; font-weight: 800; }
        .isetup-mc-desc { font-size: 12px; color: #6B7280; line-height: 1.5; margin-bottom: 10px; }
        .isetup-mc-tags { display: flex; gap: 4px; flex-wrap: wrap; }
        .isetup-mc-tag { font-size: 10px; font-weight: 600; color: #0991B2; background: rgba(9,145,178,.1); padding: 2px 7px; border-radius: 100px; }
        .isetup-mc-lock { font-size: 11px; color: #6B7280; margin-top: 6px; display: flex; align-items: center; gap: 4px; }

        /* ── PRACTICE OPTS ── */
        .isetup-prac-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .isetup-prac-opt { border-radius: 8px; padding: 16px; border: 1.5px solid #E5E7EB; background: #F9FAFB; cursor: pointer; transition: all .15s; }
        .isetup-prac-opt:hover { border-color: #0991B2; }
        .isetup-prac-opt.sel { border-color: #0991B2; background: #E6F7FA; }
        .isetup-po-icon { font-size: 20px; margin-bottom: 7px; display: block; }
        .isetup-po-title { font-size: 13px; font-weight: 800; margin-bottom: 4px; }
        .isetup-po-desc { font-size: 12px; color: #6B7280; line-height: 1.45; }

        /* ── SUMMARY PANEL ── */
        .isetup-sum-panel { position: sticky; top: calc(60px + 24px); }
        .isetup-sum-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; padding: 22px; box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06); margin-bottom: 12px; }
        .isetup-sum-title { font-size: 14px; font-weight: 800; margin-bottom: 14px; }
        .isetup-sum-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
        .isetup-sum-row:last-child { border-bottom: none; }
        .isetup-sum-key { font-size: 12px; color: #6B7280; font-weight: 500; }
        .isetup-sum-val { font-size: 12px; font-weight: 700; text-align: right; max-width: 160px; }
        .isetup-sum-hint { background: #E6F7FA; border: 1px solid rgba(9,145,178,.15); border-radius: 8px; padding: 12px; margin-bottom: 12px; }
        .isetup-sh-title { font-size: 11px; font-weight: 700; color: #0991B2; margin-bottom: 3px; }
        .isetup-sh-desc { font-size: 11px; color: #6B7280; line-height: 1.5; }

        /* ── BUTTONS ── */
        .isetup-btn-next {
          width: 100%; padding: 14px; border-radius: 8px; border: none;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all .2s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          text-decoration: none;
        }
        .isetup-btn-next.ready { background: #0A0A0A; color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06); }
        .isetup-btn-next.ready:hover { opacity: .85; transform: translateY(-1px); }
        .isetup-btn-next.off { background: #F9FAFB; color: #6B7280; cursor: not-allowed; }
        .isetup-btn-back {
          width: 100%; padding: 11px; border-radius: 8px;
          border: 1.5px solid #E5E7EB; background: transparent;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #6B7280;
          cursor: pointer; transition: all .15s; margin-top: 8px;
          display: flex; align-items: center; justify-content: center; text-decoration: none;
        }
        .isetup-btn-back:hover { border-color: #0A0A0A; color: #0A0A0A; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .isetup-shell { grid-template-columns: 1fr; }
          .isetup-sidebar { display: none; }
          .isetup-body { grid-template-columns: 1fr; }
          .isetup-sum-panel { position: static; }
        }
        @media (max-width: 640px) {
          .isetup-nav { padding: 0 16px; }
          .isetup-main { padding: 20px 16px; }
          .isetup-mode-grid, .isetup-prac-row, .isetup-inp-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="isetup-wrap">
        {/* NAV */}
        <nav className="isetup-nav">
          <Link to="/home" className="isetup-logo">me<span className="hi">Fit</span></Link>
          <Link to="/home" className="isetup-nav-link">홈</Link>
          <Link to="/resume/input" className="isetup-nav-link">이력서</Link>
          <Link to="/jd" className="isetup-nav-link">채용공고</Link>
          <Link to="/interview/setup" className="isetup-btn-primary">면접 시작 →</Link>
        </nav>

        <div className="isetup-shell">
          {/* SIDEBAR */}
          <aside className="isetup-sidebar">
            <div className="isetup-sb-sep">메인</div>
            <Link to="/home" className="isetup-sb-item"><span className="isetup-sb-icon">🏠</span>홈</Link>
            <Link to="/interview/setup" className="isetup-sb-item active"><span className="isetup-sb-icon">🎥</span>면접 시작</Link>
            <div className="isetup-sb-sep">관리</div>
            <Link to="/resume/input" className="isetup-sb-item"><span className="isetup-sb-icon">📄</span>이력서</Link>
            <Link to="/jd" className="isetup-sb-item"><span className="isetup-sb-icon">🏢</span>채용공고<span className="isetup-sb-badge">3</span></Link>
            <div className="isetup-sb-sep">분석</div>
            <Link to="#" className="isetup-sb-item"><span className="isetup-sb-icon">📊</span>리뷰 리포트</Link>
            <Link to="#" className="isetup-sb-item"><span className="isetup-sb-icon">🔥</span>스트릭</Link>
            <div className="isetup-sb-sep">설정</div>
            <Link to="#" className="isetup-sb-item"><span className="isetup-sb-icon">💳</span>요금제</Link>
            <Link to="#" className="isetup-sb-item"><span className="isetup-sb-icon">⚙️</span>계정 설정</Link>
            <div className="isetup-sb-streak">
              <div className="isetup-ssc-label">🔥 현재 스트릭</div>
              <div className="isetup-ssc-num">12</div>
              <div className="isetup-ssc-unit">연속 일수</div>
            </div>
          </aside>

          {/* MAIN */}
          <main className="isetup-main">
            {/* Page Header */}
            <div className="isetup-page-header">
              <div className="isetup-breadcrumb">
                <Link to="/home">홈</Link>
                <span className="isetup-bc-sep">/</span>
                <span className="isetup-bc-cur">면접 설정</span>
              </div>
              <h1 className="isetup-page-title">면접을 설정해요</h1>
              <p className="isetup-page-sub">채용공고와 면접 방식을 선택하고 AI 맞춤 면접을 시작하세요.</p>
            </div>

            {/* Stepper */}
            <div className={rv(0)} style={rvd(0)}>
              <div className="isetup-stepper">
                <div className="isetup-step-item">
                  <div className="isetup-step-circle isetup-sc-active">1</div>
                  <span className="isetup-step-label active">지원 컨텍스트</span>
                </div>
                <div className="isetup-step-line" />
                <div className="isetup-step-item">
                  <div className="isetup-step-circle isetup-sc-idle">2</div>
                  <span className="isetup-step-label">면접 방식</span>
                </div>
                <div className="isetup-step-line" />
                <div className="isetup-step-item">
                  <div className="isetup-step-circle isetup-sc-idle">3</div>
                  <span className="isetup-step-label">환경 점검</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="isetup-body">
              {/* LEFT: FORM */}
              <div>
                {/* Section 1: JD */}
                <div className={`isetup-form-block ${rv(55)}`} style={rvd(55)}>
                  <span className="isetup-fb-label">지원 컨텍스트</span>
                  <div className="isetup-fb-title">채용공고를 선택하세요</div>
                  <div className="isetup-fb-desc">등록된 채용공고를 선택하거나 직접 입력할 수 있어요.</div>

                  {/* Tabs */}
                  <div className="isetup-jd-tabs">
                    {(["saved", "direct", "skip"] as const).map((tab) => (
                      <button
                        key={tab}
                        className={`isetup-jd-tab${jdTab === tab ? " active" : ""}`}
                        onClick={() => setJdTab(tab)}
                      >
                        {tab === "saved" ? "저장된 공고" : tab === "direct" ? "직접 입력" : "건너뛰기"}
                      </button>
                    ))}
                  </div>

                  {/* Tab: saved */}
                  {jdTab === "saved" && (
                    <div className="isetup-jd-list">
                      {jdListLoading ? (
                        <div style={{ padding: 16, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>불러오는 중...</div>
                      ) : jdList.map((jd) => (
                        <div
                          key={jd.id}
                          className={`isetup-jd-item${selectedJdId === jd.id ? " sel" : ""}`}
                          onClick={() => selectJd(jd.id)}
                        >
                          <div className="isetup-jd-logo">{jd.icon}</div>
                          <div className="isetup-jd-info">
                            <div className="isetup-jd-company">{jd.company}</div>
                            <div className="isetup-jd-role">{jd.role} · {jd.stage}</div>
                          </div>
                          <span className={`isetup-badge${jd.badgeType === "green" ? " isetup-badge-green" : ""}`}>
                            {jd.badgeLabel}
                          </span>
                          <div className="isetup-jd-check">{selectedJdId === jd.id ? "✓" : ""}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab: direct */}
                  {jdTab === "direct" && (
                    <div>
                      <div className="isetup-inp-row" style={{ marginBottom: 10 }}>
                        <div>
                          <div className="isetup-inp-label">기업명</div>
                          <input
                            className="isetup-inp"
                            placeholder="예: 카카오뱅크"
                            value={directCompany}
                            onChange={(e) => setDirectField("directCompany", e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="isetup-inp-label">지원 직무</div>
                          <input
                            className="isetup-inp"
                            placeholder="예: 백엔드 개발자"
                            value={directRole}
                            onChange={(e) => setDirectField("directRole", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="isetup-inp-row">
                        <div>
                          <div className="isetup-inp-label">면접 단계</div>
                          <select
                            className="isetup-inp"
                            style={{ cursor: "pointer" }}
                            value={directStage}
                            onChange={(e) => setDirectField("directStage", e.target.value)}
                          >
                            <option>1차 면접</option>
                            <option>2차 면접</option>
                            <option>임원 면접</option>
                            <option>최종 면접</option>
                          </select>
                        </div>
                        <div>
                          <div className="isetup-inp-label">채용공고 URL (선택)</div>
                          <input
                            className="isetup-inp"
                            placeholder="https://..."
                            value={directUrl}
                            onChange={(e) => setDirectField("directUrl", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab: skip */}
                  {jdTab === "skip" && (
                    <div className="isetup-skip-box">
                      <div style={{ fontSize: 24, marginBottom: 7 }}>🎯</div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>프로필 정보로만 진행</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>직군·직업 정보를 기반으로 면접 질문을 생성합니다.</div>
                    </div>
                  )}
                </div>

                {/* Section 2: Interview Mode */}
                <div className={`isetup-form-block ${rv(110)}`} style={rvd(110)}>
                  <span className="isetup-fb-label">면접 방식</span>
                  <div className="isetup-fb-title">어떤 방식으로 진행할까요?</div>
                  <div className="isetup-fb-desc">꼬리질문은 한 주제를 심층 탐구, 전체 프로세스는 면접 전 과정을 연습해요.</div>
                  <div className="isetup-mode-grid">
                    <div
                      className={`isetup-mode-card${interviewMode === "tail" ? " sel" : ""}`}
                      onClick={() => setInterviewMode("tail")}
                    >
                      <div className="isetup-mc-top">
                        <span className="isetup-mc-title">꼬리질문 방식</span>
                        <span className="isetup-badge isetup-badge-green">Free</span>
                      </div>
                      <p className="isetup-mc-desc">답변을 분석해 연이어 꼬리질문을 생성. 심층 역량 검증에 최적화되어 있어요.</p>
                      <div className="isetup-mc-tags">
                        <span className="isetup-mc-tag">심층 탐구</span>
                        <span className="isetup-mc-tag">1~3 꼬리질문</span>
                        <span className="isetup-mc-tag">실시간 생성</span>
                      </div>
                    </div>
                    <div
                      className="isetup-mode-card locked"
                      onClick={() => alert("Pro 플랜 업그레이드 후 사용 가능해요!")}
                    >
                      <div className="isetup-mc-top">
                        <span className="isetup-mc-title">전체 프로세스</span>
                        <span className="isetup-badge isetup-badge-dark">Pro</span>
                      </div>
                      <p className="isetup-mc-desc">자기소개 → 지원동기 → 직무 질문 → 마무리까지 실제 면접 전 과정을 연습해요.</p>
                      <div className="isetup-mc-tags">
                        <span className="isetup-mc-tag">전체 흐름</span>
                        <span className="isetup-mc-tag">실전 밀착</span>
                      </div>
                      <div className="isetup-mc-lock">🔒 Pro 플랜이 필요해요</div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Practice Mode */}
                <div className={`isetup-form-block ${rv(165)}`} style={rvd(165)}>
                  <span className="isetup-fb-label">진행 모드</span>
                  <div className="isetup-fb-title">연습 방식을 선택하세요</div>
                  <div className="isetup-fb-desc">실전 모드는 랜덤 대기 후 자동으로 녹화가 시작돼요.</div>
                  <div className="isetup-prac-row">
                    <div
                      className={`isetup-prac-opt${practiceMode === "practice" ? " sel" : ""}`}
                      onClick={() => setPracticeMode("practice")}
                    >
                      <span className="isetup-po-icon">🎮</span>
                      <div className="isetup-po-title">연습 모드</div>
                      <div className="isetup-po-desc">준비 완료 버튼을 누르면 답변이 시작돼요. 자신의 페이스대로 연습할 수 있어요.</div>
                    </div>
                    <div
                      className={`isetup-prac-opt${practiceMode === "real" ? " sel" : ""}`}
                      onClick={() => setPracticeMode("real")}
                    >
                      <span className="isetup-po-icon">⚡</span>
                      <div className="isetup-po-title">실전 모드</div>
                      <div className="isetup-po-desc">5~30초 랜덤 대기 후 자동 녹화 시작. 실제 면접에 가장 가까운 긴장감을 경험해요.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: SUMMARY */}
              <div className="isetup-sum-panel">
                <div className={`isetup-sum-card ${rv(55)}`} style={rvd(55)}>
                  <div className="isetup-sum-title">면접 설정 요약</div>
                  {[
                    { key: "기업", val: summary.company },
                    { key: "직무", val: summary.role },
                    { key: "면접 단계", val: summary.stage },
                    { key: "면접 방식", val: summary.interviewModeLabel },
                    { key: "진행 모드", val: summary.practiceModeLabel },
                  ].map((row) => (
                    <div key={row.key} className="isetup-sum-row">
                      <span className="isetup-sum-key">{row.key}</span>
                      <span className="isetup-sum-val">{row.val}</span>
                    </div>
                  ))}
                </div>

                <div className={`isetup-sum-hint ${rv(110)}`} style={rvd(110)}>
                  <div className="isetup-sh-title">💡 이런 질문이 생성돼요</div>
                  <div className="isetup-sh-desc">백엔드 직군 기반으로 JVM 메모리 구조, 트랜잭션 처리, DB 인덱스 최적화 등 심층 기술 질문이 준비돼요.</div>
                </div>

                <Link
                  to="/interview/precheck"
                  className={`isetup-btn-next ready ${rv(165)}`}
                  style={rvd(165)}
                >
                  다음 — 환경 점검 →
                </Link>
                <Link
                  to="/home"
                  className={`isetup-btn-back ${rv(220)}`}
                  style={rvd(220)}
                >
                  ← 홈으로
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
