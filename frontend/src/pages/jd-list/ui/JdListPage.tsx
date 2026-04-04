import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useJdListStore, type JdListItem } from "@/features/jd";
import { useSessionStore } from "@/entities/session";

type FilterKey = "all" | "planned" | "applied" | "saved";

/* ── Status config ── */
const STATUS_CONFIG = {
  analyzing: { label: "분석 중",  dotCls: "jdl-dot--analyzing", badgeCls: "jdl-badge--analyzing" },
  planned:   { label: "지원 예정", dotCls: "jdl-dot--planned",   badgeCls: "jdl-badge--planned"   },
  applied:   { label: "지원 완료", dotCls: "jdl-dot--applied",   badgeCls: "jdl-badge--applied"   },
  saved:     { label: "관심 저장", dotCls: "jdl-dot--saved",     badgeCls: "jdl-badge--saved"     },
} as const;

const TAG_COLOR_CLS: Record<string, string> = {
  default: "jdl-tag",
  green:   "jdl-tag jdl-tag--green",
  blue:    "jdl-tag jdl-tag--blue",
  pink:    "jdl-tag jdl-tag--pink",
};

/* ── More-menu dropdown ── */
function MoreMenu({ id, onClose }: { id: string; onClose: () => void }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="jdl-more-menu" ref={ref}>
      <button className="jdl-more-item" onClick={() => { navigate(`/jd/detail/${id}`); onClose(); }}>
        📄 상세 보기
      </button>
      <button className="jdl-more-item" onClick={() => { navigate(`/jd/edit/${id}`); onClose(); }}>
        ✏️ 수정
      </button>
    </div>
  );
}

/* ── JD Card ── */
function JdCard({ item }: { item: JdListItem }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = STATUS_CONFIG[item.status];
  const isAnalyzing = item.status === "analyzing";

  return (
    <div
      className="jdl-card"
      onClick={() => { if (!isAnalyzing) navigate(`/jd/detail/${item.id}`); }}
      role={isAnalyzing ? undefined : "button"}
      tabIndex={isAnalyzing ? undefined : 0}
      onKeyDown={(e) => { if (!isAnalyzing && e.key === "Enter") navigate(`/jd/detail/${item.id}`); }}
      aria-label={isAnalyzing ? undefined : `${item.company} ${item.title} 상세 보기`}
    >
      {/* Analyzing overlay */}
      {isAnalyzing && (
        <div className="jdl-analyzing-overlay" aria-label="AI 분석 중">
          <div className="jdl-analyzing-spinner" />
          <div className="jdl-analyzing-txt">AI 분석 중...</div>
          <div className="jdl-analyzing-sub">공고를 읽고 있어요</div>
          <div className="jdl-analyzing-progress">
            <div className="jdl-analyzing-bar" />
          </div>
        </div>
      )}

      {/* Status row */}
      <div className="jdl-status-row">
        <span className={`jdl-badge ${cfg.badgeCls}`}>
          <span className={`jdl-dot ${cfg.dotCls}`} />
          {cfg.label}
        </span>
        <div className="jdl-more-wrap">
          <button
            className="jdl-more-btn"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            aria-label="더보기"
            aria-expanded={menuOpen}
          >
            ⋯
          </button>
          {menuOpen && <MoreMenu id={item.id} onClose={() => setMenuOpen(false)} />}
        </div>
      </div>

      {/* Company */}
      <div className="jdl-co-row">
        <div className="jdl-co-logo" style={{ background: item.companyColor }}>
          {item.companyInitial}
        </div>
        <div className="jdl-co-name">{item.company}</div>
      </div>

      {/* Title */}
      <div className="jdl-title">{item.title}</div>

      {/* Tags */}
      <div className="jdl-tags">
        {item.tags.map((tag, i) => (
          <span key={i} className={TAG_COLOR_CLS[tag.color] ?? "jdl-tag"}>
            {tag.label}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="jdl-footer">
        <span className="jdl-date">{item.registeredAt}</span>
        {isAnalyzing ? (
          <span className="jdl-action-btn jdl-action-btn--disabled">잠시 후 가능</span>
        ) : (
          <button
            className="jdl-action-btn"
            onClick={(e) => { e.stopPropagation(); navigate("/interview"); }}
          >
            면접 시작
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export function JdListPage() {
  const {
    stats, filtered, searchQuery, activeFilter,
    isLoading,
    fetchList, setSearch, setFilter,
  } = useJdListStore();
  
  const { user } = useSessionStore();

  useEffect(() => { 
    fetchList(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const FILTER_PILLS: { key: FilterKey; label: string; count: number }[] = [
    { key: "all",     label: "전체",     count: stats.total },
    { key: "planned", label: "지원 예정", count: stats.planned },
    { key: "applied", label: "지원 완료", count: stats.applied },
    { key: "saved",   label: "관심 저장", count: stats.saved },
  ];

  return (
    <div className="jdl-page">
      {/* NAV */}
      <nav className="jdl-nav">
        <div className="jdl-nav-pill">
          <Link to="/home" className="jdl-logo">
            me<span style={{ color: "#0991B2" }}>Fit</span>
          </Link>
          <ul className="jdl-nav-links">
            <li><Link to="/home" className="jdl-nav-link">홈</Link></li>
            <li><Link to="/jd" className="jdl-nav-link jdl-nav-link--active">채용공고</Link></li>
            <li><Link to="/interview" className="jdl-nav-link">면접 시작</Link></li>
            <li><Link to="/resume" className="jdl-nav-link">이력서</Link></li>
          </ul>
          <div className="jdl-nav-avatar">{user?.initial || "U"}</div>
        </div>
      </nav>

      <div className="jdl-wrap">

        {/* PAGE HEADER */}
        <div className="jdl-page-hd">
          <div>
            <div className="jdl-eyebrow">📋 채용공고</div>
            <h1 className="jdl-page-title">내 채용공고</h1>
            <p className="jdl-page-sub">지원할 채용공고를 등록하고 AI 면접 준비를 시작하세요</p>
          </div>
          <Link to="/jd/add" className="jdl-btn-primary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            채용공고 추가
          </Link>
        </div>

        {/* STATS */}
        <div className="jdl-stats-row">
          {[
            { icon: "📋", val: stats.total,   lbl: "전체 공고"  },
            { icon: "🔵", val: stats.planned, lbl: "지원 예정"  },
            { icon: "✅", val: stats.applied, lbl: "지원 완료"  },
            { icon: "⭐", val: stats.saved,   lbl: "관심 저장"  },
          ].map((s, i) => (
            <div key={i} className="jdl-stat-card" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="jdl-stat-icon">{s.icon}</div>
              <div className="jdl-stat-val">{s.val}</div>
              <div className="jdl-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* FILTER */}
        <div className="jdl-filter-row">
          <div className="jdl-search-wrap">
            <span className="jdl-search-icon">🔍</span>
            <input
              type="text"
              className="jdl-search-input"
              placeholder="회사명 또는 포지션 검색..."
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="채용공고 검색"
            />
          </div>
          {FILTER_PILLS.map((p) => (
            <button
              key={p.key}
              className={`jdl-filter-pill${activeFilter === p.key ? " jdl-filter-pill--active" : ""}`}
              onClick={() => setFilter(p.key)}
              aria-pressed={activeFilter === p.key}
            >
              {p.label} {p.count}
            </button>
          ))}
        </div>

        {/* GRID */}
        {isLoading ? (
          <div className="jdl-empty">목록을 불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="jdl-empty">
            <div className="jdl-empty-icon">📭</div>
            <div className="jdl-empty-title">
              {searchQuery ? "검색 결과가 없어요" : "아직 등록된 채용공고가 없어요"}
            </div>
            <div className="jdl-empty-sub">
              {searchQuery ? "다른 검색어를 입력해 보세요" : "채용공고를 추가해 AI 면접을 시작해 보세요"}
            </div>
            {!searchQuery && (
              <Link to="/jd/add" className="jdl-btn-primary" style={{ marginTop: 20 }}>
                채용공고 추가하기
              </Link>
            )}
          </div>
        ) : (
          <div className="jdl-grid">
            {filtered.map((item) => (
              <JdCard key={item.id} item={item} />
            ))}
          </div>
        )}

      </div>

      <style>{`
        @keyframes jdl-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes jdl-spin { to { transform: rotate(360deg); } }
        @keyframes jdl-dotPulse {
          0%,100% { transform: scale(1); opacity: .8; }
          50%      { transform: scale(1.4); opacity: 1; }
        }
        @keyframes jdl-analyzeBar {
          from { width: 20%; }
          to   { width: 85%; }
        }

        .jdl-page {
          min-height: 100vh;
          background: #FFFFFF;
          font-family: 'Inter', sans-serif;
          color: #0A0A0A;
        }

        /* NAV */
        .jdl-nav {
          position: fixed; top: 0; left: 0; right: 0;
          z-index: 200; padding: 14px 32px;
          display: flex; justify-content: center;
        }
        .jdl-nav-pill {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; max-width: 1140px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid #E5E7EB; border-radius: 8px;
          padding: 8px 8px 8px 24px; box-shadow: var(--sc);
        }
        .jdl-logo {
          font-family: 'Inter', sans-serif; font-size: 19px;
          font-weight: 900; letter-spacing: -.3px; color: #0A0A0A; text-decoration: none;
        }
        .jdl-nav-links { display: flex; gap: 4px; list-style: none; }
        .jdl-nav-link {
          font-size: 13px; font-weight: 500; color: #6B7280;
          text-decoration: none; padding: 8px 14px; border-radius: 8px; transition: all .2s;
        }
        .jdl-nav-link:hover { color: #0A0A0A; background: rgba(9,145,178,0.06); }
        .jdl-nav-link--active { color: #0991B2; background: #E6F7FA; font-weight: 700; }
        .jdl-nav-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg,#06B6D4,#0891B2);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff;
          box-shadow: var(--sb); cursor: pointer; transition: all .2s;
        }
        .jdl-nav-avatar:hover { transform: translateY(-2px); box-shadow: var(--sbh); }

        /* WRAP */
        .jdl-wrap { max-width: 1140px; margin: 0 auto; padding: 100px 32px 60px; }

        /* PAGE HEADER */
        .jdl-page-hd {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 32px; gap: 16px;
        }
        .jdl-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase;
          color: #0991B2; background: #E6F7FA; padding: 4px 12px; border-radius: 100px;
          margin-bottom: 10px;
        }
        .jdl-page-title {
          font-family: 'Inter', sans-serif; font-size: clamp(24px,3vw,36px);
          font-weight: 900; letter-spacing: -.8px; color: #0A0A0A; line-height: 1.1;
        }
        .jdl-page-sub { font-size: 14px; color: #6B7280; margin-top: 6px; }

        /* BUTTONS */
        .jdl-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          color: #fff; background: #0A0A0A; border: none; cursor: pointer;
          padding: 14px 24px; border-radius: 8px;
          box-shadow: var(--sb); transition: opacity .2s;
          text-decoration: none; white-space: nowrap;
        }
        .jdl-btn-primary:hover { opacity: .85; }

        /* STATS */
        .jdl-stats-row {
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 14px; margin-bottom: 28px;
        }
        .jdl-stat-card {
          padding: 22px 24px;
          background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 8px; box-shadow: var(--sc);
          animation: jdl-fadeUp .5s ease both;
          transition: box-shadow .25s;
        }
        .jdl-stat-card:hover { box-shadow: var(--sch); }
        .jdl-stat-icon {
          width: 40px; height: 40px; border-radius: 8px;
          background: #FFFFFF; border: 1px solid #E5E7EB;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; margin-bottom: 14px;
        }
        .jdl-stat-val {
          font-family: 'Inter', sans-serif; font-size: 32px;
          font-weight: 900; letter-spacing: -1px; color: #0991B2; line-height: 1;
        }
        .jdl-stat-lbl { font-size: 12px; color: #6B7280; font-weight: 600; margin-top: 4px; }

        /* FILTER */
        .jdl-filter-row {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 24px; flex-wrap: wrap;
        }
        .jdl-search-wrap { flex: 1; min-width: 220px; position: relative; }
        .jdl-search-input {
          width: 100%; background: #F9FAFB;
          border: 1px solid #E5E7EB; border-radius: 8px;
          padding: 12px 16px 12px 44px;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
          color: #0A0A0A; box-shadow: var(--sw); outline: none; transition: border-color .2s;
        }
        .jdl-search-input:focus { border-color: #0991B2; box-shadow: var(--sc); }
        .jdl-search-input::placeholder { color: #9CA3AF; }
        .jdl-search-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%); font-size: 16px; pointer-events: none;
        }
        .jdl-filter-pill {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700;
          padding: 8px 16px; border-radius: 100px; cursor: pointer; border: 1px solid #E5E7EB;
          background: #F9FAFB; color: #6B7280;
          transition: all .2s; white-space: nowrap;
        }
        .jdl-filter-pill:hover { border-color: #0991B2; color: #0991B2; }
        .jdl-filter-pill--active {
          background: #0A0A0A; color: #fff;
          border-color: #0A0A0A; box-shadow: var(--sb);
        }
        .jdl-filter-pill--active:hover { opacity: .85; color: #fff; }

        /* GRID */
        .jdl-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 18px;
        }

        /* JD CARD */
        .jdl-card {
          padding: 28px; position: relative;
          background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 8px; box-shadow: var(--sc);
          animation: jdl-fadeUp .5s ease both;
          cursor: pointer;
          transition: transform .3s ease, box-shadow .3s ease;
          outline: none;
        }
        .jdl-card:hover { transform: translateY(-4px); box-shadow: var(--sch); }
        .jdl-card:focus-visible { outline: 2px solid #0991B2; outline-offset: 2px; }

        /* ANALYZING OVERLAY */
        .jdl-analyzing-overlay {
          position: absolute; inset: 0; border-radius: 8px;
          background: rgba(249,250,251,0.9);
          backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 10px; z-index: 2;
        }
        .jdl-analyzing-spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(9,145,178,0.15);
          border-top-color: #0991B2;
          border-radius: 50%; animation: jdl-spin .9s linear infinite;
        }
        .jdl-analyzing-txt {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; color: #0991B2;
        }
        .jdl-analyzing-sub { font-size: 11px; color: #6B7280; font-weight: 600; }
        .jdl-analyzing-progress {
          width: 120px; height: 4px; background: #E5E7EB;
          border-radius: 100px; overflow: hidden;
        }
        .jdl-analyzing-bar {
          height: 100%;
          background: linear-gradient(90deg,#06B6D4,#0991B2);
          border-radius: 100px;
          animation: jdl-analyzeBar 2s ease-in-out infinite alternate;
        }

        /* STATUS ROW */
        .jdl-status-row {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
        }
        .jdl-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; padding: 4px 12px;
          border-radius: 100px; letter-spacing: .3px;
        }
        .jdl-badge--analyzing { background: #E6F7FA; color: #0991B2; }
        .jdl-badge--planned   { background: rgba(14,165,233,.1); color: #0369A1; }
        .jdl-badge--applied   { background: rgba(16,185,129,.1); color: #047857; }
        .jdl-badge--saved     { background: rgba(245,158,11,.1); color: #B45309; }
        .jdl-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }
        .jdl-dot--analyzing { background: #0991B2; animation: jdl-dotPulse 1.2s ease-in-out infinite; }
        .jdl-dot--planned   { background: #0EA5E9; }
        .jdl-dot--applied   { background: #10B981; }
        .jdl-dot--saved     { background: #F59E0B; }

        /* MORE BUTTON */
        .jdl-more-wrap { position: relative; }
        .jdl-more-btn {
          width: 28px; height: 28px; border-radius: 8px; border: none;
          background: #F3F4F6; color: #6B7280; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; transition: all .2s; flex-shrink: 0;
        }
        .jdl-more-btn:hover { background: #E6F7FA; color: #0991B2; }
        .jdl-more-menu {
          position: absolute; top: calc(100% + 6px); right: 0;
          background: #FFFFFF; border: 1px solid #E5E7EB;
          border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          min-width: 140px; overflow: hidden; z-index: 50;
          animation: jdl-fadeUp .15s ease;
        }
        .jdl-more-item {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 10px 14px; border: none;
          background: none; font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 600; color: #374151;
          cursor: pointer; text-align: left; transition: background .15s;
        }
        .jdl-more-item:hover { background: #F9FAFB; color: #0991B2; }

        /* COMPANY ROW */
        .jdl-co-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .jdl-co-logo {
          width: 38px; height: 38px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 900; color: #fff; flex-shrink: 0;
          box-shadow: 0 3px 8px rgba(0,0,0,0.1);
        }
        .jdl-co-name { font-size: 13px; color: #6B7280; font-weight: 600; }
        .jdl-title {
          font-family: 'Inter', sans-serif; font-size: 17px;
          font-weight: 800; line-height: 1.3; margin-bottom: 10px;
          letter-spacing: -.2px; color: #0A0A0A;
        }

        /* TAGS */
        .jdl-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
        .jdl-tag {
          font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 100px;
          background: #E6F7FA; color: #0991B2;
        }
        .jdl-tag--green { background: rgba(16,185,129,.1); color: #047857; }
        .jdl-tag--blue  { background: rgba(14,165,233,.1); color: #0369A1; }
        .jdl-tag--pink  { background: rgba(219,39,119,.08); color: #9D174D; }

        /* FOOTER */
        .jdl-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 14px; border-top: 1px solid #F3F4F6;
        }
        .jdl-date { font-size: 12px; color: #9CA3AF; }
        .jdl-action-btn {
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700;
          color: #0991B2; background: #E6F7FA;
          border: none; border-radius: 8px; padding: 7px 14px;
          cursor: pointer; transition: all .2s;
        }
        .jdl-action-btn:hover { background: #cceef6; transform: translateY(-1px); }
        .jdl-action-btn--disabled {
          opacity: .4; cursor: default; pointer-events: none;
        }

        /* EMPTY */
        .jdl-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 80px 20px;
          text-align: center;
        }
        .jdl-empty-icon { font-size: 40px; margin-bottom: 16px; }
        .jdl-empty-title { font-size: 18px; font-weight: 700; color: #0A0A0A; margin-bottom: 8px; }
        .jdl-empty-sub { font-size: 14px; color: #6B7280; }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .jdl-stats-row { grid-template-columns: repeat(2,1fr); }
          .jdl-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .jdl-wrap { padding: 80px 16px 40px; }
          .jdl-nav { padding: 12px 16px; }
          .jdl-filter-row { flex-direction: column; align-items: stretch; }
          .jdl-search-wrap { min-width: unset; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
