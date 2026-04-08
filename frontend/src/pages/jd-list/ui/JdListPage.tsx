import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useJdListStore, type JdListItem } from "@/features/jd";
import { useSessionStore } from "@/entities/session";

type FilterKey = "all" | "planned" | "applied" | "saved";

/* ── Status config ── */
const STATUS_CONFIG = {
  analyzing: {
    label: "분석 중",
    dotCls: "bg-[#0991B2] animate-[jdl-dotPulse_1.2s_ease-in-out_infinite]",
    badgeCls: "bg-[#E6F7FA] text-[#0991B2]",
  },
  planned: {
    label: "지원 예정",
    dotCls: "bg-[#0EA5E9]",
    badgeCls: "bg-[rgba(14,165,233,.1)] text-[#0369A1]",
  },
  applied: {
    label: "지원 완료",
    dotCls: "bg-[#10B981]",
    badgeCls: "bg-[rgba(16,185,129,.1)] text-[#047857]",
  },
  saved: {
    label: "관심 저장",
    dotCls: "bg-[#F59E0B]",
    badgeCls: "bg-[rgba(245,158,11,.1)] text-[#B45309]",
  },
} as const;

const TAG_COLOR_CLS: Record<string, string> = {
  default: "bg-[#E6F7FA] text-[#0991B2]",
  green:   "bg-[rgba(16,185,129,.1)] text-[#047857]",
  blue:    "bg-[rgba(14,165,233,.1)] text-[#0369A1]",
  pink:    "bg-[rgba(219,39,119,.08)] text-[#9D174D]",
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
    <div
      ref={ref}
      className="absolute top-[calc(100%+6px)] right-0 bg-white border border-[#E5E7EB] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.1)] min-w-[140px] overflow-hidden z-50 animate-[jdl-fadeUp_.15s_ease]"
    >
      <button
        className="flex items-center gap-2 w-full py-[10px] px-3.5 border-none bg-transparent text-[13px] font-semibold text-[#374151] cursor-pointer text-left transition-[background] hover:bg-[#F9FAFB] hover:text-[#0991B2]"
        onClick={() => { navigate(`/jd/detail/${id}`); onClose(); }}
      >
        📄 상세 보기
      </button>
      <button
        className="flex items-center gap-2 w-full py-[10px] px-3.5 border-none bg-transparent text-[13px] font-semibold text-[#374151] cursor-pointer text-left transition-[background] hover:bg-[#F9FAFB] hover:text-[#0991B2]"
        onClick={() => { navigate(`/jd/edit/${id}`); onClose(); }}
      >
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
  const tagColorCls = (color: string) => TAG_COLOR_CLS[color] ?? TAG_COLOR_CLS.default;

  return (
    <div
      className="p-7 relative bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] animate-[jdl-fadeUp_.5s_ease_both] cursor-pointer transition-[transform,box-shadow] duration-300 ease hover:-translate-y-1 hover:shadow-[0_4px_6px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.06)] outline-none focus-visible:outline-2 focus-visible:outline-[#0991B2] focus-visible:outline-offset-2"
      onClick={() => { if (!isAnalyzing) navigate(`/jd/detail/${item.id}`); }}
      role={isAnalyzing ? undefined : "button"}
      tabIndex={isAnalyzing ? undefined : 0}
      onKeyDown={(e) => { if (!isAnalyzing && e.key === "Enter") navigate(`/jd/detail/${item.id}`); }}
      aria-label={isAnalyzing ? undefined : `${item.company} ${item.title} 상세 보기`}
    >
      {/* Analyzing overlay */}
      {isAnalyzing && (
        <div
          className="absolute inset-0 rounded-lg bg-[rgba(249,250,251,0.9)] backdrop-blur-[4px] flex flex-col items-center justify-center gap-2.5 z-[2]"
          aria-label="AI 분석 중"
        >
          <div className="w-9 h-9 border-[3px] border-[rgba(9,145,178,0.15)] border-t-[#0991B2] rounded-full animate-[jdl-spin_.9s_linear_infinite]" />
          <div className="text-[13px] font-extrabold text-[#0991B2]">AI 분석 중...</div>
          <div className="text-[11px] text-[#6B7280] font-semibold">공고를 읽고 있어요</div>
          <div className="w-[120px] h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#06B6D4] to-[#0991B2] rounded-full animate-[jdl-analyzeBar_2s_ease-in-out_infinite_alternate]" />
          </div>
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center gap-[5px] text-[11px] font-bold py-1 px-3 rounded-full tracking-[0.3px] ${cfg.badgeCls}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotCls}`} />
          {cfg.label}
        </span>
        <div className="relative">
          <button
            className="w-7 h-7 rounded-lg border-none bg-[#F3F4F6] text-[#6B7280] cursor-pointer flex items-center justify-center text-base transition-all hover:bg-[#E6F7FA] hover:text-[#0991B2] shrink-0"
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
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className="w-[38px] h-[38px] rounded-lg flex items-center justify-center text-base font-black text-white shrink-0 shadow-[0_3px_8px_rgba(0,0,0,0.1)]"
          style={{ background: item.companyColor }}
        >
          {item.companyInitial}
        </div>
        <div className="text-[13px] text-[#6B7280] font-semibold">{item.company}</div>
      </div>

      {/* Title */}
      <div className="text-[17px] font-extrabold leading-[1.3] mb-2.5 tracking-[-0.2px] text-[#0A0A0A]">{item.title}</div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {item.tags.map((tag, i) => (
          <span key={i} className={`text-[11px] font-bold py-1 px-2.5 rounded-full ${tagColorCls(tag.color)}`}>
            {tag.label}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3.5 border-t border-[#F3F4F6]">
        <span className="text-[12px] text-[#9CA3AF]">{item.registeredAt}</span>
        {isAnalyzing ? (
          <span className="text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] border-none rounded-lg py-[7px] px-3.5 opacity-40 cursor-default pointer-events-none">잠시 후 가능</span>
        ) : (
          <button
            className="text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] border-none rounded-lg py-[7px] px-3.5 cursor-pointer transition-all hover:bg-[#cceef6] hover:-translate-y-px"
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
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-[200] py-[14px] px-8 flex justify-center max-sm:py-3 max-sm:px-4">
        <div className="flex items-center justify-between w-full max-w-container-lg bg-white/[.92] backdrop-blur-[20px] border border-[#E5E7EB] rounded-lg p-[8px_8px_8px_24px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]">
          <Link to="/home" className="flex items-center">
            <img src="/logo-korean.png" alt="미핏" className="h-[34px] w-auto" />
          </Link>
          <ul className="flex gap-1 list-none">
            <li><Link to="/home" className="text-[13px] font-medium text-[#6B7280] no-underline py-2 px-3.5 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]">홈</Link></li>
            <li><Link to="/jd" className="text-[13px] font-bold text-[#0991B2] bg-[#E6F7FA] no-underline py-2 px-3.5 rounded-lg">채용공고</Link></li>
            <li><Link to="/interview" className="text-[13px] font-medium text-[#6B7280] no-underline py-2 px-3.5 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]">면접 시작</Link></li>
            <li><Link to="/resume" className="text-[13px] font-medium text-[#6B7280] no-underline py-2 px-3.5 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]">이력서</Link></li>
          </ul>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center text-[13px] font-bold text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_6px_rgba(0,0,0,0.07)]">
            {user?.initial || "U"}
          </div>
        </div>
      </nav>

      <div className="max-w-container-lg mx-auto px-8 pt-[100px] pb-[60px] max-sm:px-4 max-sm:pt-20">

        {/* PAGE HEADER */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.4px] uppercase text-[#0991B2] bg-[#E6F7FA] py-1 px-3 rounded-full mb-2.5">📋 채용공고</div>
            <h1 className="text-[clamp(24px,3vw,36px)] font-black tracking-[-0.8px] text-[#0A0A0A] leading-[1.1]">내 채용공고</h1>
            <p className="text-sm text-[#6B7280] mt-1.5">지원할 채용공고를 등록하고 AI 면접 준비를 시작하세요</p>
          </div>
          <Link to="/jd/add" className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] border-none cursor-pointer py-3.5 px-6 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-85 no-underline whitespace-nowrap">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            채용공고 추가
          </Link>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-3.5 mb-7 max-[900px]:grid-cols-2">
          {[
            { icon: "📋", val: stats.total,   lbl: "전체 공고"  },
            { icon: "🔵", val: stats.planned, lbl: "지원 예정"  },
            { icon: "✅", val: stats.applied, lbl: "지원 완료"  },
            { icon: "⭐", val: stats.saved,   lbl: "관심 저장"  },
          ].map((s, i) => (
            <div
              key={i}
              className="py-[22px] px-6 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] animate-[jdl-fadeUp_.5s_ease_both] transition-shadow hover:shadow-[0_4px_6px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.06)]"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[18px] mb-3.5">{s.icon}</div>
              <div className="text-[32px] font-black tracking-[-1px] text-[#0991B2] leading-none">{s.val}</div>
              <div className="text-[12px] text-[#6B7280] font-semibold mt-1">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* FILTER */}
        <div className="flex items-center gap-2.5 mb-6 flex-wrap max-sm:flex-col max-sm:items-stretch">
          <div className="flex-1 min-w-[220px] relative max-sm:min-w-0">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔍</span>
            <input
              type="text"
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg py-3 pr-4 pl-11 text-sm font-medium text-[#0A0A0A] shadow-[0_1px_3px_rgba(0,0,0,0.08)] outline-none transition-[border-color] focus:border-[#0991B2] focus:shadow-[0_1px_3px_rgba(0,0,0,0.1)] placeholder:text-[#9CA3AF]"
              placeholder="회사명 또는 포지션 검색..."
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="채용공고 검색"
            />
          </div>
          {FILTER_PILLS.map((p) => (
            <button
              key={p.key}
              className={`inline-flex items-center gap-1.5 text-[12px] font-bold py-2 px-4 rounded-full cursor-pointer border transition-all whitespace-nowrap ${
                activeFilter === p.key
                  ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:opacity-85"
                  : "bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB] hover:border-[#0991B2] hover:text-[#0991B2]"
              }`}
              onClick={() => setFilter(p.key)}
              aria-pressed={activeFilter === p.key}
            >
              {p.label} {p.count}
            </button>
          ))}
        </div>

        {/* GRID */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            목록을 불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-5">
            <div className="text-[40px] mb-4">📭</div>
            <div className="text-[18px] font-bold text-[#0A0A0A] mb-2">
              {searchQuery ? "검색 결과가 없어요" : "아직 등록된 채용공고가 없어요"}
            </div>
            <div className="text-sm text-[#6B7280]">
              {searchQuery ? "다른 검색어를 입력해 보세요" : "채용공고를 추가해 AI 면접을 시작해 보세요"}
            </div>
            {!searchQuery && (
              <Link to="/jd/add" className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] border-none cursor-pointer py-3.5 px-6 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-85 no-underline mt-5">
                채용공고 추가하기
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
            {filtered.map((item) => (
              <JdCard key={item.id} item={item} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
