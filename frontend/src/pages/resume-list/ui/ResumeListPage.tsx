import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useResumeListStore } from "@/features/resume-list";
import type { ResumeItem } from "@/features/resume-list";

/* ─────────────────────────── sub-components ─────────────────────────── */

function StatusBadge({ status }: { status: ResumeItem["status"] }) {
  if (status === "active")
    return (
      <span className="rl-badge rl-badge--active">
        <span className="rl-st-dot rl-st-dot--on" />
        활성화
      </span>
    );
  if (status === "parsing")
    return (
      <span className="rl-badge rl-badge--parsing">
        <span className="rl-st-dot rl-st-dot--loading" />
        분석 중
      </span>
    );
  return (
    <span className="rl-badge rl-badge--inactive">
      <span className="rl-st-dot rl-st-dot--off" />
      비활성
    </span>
  );
}

function ResumeCard({
  item,
  delay,
  onMenu,
  onUse,
  onEdit,
}: {
  item: ResumeItem;
  delay: number;
  onMenu: (e: React.MouseEvent, id: string) => void;
  onUse: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const isParsing = item.status === "parsing";
  return (
    <div
      className="rl-card"
      style={{ animationDelay: `${delay}s` }}
      onClick={(e) => !isParsing && onMenu(e, item.id)}
    >
      <div className="rl-card-top">
        <div className={`rl-card-icon ${item.type === "file" ? "rl-ic-file" : "rl-ic-text"}`}>
          {item.type === "file" ? "📄" : "✏️"}
        </div>
        <div className="rl-card-badges">
          <StatusBadge status={item.status} />
          <button
            className="rl-menu-btn"
            onClick={(e) => { e.stopPropagation(); onMenu(e, item.id); }}
            aria-label="더보기"
          >
            ⋯
          </button>
        </div>
      </div>

      <div className="rl-card-title">{item.title}</div>
      <div className="rl-card-type">
        {item.type === "file" ? `📎 파일 업로드 · ${item.fileExt}` : "✏️ 직접 입력"}
      </div>

      <div className="rl-card-skills">
        {item.skills.map((s) => (
          <span key={s} className="rl-skill">{s}</span>
        ))}
        {item.extraSkillCount > 0 && (
          <span className="rl-skill-more">+{item.extraSkillCount}</span>
        )}
      </div>

      <div className="rl-card-meta">
        <span>{item.meta}</span>
        <span className="rl-meta-div" />
        <span>{item.status === "parsing" ? "AI 분석 중…" : "🤖 AI 분석 완료"}</span>
      </div>

      <div className="rl-card-footer">
        <div className="rl-card-actions">
          <button
            className="rl-btn-use"
            disabled={isParsing}
            onClick={(e) => { e.stopPropagation(); onUse(item.id); }}
          >
            이걸로 면접
          </button>
          {!isParsing && (
            <button
              className="rl-btn-edit"
              onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
            >
              수정
            </button>
          )}
        </div>
        <span className="rl-card-date">{item.date}</span>
      </div>

      {isParsing && (
        <div className="rl-parsing-overlay">
          <div className="rl-parsing-spin" />
          <span className="rl-parsing-txt">AI가 분석하는 중</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── main page ─────────────────────────── */

export function ResumeListPage() {
  const navigate = useNavigate();
  const ctxRef = useRef<HTMLDivElement>(null);

  const {
    resumes, summary, loading, ctxMenu,
    fetchResumes, toggleActive, deleteResume, openCtx, closeCtx,
  } = useResumeListStore();

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  /* close ctx on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) closeCtx();
    };
    if (ctxMenu.open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ctxMenu.open, closeCtx]);

  const handleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openCtx(id, rect.right - 220, rect.bottom + 8);
  };

  const activeResume = resumes.find((r) => r.id === ctxMenu.resumeId);

  return (
    <div className="rl-root">

      {/* ── NAV ── */}
      <nav className="rl-nav">
        <div className="rl-nav-inner">
          <div className="rl-nav-left">
            <button className="rl-nav-back" onClick={() => navigate("/home")} aria-label="홈으로">←</button>
            <a href="/home" className="rl-logo">me<span>Fit</span></a>
          </div>
          <span className="rl-nav-title">내 이력서</span>
          <button className="rl-nav-add" onClick={() => navigate("/resume/upload")} aria-label="이력서 추가">＋</button>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="rl-wrap">

        {/* Page header */}
        <div className="rl-page-hd">
          <div className="rl-ph-left">
            <div className="rl-eyebrow">📄 이력서 관리</div>
            <h1 className="rl-h1">내 이력서<br /><span className="rl-h1-accent">라이브러리</span></h1>
            <p className="rl-h1-sub">이력서를 등록하면 맞춤 면접 질문이 자동으로 생성돼요</p>
          </div>
          <div className="rl-ph-right">
            <button className="rl-btn-add" onClick={() => navigate("/resume/upload")}>＋ 이력서 추가</button>
          </div>
        </div>

        {/* Summary strip */}
        {summary && (
          <div className="rl-strip">
            <div className="rl-ss-stat">
              <span className="rl-ss-num">{summary.total}</span>
              <span className="rl-ss-lbl">전체 이력서</span>
            </div>
            <div className="rl-ss-div" />
            <div className="rl-ss-stat">
              <span className="rl-ss-num">{summary.active}</span>
              <span className="rl-ss-lbl">활성화</span>
            </div>
            <div className="rl-ss-div" />
            <div className="rl-ss-stat">
              <span className="rl-ss-num">{summary.parsing}</span>
              <span className="rl-ss-lbl">분석 중</span>
            </div>
            <div className="rl-ss-pills">
              <span className="rl-ss-pill"><span className="rl-ss-dot rl-ss-dot--on" />활성 {summary.active}개</span>
              <span className="rl-ss-pill"><span className="rl-ss-dot rl-ss-dot--off" />비활성 {summary.inactive}개</span>
              <span className="rl-ss-pill">📎 파일 {summary.fileCount} · ✏️ 텍스트 {summary.textCount}</span>
            </div>
          </div>
        )}

        {/* Content layout */}
        <div className="rl-content-layout">
          <div>
            {/* Section header */}
            <div className="rl-sec-hd">
              <span className="rl-sec-title">전체 이력서 {resumes.length}개</span>
            </div>

            {/* Resume grid */}
            {loading ? (
              <div className="rl-loading">
                <div className="rl-loading-spin" />
                <span>이력서를 불러오는 중...</span>
              </div>
            ) : (
              <div className="rl-grid">
                {resumes.map((item, i) => (
                  <ResumeCard
                    key={item.id}
                    item={item}
                    delay={0.06 + i * 0.06}
                    onMenu={handleMenu}
                    onUse={(id) => { void id; navigate("/interview/setup"); }}
                    onEdit={(id) => { void id; navigate("/resume/input"); }}
                  />
                ))}

                {/* Ghost add card */}
                <div className="rl-ghost" onClick={() => navigate("/resume/upload")} style={{ animationDelay: `${0.06 + resumes.length * 0.06}s` }}>
                  <span className="rl-ghost-icon">➕</span>
                  <span className="rl-ghost-title">이력서 추가하기</span>
                  <span className="rl-ghost-sub">파일 업로드 또는 직접 입력</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop sidebar (1280px+) */}
          {summary && (
            <div className="rl-sidebar">
              <div className="rl-sp-title">📊 현황 요약</div>
              <div className="rl-sp-stats">
                {[
                  { label: "전체 이력서", val: `${summary.total}개` },
                  { label: "활성화", val: `${summary.active}개` },
                  { label: "면접 진행 횟수", val: `${summary.interviewCount}회` },
                  { label: "평균 점수", val: `${summary.avgScore}점` },
                ].map((s) => (
                  <div key={s.label} className="rl-sp-stat">
                    <span className="rl-sp-stat-lbl">{s.label}</span>
                    <span className="rl-sp-stat-val">{s.val}</span>
                  </div>
                ))}
              </div>
              <button className="rl-sp-cta" onClick={() => navigate("/resume/upload")}>＋ 이력서 추가하기</button>
              <div className="rl-sp-gap">
                <div className="rl-sp-title" style={{ marginBottom: 12 }}>🤖 최근 생성 질문</div>
                <div className="rl-aq-list">
                  {summary.recentQuestions.map((q, i) => (
                    <div key={i} className="rl-aq-item">{q}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── MOBILE FAB ── */}
      <button className="rl-fab" onClick={() => navigate("/resume/upload")} aria-label="이력서 추가">＋</button>

      {/* ── MOBILE TAB BAR ── */}
      <nav className="rl-tabbar">
        {[
          { icon: "🏠", label: "홈",    path: "/home" },
          { icon: "🎤", label: "면접",  path: "/interview/setup" },
          { icon: "📄", label: "이력서", path: "/resume", active: true },
          { icon: "📢", label: "공고",  path: "/jd" },
          { icon: "👤", label: "프로필", path: "#" },
        ].map((t) => (
          <button
            key={t.label}
            className={`rl-tab-item${t.active ? " rl-tab-item--active" : ""}`}
            onClick={() => navigate(t.path)}
          >
            <span className="rl-tab-icon">{t.icon}</span>
            <span className="rl-tab-label">{t.label}</span>
            <div className="rl-tab-dot" />
          </button>
        ))}
      </nav>

      {/* ── CONTEXT MENU ── */}
      {ctxMenu.open && (
        <div className="rl-ctx-overlay" onClick={closeCtx}>
          <div
            ref={ctxRef}
            className="rl-ctx-menu"
            style={{ top: ctxMenu.y, left: Math.min(ctxMenu.x, window.innerWidth - 236) }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rl-ctx-handle" />
            <div className="rl-ctx-title">{activeResume?.title ?? ""}</div>
            <div className="rl-ctx-sub">이 이력서에 대해 무엇을 할까요?</div>

            <button className="rl-ctx-item" onClick={() => { navigate("/resume/input"); closeCtx(); }}>
              <div className="rl-ctx-icon rl-ci-edit">✏️</div>
              <div>
                <div className="rl-ctx-label">수정하기</div>
                <div className="rl-ctx-desc">이력서 내용을 편집합니다</div>
              </div>
            </button>

            <button className="rl-ctx-item" onClick={() => ctxMenu.resumeId && toggleActive(ctxMenu.resumeId)}>
              <div className="rl-ctx-icon rl-ci-toggle">🔄</div>
              <div>
                <div className="rl-ctx-label">
                  {activeResume?.status === "active" ? "비활성화" : "활성화"}
                </div>
                <div className="rl-ctx-desc">면접 질문 생성에서 제외됩니다</div>
              </div>
            </button>

            <button
              className="rl-ctx-item rl-ctx-item--danger"
              onClick={() => ctxMenu.resumeId && deleteResume(ctxMenu.resumeId)}
            >
              <div className="rl-ctx-icon rl-ci-del">🗑️</div>
              <div>
                <div className="rl-ctx-label">삭제하기</div>
                <div className="rl-ctx-desc">이 이력서를 영구 삭제합니다</div>
              </div>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes rl-fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rl-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes rl-spin    { to{transform:rotate(360deg)} }
        @keyframes rl-slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }

        /* ROOT */
        .rl-root {
          background: #FFFFFF;
          font-family: 'Inter', sans-serif;
          color: #0A0A0A;
          min-height: 100vh;
          padding-bottom: 80px;
          -webkit-font-smoothing: antialiased;
        }

        /* NAV */
        .rl-nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid #E5E7EB;
        }
        .rl-nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 32px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
        }
        .rl-nav-left { display: flex; align-items: center; gap: 16px; }
        .rl-nav-back {
          width: 36px; height: 36px; border-radius: 8px;
          background: #F9FAFB; border: 1px solid #E5E7EB;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: var(--sw); color: #0A0A0A; font-size: 18px; transition: background .15s;
        }
        .rl-nav-back:hover { background: #F3F4F6; }
        .rl-logo {
          font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 900;
          color: #0A0A0A; text-decoration: none;
        }
        .rl-logo span { color: #0991B2; }
        .rl-nav-title { font-family: 'Inter', sans-serif; font-size: 17px; font-weight: 800; color: #0A0A0A; }
        .rl-nav-add {
          width: 36px; height: 36px; border-radius: 8px;
          background: #0A0A0A; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 20px; font-weight: 700;
          box-shadow: var(--sb); transition: opacity .15s;
        }
        .rl-nav-add:hover { opacity: .85; }
        @media(min-width:768px){ .rl-nav-inner{padding:0 32px;height:60px} }

        /* WRAP */
        .rl-wrap {
          max-width: 1200px; margin: 0 auto;
          padding: 0 20px;
        }
        @media(min-width:768px){ .rl-wrap{padding:0 40px} }

        /* PAGE HEADER */
        .rl-page-hd {
          padding-top: 28px; padding-bottom: 28px;
          display: flex; align-items: flex-end; justify-content: space-between;
          animation: rl-fadeUp .5s ease both;
        }
        @media(min-width:768px){ .rl-page-hd{padding-top:48px;padding-bottom:40px} }
        .rl-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
          color: #0991B2; background: #E6F7FA;
          padding: 4px 12px; border-radius: 100px; margin-bottom: 10px;
        }
        .rl-h1 {
          font-family: 'Inter', sans-serif;
          font-size: clamp(26px, 4vw, 46px); font-weight: 900;
          line-height: 1.1; letter-spacing: -0.5px; margin-bottom: 6px;
        }
        .rl-h1-accent { color: #0991B2; }
        .rl-h1-sub { font-size: 14px; color: #6B7280; font-weight: 500; }
        @media(min-width:768px){ .rl-h1-sub{font-size:16px} }
        .rl-ph-right { display: none; }
        @media(min-width:768px){
          .rl-ph-right { display: flex; align-items: center; gap: 10px; }
        }
        .rl-btn-add {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 800;
          color: #fff; background: #0A0A0A;
          border: none; border-radius: 8px; padding: 12px 22px; cursor: pointer;
          box-shadow: var(--sb); text-decoration: none; transition: opacity .2s;
        }
        .rl-btn-add:hover { opacity: .85; }

        /* SUMMARY STRIP */
        .rl-strip {
          background: linear-gradient(135deg, #065F79 0%, #0991B2 100%);
          border-radius: 8px; padding: 22px 24px; margin-bottom: 28px;
          position: relative; overflow: hidden;
          box-shadow: 0 12px 32px rgba(9,145,178,.35);
          animation: rl-fadeUp .5s ease .05s both;
          display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
        }
        @media(min-width:768px){ .rl-strip{border-radius:8px;padding:28px 36px;gap:32px;margin-bottom:36px} }
        .rl-strip::before {
          content:''; position:absolute; top:-40px; right:-40px;
          width:160px; height:160px; border-radius:50%;
          background:rgba(255,255,255,.07);
        }
        .rl-ss-stat  { display:flex;flex-direction:column;gap:2px;position:relative }
        .rl-ss-num   { font-family:'Inter',sans-serif;font-size:clamp(28px,4vw,46px);font-weight:900;color:#fff;line-height:1 }
        .rl-ss-lbl   { font-size:12px;font-weight:600;color:rgba(255,255,255,.65) }
        .rl-ss-div   { width:1px;height:40px;background:rgba(255,255,255,.2);flex-shrink:0 }
        .rl-ss-pills { display:flex;gap:8px;flex-wrap:wrap;position:relative;margin-left:auto }
        .rl-ss-pill  { display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.15);backdrop-filter:blur(8px);border-radius:100px;padding:6px 13px;font-size:12px;font-weight:600;color:#fff }
        .rl-ss-dot   { width:6px;height:6px;border-radius:50%;flex-shrink:0 }
        .rl-ss-dot--on  { background:#34D399 }
        .rl-ss-dot--off { background:rgba(255,255,255,.4) }

        /* CONTENT LAYOUT */
        .rl-content-layout { display:block }
        @media(min-width:1280px){
          .rl-content-layout { display:grid;grid-template-columns:1fr 300px;gap:32px;align-items:start }
        }

        /* SECTION HEADER */
        .rl-sec-hd {
          display:flex;align-items:center;justify-content:space-between;
          margin-bottom:16px;animation:rl-fadeUp .5s ease .1s both;
        }
        .rl-sec-title { font-family:'Inter',sans-serif;font-size:clamp(15px,2vw,18px);font-weight:800;color:#0A0A0A }

        /* LOADING */
        .rl-loading {
          display:flex;align-items:center;justify-content:center;
          gap:12px;padding:60px;font-size:14px;color:#6B7280;font-weight:600;
        }
        .rl-loading-spin {
          width:24px;height:24px;border-radius:50%;
          border:2px solid #E5E7EB;border-top-color:#0991B2;
          animation:rl-spin .8s linear infinite;
        }

        /* RESUME GRID */
        .rl-grid {
          display:grid;grid-template-columns:1fr;gap:14px;padding-bottom:80px;
        }
        @media(min-width:640px){ .rl-grid{grid-template-columns:1fr 1fr} }
        @media(min-width:1024px){ .rl-grid{grid-template-columns:1fr 1fr 1fr} }

        /* RESUME CARD */
        .rl-card {
          background:#F9FAFB;border:1px solid #E5E7EB;
          border-radius:8px;padding:20px;
          box-shadow:var(--sc);
          transition:transform .25s,box-shadow .25s;
          cursor:pointer;position:relative;overflow:hidden;
          animation:rl-fadeUp .5s ease both;
          display:flex;flex-direction:column;
        }
        @media(min-width:768px){ .rl-card{border-radius:8px;padding:24px} }
        .rl-card:hover{ transform:translateY(-5px);box-shadow:0 12px 32px rgba(0,0,0,.1) }
        .rl-card:active{ transform:scale(.985) }

        .rl-card-top {
          display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;
        }
        .rl-card-icon {
          width:44px;height:44px;border-radius:8px;
          display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;
        }
        .rl-ic-file { background:linear-gradient(135deg,#BAE6FD,#2563EB) }
        .rl-ic-text { background:linear-gradient(135deg,#CFFAFE,#0991B2) }
        .rl-card-badges { display:flex;flex-direction:column;align-items:flex-end;gap:6px }

        /* STATUS BADGE */
        .rl-badge {
          display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;
          padding:4px 10px;border-radius:100px;
        }
        .rl-badge--active   { background:rgba(5,150,105,.1);color:#059669 }
        .rl-badge--inactive { background:#F3F4F6;color:#9CA3AF }
        .rl-badge--parsing  { background:rgba(217,119,6,.1);color:#D97706 }
        .rl-st-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0 }
        .rl-st-dot--on      { background:#10B981;animation:rl-pulse 2s infinite }
        .rl-st-dot--off     { background:#9CA3AF }
        .rl-st-dot--loading { background:#F59E0B;animation:rl-pulse 1.4s infinite }

        .rl-menu-btn {
          width:28px;height:28px;border-radius:8px;
          background:#FFFFFF;border:1px solid #E5E7EB;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          box-shadow:var(--sw);color:#6B7280;font-size:16px;
          transition:background .15s;
        }
        .rl-menu-btn:hover { background:#F3F4F6 }

        .rl-card-title {
          font-family:'Inter',sans-serif;font-size:clamp(14px,1.5vw,16px);
          font-weight:800;color:#0A0A0A;margin-bottom:5px;line-height:1.25;
        }
        .rl-card-type {
          display:inline-flex;align-items:center;gap:4px;
          font-size:11px;font-weight:700;color:#0991B2;
          background:#E6F7FA;padding:3px 9px;border-radius:100px;margin-bottom:12px;
        }
        .rl-card-skills { display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px }
        .rl-skill     { font-size:11px;font-weight:600;color:#0991B2;background:#E6F7FA;padding:3px 9px;border-radius:100px }
        .rl-skill-more{ font-size:11px;font-weight:600;color:#9CA3AF;background:#F3F4F6;padding:3px 9px;border-radius:100px }

        .rl-card-meta {
          display:flex;align-items:center;gap:10px;
          font-size:12px;color:#6B7280;font-weight:500;margin-bottom:14px;
        }
        .rl-meta-div { width:1px;height:10px;background:#E5E7EB }

        .rl-card-footer {
          display:flex;align-items:center;justify-content:space-between;
          padding-top:14px;border-top:1px solid #E5E7EB;margin-top:auto;
        }
        .rl-card-actions { display:flex;gap:6px }
        .rl-btn-use {
          font-size:12px;font-weight:700;padding:7px 13px;border-radius:100px;
          border:none;cursor:pointer;background:#0A0A0A;color:#fff;
          box-shadow:var(--sb);transition:opacity .12s;
        }
        .rl-btn-use:hover:not(:disabled){ opacity:.85 }
        .rl-btn-use:disabled{ opacity:.35;cursor:not-allowed }
        .rl-btn-edit {
          font-size:12px;font-weight:700;padding:7px 13px;border-radius:100px;
          border:1px solid #E5E7EB;cursor:pointer;
          background:#E6F7FA;color:#0991B2;transition:background .12s;
        }
        .rl-btn-edit:hover{ background:#cceef6 }
        .rl-card-date { font-size:11px;color:#9CA3AF }

        /* PARSING OVERLAY */
        .rl-parsing-overlay {
          position:absolute;inset:0;border-radius:8px;
          background:rgba(255,255,255,.75);backdrop-filter:blur(4px);
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
        }
        @media(min-width:768px){ .rl-parsing-overlay{border-radius:8px} }
        .rl-parsing-spin {
          width:32px;height:32px;border-radius:50%;
          border:3px solid rgba(9,145,178,.15);border-top-color:#0991B2;
          animation:rl-spin .8s linear infinite;
        }
        .rl-parsing-txt { font-size:12px;font-weight:700;color:#0991B2 }

        /* GHOST CARD */
        .rl-ghost {
          border:2px dashed #E5E7EB;border-radius:8px;
          padding:20px;cursor:pointer;
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
          min-height:160px;
          transition:border-color .2s,background .2s;
          animation:rl-fadeUp .5s ease both;
        }
        @media(min-width:768px){ .rl-ghost{border-radius:8px;padding:24px} }
        .rl-ghost:hover { border-color:#0991B2;background:rgba(9,145,178,.04) }
        .rl-ghost-icon  { font-size:32px }
        .rl-ghost-title { font-family:'Inter',sans-serif;font-size:14px;font-weight:800;color:#0991B2 }
        .rl-ghost-sub   { font-size:12px;color:#9CA3AF }

        /* DESKTOP SIDEBAR */
        .rl-sidebar { display:none }
        @media(min-width:1280px){
          .rl-sidebar {
            display:block;background:#F9FAFB;border:1px solid #E5E7EB;
            border-radius:8px;padding:26px;box-shadow:var(--sc);
            position:sticky;top:88px;
            animation:rl-fadeUp .5s ease .15s both;
          }
        }
        .rl-sp-title { font-family:'Inter',sans-serif;font-size:14px;font-weight:800;color:#0A0A0A;margin-bottom:14px }
        .rl-sp-stats { display:flex;flex-direction:column;gap:8px;margin-bottom:18px }
        .rl-sp-stat  {
          display:flex;align-items:center;justify-content:space-between;
          padding:10px 13px;border-radius:8px;background:#E6F7FA;
        }
        .rl-sp-stat-lbl { font-size:13px;color:#6B7280;font-weight:500 }
        .rl-sp-stat-val { font-family:'Inter',sans-serif;font-size:14px;font-weight:800;color:#0991B2 }
        .rl-sp-cta {
          width:100%;padding:12px;border:none;border-radius:8px;cursor:pointer;
          font-family:'Inter',sans-serif;font-size:13px;font-weight:800;
          background:#0A0A0A;color:#fff;box-shadow:var(--sb);
          display:block;text-align:center;transition:opacity .2s;
        }
        .rl-sp-cta:hover { opacity:.85 }
        .rl-sp-gap { margin-top:20px;padding-top:20px;border-top:1px solid #E5E7EB }
        .rl-aq-list { display:flex;flex-direction:column;gap:8px }
        .rl-aq-item {
          padding:10px 12px;border-radius:8px;
          background:#F9FAFB;border-left:3px solid #0991B2;
          font-size:12px;color:#0A0A0A;line-height:1.55;font-weight:500;
          border: 1px solid #E5E7EB; border-left:3px solid #0991B2;
        }

        /* MOBILE FAB */
        .rl-fab {
          position:fixed;bottom:84px;right:20px;z-index:100;
          width:54px;height:54px;border-radius:8px;
          background:#0A0A0A;border:none;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 8px 24px rgba(0,0,0,.25);
          font-size:26px;color:#fff;transition:transform .15s;
        }
        .rl-fab:active{ transform:scale(.9) }
        @media(min-width:768px){ .rl-fab{display:none} }

        /* MOBILE TAB BAR */
        .rl-tabbar {
          position:fixed;bottom:0;left:0;right:0;z-index:200;
          background:rgba(255,255,255,.95);backdrop-filter:blur(24px);
          border-top:1px solid #E5E7EB;
          display:flex;align-items:center;padding:8px 0 max(20px,env(safe-area-inset-bottom));
        }
        @media(min-width:768px){ .rl-tabbar{display:none} }
        .rl-tab-item {
          flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;
          cursor:pointer;border:none;background:none;padding:4px 0;
        }
        .rl-tab-icon  { font-size:20px;line-height:1 }
        .rl-tab-label { font-size:10px;font-weight:600;color:#9CA3AF }
        .rl-tab-dot   { width:4px;height:4px;border-radius:50%;background:#0991B2;margin:0 auto;opacity:0 }
        .rl-tab-item--active .rl-tab-label { color:#0991B2 }
        .rl-tab-item--active .rl-tab-dot   { opacity:1 }

        /* CONTEXT MENU OVERLAY */
        .rl-ctx-overlay {
          position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;
        }

        /* CONTEXT MENU — mobile bottom sheet */
        .rl-ctx-menu {
          position:fixed;bottom:0;left:0;right:0;z-index:300;
          background:#FFFFFF;
          border-top-left-radius:8px;border-top-right-radius:8px;
          padding:16px 16px max(40px,env(safe-area-inset-bottom));
          box-shadow:0 -8px 32px rgba(0,0,0,.12);
          animation:rl-slideUp .3s cubic-bezier(.4,0,.2,1) both;
        }
        /* desktop: dropdown positioned by JS */
        @media(min-width:768px){
          .rl-ctx-menu {
            position:fixed;bottom:auto;left:auto;right:auto;
            border-radius:8px;padding:10px;width:220px;
            box-shadow:0 8px 32px rgba(0,0,0,.15);
            animation:rl-fadeUp .2s ease both;
          }
        }
        .rl-ctx-handle {
          width:36px;height:4px;border-radius:2px;
          background:#E5E7EB;margin:0 auto 16px;
        }
        @media(min-width:768px){ .rl-ctx-handle{display:none} }
        .rl-ctx-title {
          font-family:'Inter',sans-serif;font-size:14px;font-weight:800;
          color:#0A0A0A;margin-bottom:4px;text-align:center;
        }
        @media(min-width:768px){ .rl-ctx-title{font-size:13px;text-align:left;margin-left:4px} }
        .rl-ctx-sub { font-size:12px;color:#6B7280;text-align:center;margin-bottom:14px }
        @media(min-width:768px){ .rl-ctx-sub{display:none} }

        .rl-ctx-item {
          display:flex;align-items:center;gap:12px;
          padding:12px 14px;border-radius:8px;
          background:#F9FAFB;border:1px solid #E5E7EB;
          margin-bottom:8px;cursor:pointer;width:100%;text-align:left;
          transition:background .12s;
        }
        @media(min-width:768px){
          .rl-ctx-item {
            background:none;border:none;border-radius:8px;margin-bottom:2px;padding:9px 10px;
          }
          .rl-ctx-item:hover { background:rgba(9,145,178,.07) }
        }
        .rl-ctx-item:active{ transform:scale(.97) }
        .rl-ctx-icon {
          width:36px;height:36px;border-radius:8px;
          display:flex;align-items:center;justify-content:center;
          font-size:15px;flex-shrink:0;
        }
        @media(min-width:768px){ .rl-ctx-icon{width:28px;height:28px;border-radius:8px;font-size:13px} }
        .rl-ci-edit   { background:linear-gradient(135deg,#BAE6FD,#2563EB) }
        .rl-ci-toggle { background:linear-gradient(135deg,#A7F3D0,#059669) }
        .rl-ci-del    { background:linear-gradient(135deg,#FCA5A5,#EF4444) }
        .rl-ctx-label { font-size:14px;font-weight:700;color:#0A0A0A }
        @media(min-width:768px){ .rl-ctx-label{font-size:13px} }
        .rl-ctx-desc  { font-size:12px;color:#6B7280;font-weight:500 }
        @media(min-width:768px){ .rl-ctx-desc{display:none} }
        .rl-ctx-item--danger .rl-ctx-label { color:#EF4444 }
      `}</style>
    </div>
  );
}
