import { Fragment, useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useJdListStore, type JdListItem } from "@/features/jd";
import { useUserJobDescriptionScrapingSse, userJobDescriptionApi } from "@/features/user-job-description";
import { ClipboardList, Search, Trash2 } from "lucide-react";
import { CompanyIcon } from "@/shared/ui/CompanyIcon";

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
function MoreMenu({ onDelete, onClose }: { onDelete: () => void; onClose: () => void }) {
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
        className="flex items-center gap-2 w-full py-[10px] px-3.5 border-none bg-transparent text-[13px] font-semibold text-[#EF4444] cursor-pointer text-left transition-[background] hover:bg-[#FEF2F2]"
        onClick={(e) => { e.stopPropagation(); onDelete(); onClose(); }}
      >
        <Trash2 size={14} /> 채용공고 삭제
      </button>
    </div>
  );
}

/* ── JD Card ── */
function JdCard({ item }: { item: JdListItem }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { fetchList } = useJdListStore();

  const handleDelete = useCallback(async () => {
    await userJobDescriptionApi.remove(item.uuid);
    fetchList();
  }, [item.uuid, fetchList]);
  const cfg = STATUS_CONFIG[item.status];
  const isAnalyzing = item.status === "analyzing";
  const tagColorCls = (color: string) => TAG_COLOR_CLS[color] ?? TAG_COLOR_CLS.default;

  useUserJobDescriptionScrapingSse({
    uuid: item.uuid,
    enabled: isAnalyzing,
    onTerminal: () => {
      fetchList();
    },
  });

  return (
    <div
      className="p-7 relative bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] animate-[jdl-fadeUp_.5s_ease_both] cursor-pointer transition-[transform,box-shadow] duration-300 ease hover:-translate-y-1 hover:shadow-[0_4px_6px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.06)] outline-none focus-visible:outline-2 focus-visible:outline-[#0991B2] focus-visible:outline-offset-2"
      onClick={() => { if (!isAnalyzing) navigate(`/jd/${item.uuid}`); }}
      role={isAnalyzing ? undefined : "button"}
      tabIndex={isAnalyzing ? undefined : 0}
      onKeyDown={(e) => { if (!isAnalyzing && e.key === "Enter") navigate(`/jd/${item.uuid}`); }}
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
          {menuOpen && <MoreMenu onDelete={handleDelete} onClose={() => setMenuOpen(false)} />}
        </div>
      </div>

      {/* Company */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-[38px] h-[38px] rounded-lg shrink-0 shadow-[0_3px_8px_rgba(0,0,0,0.06)] overflow-hidden">
          <CompanyIcon seed={item.uuid} size={18} />
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
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/interview/setup?jd=${encodeURIComponent(item.uuid)}`);
            }}
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
    isLoading, isLoadingMore, hasNext,
    fetchList, loadMore, setSearch, setFilter,
  } = useJdListStore();
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setSentinelNode = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observerRef.current.observe(node);
  }, [loadMore]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  const FILTER_PILLS: { key: FilterKey; label: string; count: number }[] = [
    { key: "all",     label: "전체",     count: stats.total },
    { key: "planned", label: "지원 예정", count: stats.planned },
    { key: "applied", label: "지원 완료", count: stats.applied },
    { key: "saved",   label: "관심 저장", count: stats.saved },
  ];

  return (
    <div>
      <div className="w-full px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">

        {/* PAGE HEADER */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.4px] uppercase text-[#0991B2] bg-[#E6F7FA] py-1 px-3 rounded-full mb-2.5"><ClipboardList size={12} />채용공고</div>
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
        {(() => {
          const statItems = [
            { value: stats.total,   label: "전체 공고" },
            { value: stats.planned, label: "지원 예정" },
            { value: stats.applied, label: "지원 완료" },
            { value: stats.saved,   label: "관심 저장" },
          ];
          const badges = [
            { dot: "#0EA5E9", text: `지원 예정 ${stats.planned}개` },
            { dot: "#10B981", text: `지원 완료 ${stats.applied}개` },
            { dot: "#ffff73ff", text: `관심 저장 ${stats.saved}개` },
          ];
          return (
            <div className="relative overflow-hidden bg-gradient-to-br from-[#065F79] to-[#0991B2] rounded-lg px-6 py-[22px] mb-7 shadow-[0_12px_32px_rgba(9,145,178,.35)] animate-[jdl-fadeUp_.5s_ease_.05s_both] flex items-center gap-[18px] flex-wrap before:content-[''] before:absolute before:top-[-40px] before:right-[-40px] before:w-[160px] before:h-[160px] before:rounded-full before:bg-[rgba(255,255,255,.07)] md:px-9 md:py-7 md:gap-8">
              {statItems.map((item, i) => (
                <Fragment key={item.label}>
                  <div className="flex flex-col gap-[2px] relative">
                    <span className="font-plex-sans-kr text-[clamp(28px,4vw,46px)] font-black text-white leading-none">{item.value}</span>
                    <span className="text-[12px] font-semibold text-white/65">{item.label}</span>
                  </div>
                  {i < statItems.length - 1 && <div className="w-px h-10 bg-white/20 shrink-0" />}
                </Fragment>
              ))}
              <div className="flex gap-2 flex-wrap relative ml-auto">
                {badges.map((badge) => (
                  <span key={badge.text} className="flex items-center gap-[5px] bg-white/15 backdrop-blur-[8px] rounded-full px-[13px] py-[6px] text-[12px] font-semibold text-white">
                    {badge.dot && <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: badge.dot }} />}
                    {badge.text}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* FILTER */}
        <div className="flex items-center gap-2.5 mb-6 flex-wrap max-sm:flex-col max-sm:items-stretch">
          <div className="flex-1 min-w-[220px] relative max-sm:min-w-0">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
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
          <>
            <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
              {filtered.map((item) => (
                <JdCard key={item.uuid} item={item} />
              ))}
            </div>

            {isLoadingMore && (
              <div className="flex justify-center py-6 text-[13px] text-[#6B7280]">다음 공고를 불러오는 중...</div>
            )}

            {hasNext && <div ref={setSentinelNode} className="h-4" />}
          </>
        )}

      </div>
    </div>
  );
}
