import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStreakStore } from "@/features/streak";

const MONTH_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function buildCalendarCells(
  year: number,
  month: number,
  doneSet: Set<number>,
  todayYear: number,
  todayMonth: number,
  todayDay: number,
) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();
  const cells: { day: number | null; done: boolean; today: boolean }[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, done: false, today: false });
  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      day: d,
      done: doneSet.has(d),
      today: year === todayYear && month === todayMonth && d === todayDay,
    });
  }
  return cells;
}

export function StreakPage() {
  const { data, loading, fetchStreak } = useStreakStore();

  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();

  const [viewY, setViewY] = useState(todayY);
  const [viewM, setViewM] = useState(todayM);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(t);
  }, [data]);

  const prevMonth = () => {
    if (viewM === 1) { setViewY(y => y - 1); setViewM(12); }
    else setViewM(m => m - 1);
  };
  const nextMonth = () => {
    if (viewM === 12) { setViewY(y => y + 1); setViewM(1); }
    else setViewM(m => m + 1);
  };

  const doneSet = data
    ? new Set(data.calendarDoneMap[`${viewY}-${viewM}`] ?? [])
    : new Set<number>();

  const calCells = buildCalendarCells(viewY, viewM, doneSet, todayY, todayM, todayD);

  const iconBgStyle = (bg: "cyan" | "green" | "amber") => {
    if (bg === "cyan")  return { background: "#0991B2" };
    if (bg === "green") return { background: "#059669" };
    return { background: "#D97706" };
  };

  return (
    <>
      <style>{`
        /* ── RESET ── */
        .sk-wrap *, .sk-wrap *::before, .sk-wrap *::after { box-sizing: border-box; }
        :root {
          --sc: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06);
          --sc-hover: 0 2px 8px rgba(0,0,0,.1), 0 8px 24px rgba(0,0,0,.08);
        }

        /* ── NAV ── */
        .sk-nav {
          position: sticky; top: 0; z-index: 200;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid #E5E7EB;
          height: 60px; display: flex; align-items: center; padding: 0 32px; gap: 12px;
        }
        .sk-nav-logo {
          font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 900;
          color: #0A0A0A; text-decoration: none; letter-spacing: -.4px; margin-right: auto;
        }
        .sk-nav-logo .hi { color: #0991B2; }
        .sk-nav-back {
          font-size: 13px; font-weight: 600; color: #6B7280;
          text-decoration: none; padding: 6px 12px; border-radius: 8px;
          transition: color .15s, background .15s;
        }
        .sk-nav-back:hover { color: #0A0A0A; background: #F9FAFB; }
        .sk-btn-primary {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          color: #FFFFFF; background: #0A0A0A; border: none; border-radius: 8px;
          padding: 9px 18px; cursor: pointer; transition: opacity .15s, transform .15s;
          text-decoration: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px;
        }
        .sk-btn-primary:hover { opacity: .85; transform: translateY(-1px); }

        /* ── LAYOUT ── */
        .sk-page { background: #FFFFFF; min-height: calc(100vh - 60px); padding: 32px; max-width: 1080px; margin: 0 auto; }

        /* ── ANIMATIONS ── */
        @keyframes skFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes skFlicker {
          0%,100% { opacity:1; transform: scale(1) rotate(-3deg); }
          30% { opacity:.85; transform: scale(1.12) rotate(3deg); }
          60% { opacity:.95; transform: scale(.96) rotate(-1deg); }
        }
        @keyframes skBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        @keyframes skFillBar { from { width: 0; } to { width: var(--target); } }
        @keyframes skPop { 0% { transform: scale(.7); opacity: 0; } 70% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
        .sk-rv { opacity: 0; transform: translateY(14px); transition: opacity .45s ease, transform .45s ease; }
        .sk-rv-in { opacity: 1; transform: translateY(0); }

        /* ── SKELETON ── */
        .sk-skeleton {
          background: linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%);
          background-size: 200% 100%; animation: skShimmer 1.4s infinite; border-radius: 8px;
        }
        @keyframes skShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ── BADGE ── */
        .sk-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 700; color: #0991B2;
          background: #E6F7FA; padding: 3px 10px; border-radius: 100px;
        }

        /* ── HERO ── */
        .sk-hero {
          background: #0A0A0A; border-radius: 16px; padding: 40px 44px;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,.18), 0 16px 48px rgba(0,0,0,.12);
          margin-bottom: 20px; animation: skFadeUp .45s ease both;
        }
        .sk-hero-deco1 {
          position: absolute; width: 300px; height: 300px;
          background: rgba(9,145,178,.12); filter: blur(80px); border-radius: 50%;
          top: -100px; right: -60px; pointer-events: none;
        }
        .sk-hero-deco2 {
          position: absolute; width: 200px; height: 200px;
          background: rgba(6,182,212,.08); filter: blur(60px); border-radius: 50%;
          bottom: -60px; left: -40px; pointer-events: none;
        }
        .sk-hero-inner { position: relative; z-index: 1; display: flex; align-items: center; gap: 40px; }
        .sk-hero-left { flex: 1; }
        .sk-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;
          color: rgba(255,255,255,.45); background: rgba(255,255,255,.08);
          padding: 4px 12px; border-radius: 100px; margin-bottom: 18px;
          font-family: 'Inter', sans-serif;
        }
        .sk-fire-count { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
        .sk-fire-emoji { font-size: 56px; line-height: 1; animation: skFlicker 3s ease-in-out infinite; }
        .sk-streak-num {
          font-family: 'Inter', sans-serif; font-size: 96px; font-weight: 900;
          line-height: .9; letter-spacing: -4px; color: #fff;
        }
        .sk-streak-unit {
          font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 700;
          color: rgba(255,255,255,.45); align-self: flex-end; padding-bottom: 10px;
        }
        .sk-hero-label { font-size: 15px; color: rgba(255,255,255,.55); font-weight: 500; margin-bottom: 20px; font-family: 'Inter', sans-serif; }
        .sk-hero-label strong { color: #fff; font-weight: 700; }
        .sk-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .sk-pill {
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
          color: rgba(255,255,255,.7); font-size: 12px; font-weight: 700;
          padding: 6px 14px; border-radius: 100px; font-family: 'Inter', sans-serif;
        }
        .sk-pill-hot {
          background: rgba(9,145,178,.25); border-color: rgba(9,145,178,.45); color: #67E8F9;
        }
        .sk-hero-right { flex-shrink: 0; display: flex; flex-direction: column; gap: 14px; align-items: flex-end; }
        .sk-flame-orb {
          width: 148px; height: 148px;
          background: rgba(9,145,178,.15); border: 1px solid rgba(9,145,178,.25);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 60px; animation: skBreathe 3s ease-in-out infinite;
          box-shadow: 0 0 48px rgba(9,145,178,.2);
        }
        .sk-hero-mini-stats { display: flex; flex-direction: column; gap: 8px; }
        .sk-hms {
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px; padding: 10px 16px; text-align: right;
        }
        .sk-hms-num { font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 900; color: #fff; line-height: 1; }
        .sk-hms-label { font-size: 10px; color: rgba(255,255,255,.35); margin-top: 2px; font-weight: 600; }

        /* ── STATS ROW ── */
        .sk-stats-row {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
          margin-bottom: 20px; animation: skFadeUp .45s ease .06s both;
        }
        .sk-stat-card {
          background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px;
          padding: 22px; box-shadow: var(--sc);
          text-align: center; transition: box-shadow .2s, transform .2s;
        }
        .sk-stat-card:hover { box-shadow: var(--sc-hover); transform: translateY(-3px); }
        .sk-stat-icon { font-size: 24px; display: block; margin-bottom: 8px; }
        .sk-stat-num {
          font-family: 'Inter', sans-serif; font-size: 36px; font-weight: 900;
          letter-spacing: -1px; color: #0A0A0A; line-height: 1; display: block; margin-bottom: 4px;
        }
        .sk-stat-num-accent { color: #0991B2; }
        .sk-stat-label { font-size: 12px; color: #6B7280; font-weight: 600; font-family: 'Inter', sans-serif; }

        /* ── CONTENT GRID ── */
        .sk-content-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }

        /* ── CARD ── */
        .sk-card {
          background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px;
          padding: 28px; box-shadow: var(--sc); transition: box-shadow .2s, transform .2s;
        }
        .sk-card:hover { box-shadow: var(--sc-hover); }
        .sk-card-eyebrow {
          font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
          color: #0991B2; background: #E6F7FA; padding: 3px 10px; border-radius: 100px;
          display: inline-block; margin-bottom: 10px; font-family: 'Inter', sans-serif;
        }
        .sk-card-title {
          font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 900;
          letter-spacing: -.3px; margin-bottom: 4px; color: #0A0A0A;
        }
        .sk-card-sub { font-size: 13px; color: #6B7280; margin-bottom: 22px; line-height: 1.55; }

        /* ── CALENDAR ── */
        .sk-cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .sk-cal-month { font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 900; color: #0A0A0A; }
        .sk-cal-arrows { display: flex; gap: 6px; }
        .sk-cal-arrow {
          width: 32px; height: 32px; border-radius: 8px;
          background: #FFFFFF; border: 1px solid #E5E7EB;
          cursor: pointer; font-size: 14px; display: flex; align-items: center;
          justify-content: center; color: #0A0A0A; transition: all .15s;
        }
        .sk-cal-arrow:hover { background: #F3F4F6; box-shadow: var(--sc); }
        .sk-cal-dow-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin-bottom: 4px; }
        .sk-cal-dow { font-size: 10px; font-weight: 700; color: #9CA3AF; text-align: center; padding: 4px 0; font-family: 'Inter', sans-serif; }
        .sk-cal-cells { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
        .sk-cal-cell {
          aspect-ratio: 1; border-radius: 8px; display: flex; align-items: center;
          justify-content: center; font-size: 12px; font-weight: 600; color: #6B7280;
          cursor: default; transition: all .2s; user-select: none; position: relative;
          font-family: 'Inter', sans-serif;
        }
        .sk-cal-cell-empty { opacity: 0; pointer-events: none; }
        .sk-cal-cell-normal:hover { background: #E6F7FA; color: #0991B2; }
        .sk-cal-cell-today { background: #E6F7FA; color: #0991B2; font-weight: 800; }
        .sk-cal-cell-done {
          background: #0991B2; color: #fff; font-weight: 700;
          box-shadow: 0 2px 8px rgba(9,145,178,.35); animation: skPop .25s ease;
        }
        .sk-cal-cell-done::after {
          content: '🔥'; position: absolute; font-size: 6px; top: 2px; right: 2px; line-height: 1;
        }
        .sk-cal-cell-today-done {
          box-shadow: 0 0 0 2px #0991B2, 0 2px 8px rgba(9,145,178,.4);
        }
        .sk-cal-legend { display: flex; align-items: center; gap: 14px; margin-top: 16px; flex-wrap: wrap; }
        .sk-leg-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #6B7280; font-weight: 600; font-family: 'Inter', sans-serif; }
        .sk-leg-dot { width: 12px; height: 12px; border-radius: 4px; flex-shrink: 0; }
        .sk-leg-done { background: #0991B2; }
        .sk-leg-today { background: #E6F7FA; border: 1.5px solid #0991B2; }
        .sk-leg-none { background: #E5E7EB; }

        /* ── REWARD HISTORY ── */
        .sk-rh-list { display: flex; flex-direction: column; gap: 8px; }
        .sk-rh-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; background: #FFFFFF; border: 1px solid #E5E7EB;
          border-radius: 10px; box-shadow: var(--sc); transition: all .15s;
        }
        .sk-rh-item:hover { box-shadow: var(--sc-hover); transform: translateY(-1px); }
        .sk-rh-icon {
          width: 40px; height: 40px; border-radius: 10px; display: flex;
          align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
        }
        .sk-rh-body { flex: 1; }
        .sk-rh-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; color: #0A0A0A; font-family: 'Inter', sans-serif; }
        .sk-rh-date { font-size: 11px; color: #6B7280; }
        .sk-rh-badge { font-size: 11px; font-weight: 700; color: #0991B2; background: #E6F7FA; padding: 3px 9px; border-radius: 100px; white-space: nowrap; font-family: 'Inter', sans-serif; }

        /* ── RIGHT COLUMN ── */
        .sk-right-col { display: flex; flex-direction: column; gap: 16px; }

        /* ── NEXT REWARD CARD ── */
        .sk-reward-card {
          background: #0A0A0A; border-radius: 12px; padding: 26px;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,.16), 0 12px 40px rgba(0,0,0,.1);
        }
        .sk-reward-deco {
          position: absolute; width: 200px; height: 200px;
          background: rgba(9,145,178,.12); filter: blur(60px); border-radius: 50%;
          top: -60px; right: -40px; pointer-events: none;
        }
        .sk-reward-inner { position: relative; z-index: 1; }
        .sk-reward-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: rgba(255,255,255,.35); margin-bottom: 14px; font-family: 'Inter', sans-serif; }
        .sk-reward-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px; }
        .sk-reward-days { font-family: 'Inter', sans-serif; font-size: 34px; font-weight: 900; color: #fff; letter-spacing: -1px; line-height: 1; }
        .sk-reward-days span { font-size: 14px; font-weight: 700; color: rgba(255,255,255,.4); margin-left: 3px; }
        .sk-reward-remain { font-size: 12px; font-weight: 700; color: rgba(255,255,255,.45); font-family: 'Inter', sans-serif; }
        .sk-reward-bar-bg { height: 8px; background: rgba(255,255,255,.1); border-radius: 100px; overflow: hidden; margin: 14px 0 8px; }
        .sk-reward-bar-fill { height: 100%; background: #0991B2; border-radius: 100px; transition: width 1s cubic-bezier(.34,1.56,.64,1); }
        .sk-reward-meta { display: flex; align-items: center; justify-content: space-between; }
        .sk-reward-meta-left { font-size: 11px; color: rgba(255,255,255,.35); font-family: 'Inter', sans-serif; }
        .sk-reward-chip {
          display: flex; align-items: center; gap: 5px;
          background: rgba(9,145,178,.25); border: 1px solid rgba(9,145,178,.4);
          border-radius: 100px; padding: 4px 10px; font-size: 12px; font-weight: 700; color: #67E8F9;
          font-family: 'Inter', sans-serif;
        }
        .sk-reward-detail { margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.07); }
        .sk-reward-detail p { font-size: 12px; color: rgba(255,255,255,.35); line-height: 1.65; font-family: 'Inter', sans-serif; }
        .sk-reward-detail strong { color: rgba(255,255,255,.7); }

        /* ── MILESTONES ── */
        .sk-milestone-list { display: flex; flex-direction: column; gap: 8px; }
        .sk-ms-item {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; border-radius: 10px; transition: all .15s;
        }
        .sk-ms-achieved { background: #E6F7FA; }
        .sk-ms-next { background: rgba(9,145,178,.06); border: 1.5px dashed rgba(9,145,178,.3); }
        .sk-ms-locked { opacity: .45; background: #F9FAFB; border: 1px solid #E5E7EB; }
        .sk-ms-badge {
          width: 34px; height: 34px; border-radius: 10px; display: flex;
          align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;
        }
        .sk-ms-badge-done { background: #0991B2; box-shadow: 0 2px 8px rgba(9,145,178,.3); }
        .sk-ms-badge-next { background: rgba(9,145,178,.12); border: 1.5px dashed rgba(9,145,178,.4); }
        .sk-ms-badge-lock { background: #E5E7EB; }
        .sk-ms-body { flex: 1; }
        .sk-ms-title { font-size: 13px; font-weight: 700; color: #0A0A0A; margin-bottom: 2px; font-family: 'Inter', sans-serif; }
        .sk-ms-desc { font-size: 11px; color: #6B7280; line-height: 1.45; }
        .sk-ms-tag { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 100px; flex-shrink: 0; font-family: 'Inter', sans-serif; }
        .sk-ms-tag-done { color: #059669; background: #ECFDF5; }
        .sk-ms-tag-next { color: #0991B2; background: #E6F7FA; }
        .sk-ms-tag-lock { color: #6B7280; background: #F3F4F6; }

        /* ── CTA STRIP ── */
        .sk-cta {
          background: #0A0A0A; border-radius: 12px; padding: 24px 26px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,.14); position: relative; overflow: hidden;
        }
        .sk-cta-deco {
          position: absolute; width: 160px; height: 160px;
          background: rgba(9,145,178,.1); filter: blur(50px); border-radius: 50%;
          top: -50px; right: 80px; pointer-events: none;
        }
        .sk-cta-text { position: relative; z-index: 1; }
        .sk-cta-title { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 900; color: #fff; margin-bottom: 4px; }
        .sk-cta-desc { font-size: 12px; color: rgba(255,255,255,.45); line-height: 1.55; font-family: 'Inter', sans-serif; }
        .sk-btn-cta {
          position: relative; z-index: 1;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          color: #0A0A0A; background: #fff; border: none; border-radius: 8px;
          padding: 11px 20px; cursor: pointer; white-space: nowrap;
          text-decoration: none; transition: all .15s; display: inline-block;
        }
        .sk-btn-cta:hover { background: #F3F4F6; transform: translateY(-2px); }

        /* ── RESPONSIVE ── */
        @media (max-width: 960px) {
          .sk-content-grid { grid-template-columns: 1fr; }
          .sk-hero-right { display: none; }
          .sk-hero { padding: 28px 28px; }
          .sk-streak-num { font-size: 72px; }
          .sk-fire-emoji { font-size: 44px; }
        }
        @media (max-width: 640px) {
          .sk-nav { padding: 0 16px; }
          .sk-page { padding: 20px 16px; }
          .sk-stats-row { gap: 10px; }
          .sk-stat-card { padding: 16px 10px; }
          .sk-stat-num { font-size: 28px; }
          .sk-hero { border-radius: 12px; padding: 22px 20px; }
          .sk-streak-num { font-size: 60px; }
          .sk-cta { flex-direction: column; align-items: flex-start; }
          .sk-btn-cta { width: 100%; text-align: center; }
        }
      `}</style>

      <div className="sk-wrap">
        {/* NAV */}
        <nav className="sk-nav">
          <Link to="/home" className="sk-nav-logo">me<span className="hi">Fit</span></Link>
          <Link to="/home" className="sk-nav-back">← 홈으로</Link>
          <Link to="/interview/setup" className="sk-btn-primary">면접 시작 →</Link>
        </nav>

        <div className="sk-page">
          {loading && !data ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="sk-skeleton" style={{ height: 180 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {[0, 1, 2].map((i) => <div key={i} className="sk-skeleton" style={{ height: 110 }} />)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
                <div className="sk-skeleton" style={{ height: 360 }} />
                <div className="sk-skeleton" style={{ height: 360 }} />
              </div>
            </div>
          ) : data ? (
            <>
              {/* ─── HERO ─── */}
              <div className="sk-hero">
                <div className="sk-hero-deco1" />
                <div className="sk-hero-deco2" />
                <div className="sk-hero-inner">
                  <div className="sk-hero-left">
                    <div className="sk-hero-eyebrow">🔥 스트릭 현황</div>
                    <div className="sk-fire-count">
                      <span className="sk-fire-emoji">🔥</span>
                      <span className="sk-streak-num">{data.currentStreak}</span>
                      <span className="sk-streak-unit">일</span>
                    </div>
                    <p className="sk-hero-label">
                      연속 면접 참여 중 ·{" "}
                      <strong>{data.todayCompleted ? "오늘도 참여했어요!" : "오늘 아직 참여 전이에요"}</strong>
                    </p>
                    <div className="sk-pills">
                      <span className="sk-pill sk-pill-hot">🏆 역대 최장 {data.bestStreak}일</span>
                      <span className="sk-pill">총 {data.totalDays}일 참여</span>
                      <span className="sk-pill">보상 {data.rewardsCount}회 수령</span>
                    </div>
                  </div>
                  <div className="sk-hero-right">
                    <div className="sk-flame-orb">🔥</div>
                    <div className="sk-hero-mini-stats">
                      <div className="sk-hms">
                        <div className="sk-hms-num">{data.bestStreak}일</div>
                        <div className="sk-hms-label">최장 기록</div>
                      </div>
                      <div className="sk-hms">
                        <div className="sk-hms-num">{data.totalDays}일</div>
                        <div className="sk-hms-label">총 참여일</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── STATS ROW ─── */}
              <div className="sk-stats-row">
                {[
                  { icon: "🏆", value: data.bestStreak, label: "최장 연속 기록", accent: true },
                  { icon: "📅", value: data.totalDays,  label: "총 참여일",       accent: false },
                  { icon: "🎁", value: data.rewardsCount, label: "보상 수령 횟수", accent: false },
                ].map((s, i) => (
                  <div
                    key={i}
                    className={`sk-stat-card sk-rv${revealed ? " sk-rv-in" : ""}`}
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <span className="sk-stat-icon">{s.icon}</span>
                    <span className={`sk-stat-num${s.accent ? " sk-stat-num-accent" : ""}`}>{s.value}</span>
                    <span className="sk-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* ─── CONTENT GRID ─── */}
              <div className="sk-content-grid">
                {/* LEFT */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* CALENDAR */}
                  <div className={`sk-card sk-rv${revealed ? " sk-rv-in" : ""}`} style={{ transitionDelay: "80ms" }}>
                    <span className="sk-card-eyebrow">참여 달력</span>
                    <h2 className="sk-card-title">면접 참여 기록</h2>
                    <p className="sk-card-sub">🔥 표시된 날은 면접에 참여한 날입니다</p>

                    <div className="sk-cal-nav">
                      <span className="sk-cal-month">{viewY}년 {MONTH_KO[viewM - 1]}</span>
                      <div className="sk-cal-arrows">
                        <button className="sk-cal-arrow" onClick={prevMonth} aria-label="이전 달">‹</button>
                        <button className="sk-cal-arrow" onClick={nextMonth} aria-label="다음 달">›</button>
                      </div>
                    </div>

                    <div className="sk-cal-dow-row">
                      {["일","월","화","수","목","금","토"].map((d) => (
                        <div key={d} className="sk-cal-dow">{d}</div>
                      ))}
                    </div>

                    <div className="sk-cal-cells">
                      {calCells.map((cell, i) => {
                        if (!cell.day) return <div key={i} className="sk-cal-cell sk-cal-cell-empty" />;
                        let cls = "sk-cal-cell";
                        if (cell.done && cell.today) cls += " sk-cal-cell-done sk-cal-cell-today-done";
                        else if (cell.done) cls += " sk-cal-cell-done";
                        else if (cell.today) cls += " sk-cal-cell-today";
                        else cls += " sk-cal-cell-normal";
                        return (
                          <div
                            key={i}
                            className={cls}
                            title={cell.done ? `${viewM}월 ${cell.day}일 — 면접 참여 ✓` : undefined}
                          >
                            {cell.day}
                          </div>
                        );
                      })}
                    </div>

                    <div className="sk-cal-legend">
                      <div className="sk-leg-item"><div className="sk-leg-dot sk-leg-done" />면접 참여일</div>
                      <div className="sk-leg-item"><div className="sk-leg-dot sk-leg-today" />오늘</div>
                      <div className="sk-leg-item"><div className="sk-leg-dot sk-leg-none" />미참여</div>
                    </div>
                  </div>

                  {/* REWARD HISTORY */}
                  <div className={`sk-card sk-rv${revealed ? " sk-rv-in" : ""}`} style={{ transitionDelay: "130ms" }}>
                    <span className="sk-card-eyebrow">보상 내역</span>
                    <h2 className="sk-card-title">스트릭 보상 수령 이력</h2>
                    <p className="sk-card-sub">마일스톤 달성 시 Pro 기능 사용권이 자동 지급됩니다</p>
                    <div className="sk-rh-list">
                      {data.rewardHistory.map((rh) => (
                        <div key={rh.id} className="sk-rh-item">
                          <div className="sk-rh-icon" style={iconBgStyle(rh.iconBg)}>{rh.icon}</div>
                          <div className="sk-rh-body">
                            <div className="sk-rh-title">{rh.title}</div>
                            <div className="sk-rh-date">{rh.description} · {rh.date}</div>
                          </div>
                          <span className="sk-rh-badge">수령 완료</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="sk-right-col">

                  {/* NEXT REWARD */}
                  <div className={`sk-reward-card sk-rv${revealed ? " sk-rv-in" : ""}`} style={{ transitionDelay: "100ms" }}>
                    <div className="sk-reward-deco" />
                    <div className="sk-reward-inner">
                      <div className="sk-reward-eyebrow">다음 보상까지</div>
                      <div className="sk-reward-row">
                        <div className="sk-reward-days">
                          {data.nextReward.targetDays}<span>일 달성 목표</span>
                        </div>
                        <div className="sk-reward-remain">{data.nextReward.daysRemaining}일 남음</div>
                      </div>
                      <div className="sk-reward-bar-bg">
                        <div
                          className="sk-reward-bar-fill"
                          style={{ width: `${data.nextReward.progress}%` }}
                        />
                      </div>
                      <div className="sk-reward-meta">
                        <span className="sk-reward-meta-left">
                          {data.currentStreak} / {data.nextReward.targetDays}일 완료
                        </span>
                        <div className="sk-reward-chip">🎁 {data.nextReward.reward}</div>
                      </div>
                      <div className="sk-reward-detail">
                        <p>{data.nextReward.rewardDetail}</p>
                      </div>
                    </div>
                  </div>

                  {/* MILESTONES */}
                  <div className={`sk-card sk-rv${revealed ? " sk-rv-in" : ""}`} style={{ transitionDelay: "150ms" }}>
                    <span className="sk-card-eyebrow">마일스톤</span>
                    <h3 className="sk-card-title" style={{ fontSize: 16 }}>보상 달성 로드맵</h3>
                    <p className="sk-card-sub">스트릭 목표를 달성하면 Pro 기능을 무료로 이용하세요</p>
                    <div className="sk-milestone-list">
                      {data.milestones.map((ms) => {
                        const itemCls =
                          ms.status === "achieved" ? "sk-ms-item sk-ms-achieved"
                          : ms.status === "next"     ? "sk-ms-item sk-ms-next"
                          :                            "sk-ms-item sk-ms-locked";
                        const badgeCls =
                          ms.status === "achieved" ? "sk-ms-badge sk-ms-badge-done"
                          : ms.status === "next"     ? "sk-ms-badge sk-ms-badge-next"
                          :                            "sk-ms-badge sk-ms-badge-lock";
                        const tagCls =
                          ms.status === "achieved" ? "sk-ms-tag sk-ms-tag-done"
                          : ms.status === "next"     ? "sk-ms-tag sk-ms-tag-next"
                          :                            "sk-ms-tag sk-ms-tag-lock";
                        const tagText =
                          ms.status === "achieved" ? "완료"
                          : ms.status === "next"     ? `D-${ms.daysRemaining}`
                          :                            `${ms.daysRemaining}일 남음`;
                        return (
                          <div key={ms.days} className={itemCls}>
                            <div className={badgeCls}>
                              {ms.status === "achieved" ? "✓" : ms.rewardIcon}
                            </div>
                            <div className="sk-ms-body">
                              <div className="sk-ms-title">{ms.days}일 달성</div>
                              <div className="sk-ms-desc">{ms.reward}</div>
                            </div>
                            <span className={tagCls}>{tagText}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className={`sk-cta sk-rv${revealed ? " sk-rv-in" : ""}`} style={{ transitionDelay: "200ms" }}>
                    <div className="sk-cta-deco" />
                    <div className="sk-cta-text">
                      <div className="sk-cta-title">오늘의 면접 시작하기</div>
                      <div className="sk-cta-desc">
                        {data.nextReward.daysRemaining}일만 더 하면 보상이 기다려요.<br />
                        지금 바로 이어가세요 🔥
                      </div>
                    </div>
                    <Link to="/interview/setup" className="sk-btn-cta">면접 시작 →</Link>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
