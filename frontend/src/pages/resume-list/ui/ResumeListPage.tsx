import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useResumeListStore } from "@/features/resume-list";
import { MobileTabBar } from "@/shared/ui";
import type { ResumeItem } from "@/features/resume-list";

/* ─────────────────────────── sub-components ─────────────────────────── */

function StatusBadge({ status }: { status: ResumeItem["status"] }) {
  if (status === "active")
    return (
      <span className="flex items-center gap-[5px] text-[11px] font-bold px-[10px] py-1 rounded-full bg-[rgba(5,150,105,.1)] text-[#059669]">
        <span className="w-[6px] h-[6px] rounded-full bg-[#10B981] animate-[rl-pulse_2s_infinite] shrink-0" />
        활성화
      </span>
    );
  if (status === "parsing")
    return (
      <span className="flex items-center gap-[5px] text-[11px] font-bold px-[10px] py-1 rounded-full bg-[rgba(217,119,6,.1)] text-[#D97706]">
        <span className="w-[6px] h-[6px] rounded-full bg-[#F59E0B] animate-[rl-pulse_1.4s_infinite] shrink-0" />
        분석 중
      </span>
    );
  return (
    <span className="flex items-center gap-[5px] text-[11px] font-bold px-[10px] py-1 rounded-full bg-[#F3F4F6] text-[#9CA3AF]">
      <span className="w-[6px] h-[6px] rounded-full bg-[#9CA3AF] shrink-0" />
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
      className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-5 shadow-[var(--sc)] transition-[transform,box-shadow] duration-[250ms] cursor-pointer relative overflow-hidden animate-[rl-fadeUp_.5s_ease_both] flex flex-col hover:-translate-y-[5px] hover:shadow-[0_12px_32px_rgba(0,0,0,.1)] active:scale-[.985] md:p-6"
      style={{ animationDelay: `${delay}s` }}
      onClick={(e) => !isParsing && onMenu(e, item.id)}
    >
      <div className="flex items-start justify-between mb-[14px]">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-[20px] shrink-0 ${item.type === "file" ? "bg-gradient-to-br from-[#BAE6FD] to-[#2563EB]" : "bg-gradient-to-br from-[#CFFAFE] to-[#0991B2]"}`}>
          {item.type === "file" ? "📄" : "✏️"}
        </div>
        <div className="flex flex-col items-end gap-[6px]">
          <StatusBadge status={item.status} />
          <button
            className="w-7 h-7 rounded-lg bg-white border border-[#E5E7EB] cursor-pointer flex items-center justify-center shadow-[var(--sw)] text-[#6B7280] text-[16px] transition-[background] duration-[150ms] hover:bg-[#F3F4F6]"
            onClick={(e) => { e.stopPropagation(); onMenu(e, item.id); }}
            aria-label="더보기"
          >
            ⋯
          </button>
        </div>
      </div>

      <div className="font-inter text-[clamp(14px,1.5vw,16px)] font-extrabold text-[#0A0A0A] mb-[5px] leading-[1.25]">{item.title}</div>
      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0991B2] bg-[#E6F7FA] px-[9px] py-[3px] rounded-full mb-3">
        {item.type === "file" ? `📎 파일 업로드 · ${item.fileExt}` : "✏️ 직접 입력"}
      </div>

      <div className="flex gap-[6px] flex-wrap mb-3">
        {item.skills.map((s) => (
          <span key={s} className="text-[11px] font-semibold text-[#0991B2] bg-[#E6F7FA] px-[9px] py-[3px] rounded-full">{s}</span>
        ))}
        {item.extraSkillCount > 0 && (
          <span className="text-[11px] font-semibold text-[#9CA3AF] bg-[#F3F4F6] px-[9px] py-[3px] rounded-full">+{item.extraSkillCount}</span>
        )}
      </div>

      <div className="flex items-center gap-[10px] text-[12px] text-[#6B7280] font-medium mb-[14px]">
        <span>{item.meta}</span>
        <span className="w-px h-[10px] bg-[#E5E7EB]" />
        <span>{item.status === "parsing" ? "AI 분석 중…" : "🤖 AI 분석 완료"}</span>
      </div>

      <div className="flex items-center justify-between pt-[14px] border-t border-[#E5E7EB] mt-auto">
        <div className="flex gap-[6px]">
          <button
            className="text-[12px] font-bold px-[13px] py-[7px] rounded-full border-none cursor-pointer bg-[#0A0A0A] text-white shadow-[var(--sb)] transition-opacity duration-[120ms] hover:enabled:opacity-85 disabled:opacity-35 disabled:cursor-not-allowed"
            disabled={isParsing}
            onClick={(e) => { e.stopPropagation(); onUse(item.id); }}
          >
            이걸로 면접
          </button>
          {!isParsing && (
            <button
              className="text-[12px] font-bold px-[13px] py-[7px] rounded-full border border-[#E5E7EB] cursor-pointer bg-[#E6F7FA] text-[#0991B2] transition-[background] duration-[120ms] hover:bg-[#cceef6]"
              onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
            >
              수정
            </button>
          )}
        </div>
        <span className="text-[11px] text-[#9CA3AF]">{item.date}</span>
      </div>

      {isParsing && (
        <div className="absolute inset-0 rounded-lg bg-white/75 backdrop-blur-[4px] flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full border-[3px] border-[rgba(9,145,178,.15)] border-t-[#0991B2] animate-[rl-spin_.8s_linear_infinite]" />
          <span className="text-[12px] font-bold text-[#0991B2]">AI가 분석하는 중</span>
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
    resumes, summary, loading, error, ctxMenu,
    fetchResumes, deleteResume, openCtx, closeCtx,
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
    <div className="bg-white font-inter text-[#0A0A0A] min-h-screen pb-20 [-webkit-font-smoothing:antialiased]">

      {/* ── MAIN ── */}
      <main className="max-w-container-xl mx-auto px-5 md:px-10">

        {/* Page header */}
        <div className="pt-7 pb-7 flex items-end justify-between animate-[rl-fadeUp_.5s_ease_both] md:pt-12 md:pb-10">
          <div>
            <div className="inline-flex items-center gap-[6px] text-[11px] font-bold tracking-[1px] uppercase text-[#0991B2] bg-[#E6F7FA] px-3 py-1 rounded-full mb-[10px]">📄 이력서 관리</div>
            <h1 className="font-inter text-[clamp(26px,4vw,46px)] font-black leading-[1.1] tracking-[-0.5px] mb-[6px]">
              내 이력서<br /><span className="text-[#0991B2]">라이브러리</span>
            </h1>
            <p className="text-[14px] text-[#6B7280] font-medium md:text-[16px]">이력서를 등록하면 맞춤 면접 질문이 자동으로 생성돼요</p>
          </div>
          <div className="hidden md:flex items-center gap-[10px]">
            <button className="flex items-center gap-2 font-inter text-[14px] font-extrabold text-white bg-[#0A0A0A] border-none rounded-lg px-[22px] py-3 cursor-pointer shadow-[var(--sb)] no-underline transition-opacity duration-200 hover:opacity-85" onClick={() => navigate("/resume/upload")}>＋ 이력서 추가</button>
          </div>
        </div>

        {/* Summary strip */}
        {summary && (
          <div className="relative overflow-hidden bg-gradient-to-br from-[#065F79] to-[#0991B2] rounded-lg px-6 py-[22px] mb-7 shadow-[0_12px_32px_rgba(9,145,178,.35)] animate-[rl-fadeUp_.5s_ease_.05s_both] flex items-center gap-[18px] flex-wrap before:content-[''] before:absolute before:top-[-40px] before:right-[-40px] before:w-[160px] before:h-[160px] before:rounded-full before:bg-[rgba(255,255,255,.07)] md:rounded-lg md:px-9 md:py-7 md:gap-8 md:mb-9">
            <div className="flex flex-col gap-[2px] relative">
              <span className="font-inter text-[clamp(28px,4vw,46px)] font-black text-white leading-none">{summary.total}</span>
              <span className="text-[12px] font-semibold text-white/65">전체 이력서</span>
            </div>
            <div className="w-px h-10 bg-white/20 shrink-0" />
            <div className="flex flex-col gap-[2px] relative">
              <span className="font-inter text-[clamp(28px,4vw,46px)] font-black text-white leading-none">{summary.active}</span>
              <span className="text-[12px] font-semibold text-white/65">활성화</span>
            </div>
            <div className="w-px h-10 bg-white/20 shrink-0" />
            <div className="flex flex-col gap-[2px] relative">
              <span className="font-inter text-[clamp(28px,4vw,46px)] font-black text-white leading-none">{summary.parsing}</span>
              <span className="text-[12px] font-semibold text-white/65">분석 중</span>
            </div>
            <div className="flex gap-2 flex-wrap relative ml-auto">
              <span className="flex items-center gap-[5px] bg-white/15 backdrop-blur-[8px] rounded-full px-[13px] py-[6px] text-[12px] font-semibold text-white">
                📎 파일 {summary.fileCount} · ✏️ 텍스트 {summary.textCount}
              </span>
            </div>
          </div>
        )}

        {/* Content layout */}
        <div className="block xl:grid xl:grid-cols-[1fr_300px] xl:gap-8 xl:items-start">
          <div>
            {/* Section header */}
            <div className="flex items-center justify-between mb-4 animate-[rl-fadeUp_.5s_ease_.1s_both]">
              <span className="font-inter text-[clamp(15px,2vw,18px)] font-extrabold text-[#0A0A0A]">전체 이력서 {resumes.length}개</span>
            </div>

            {/* Resume grid */}
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-[60px] text-[14px] text-[#6B7280] font-semibold">
                <div className="w-6 h-6 rounded-full border-2 border-[#E5E7EB] border-t-[#0991B2] animate-[rl-spin_.8s_linear_infinite]" />
                <span>이력서를 불러오는 중...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 py-[60px] text-[14px] text-[#EF4444] font-semibold">
                <span>⚠️ {error}</span>
                <button className="text-[13px] font-bold px-4 py-2 rounded-lg bg-[#0A0A0A] text-white" onClick={fetchResumes}>다시 시도</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-[14px] pb-20 sm:grid-cols-2 lg:grid-cols-3">
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
                <div
                  className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-5 cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[160px] transition-[border-color,background] duration-200 animate-[rl-fadeUp_.5s_ease_both] hover:border-[#0991B2] hover:bg-[rgba(9,145,178,.04)] md:p-6"
                  onClick={() => navigate("/resume/upload")}
                  style={{ animationDelay: `${0.06 + resumes.length * 0.06}s` }}
                >
                  <span className="text-[32px]">➕</span>
                  <span className="font-inter text-[14px] font-extrabold text-[#0991B2]">이력서 추가하기</span>
                  <span className="text-[12px] text-[#9CA3AF]">파일 업로드 또는 직접 입력</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop sidebar (1280px+) */}
          {summary && (
            <div className="hidden xl:block bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-[26px] shadow-[var(--sc)] sticky top-[88px] animate-[rl-fadeUp_.5s_ease_.15s_both]">
              <div className="font-inter text-[14px] font-extrabold text-[#0A0A0A] mb-[14px]">📊 현황 요약</div>
              <div className="flex flex-col gap-2 mb-[18px]">
                {[
                  { label: "전체 이력서", val: `${summary.total}개` },
                  { label: "활성화", val: `${summary.active}개` },
                  { label: "면접 진행 횟수", val: `${summary.interviewCount}회` },
                  { label: "평균 점수", val: `${summary.avgScore}점` },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between px-[13px] py-[10px] rounded-lg bg-[#E6F7FA]">
                    <span className="text-[13px] text-[#6B7280] font-medium">{s.label}</span>
                    <span className="font-inter text-[14px] font-extrabold text-[#0991B2]">{s.val}</span>
                  </div>
                ))}
              </div>
              <button className="w-full py-3 border-none rounded-lg cursor-pointer font-inter text-[13px] font-extrabold bg-[#0A0A0A] text-white shadow-[var(--sb)] block text-center transition-opacity duration-200 hover:opacity-85" onClick={() => navigate("/resume/upload")}>＋ 이력서 추가하기</button>
              <div className="mt-5 pt-5 border-t border-[#E5E7EB]">
                <div className="font-inter text-[14px] font-extrabold text-[#0A0A0A]" style={{ marginBottom: 12 }}>🤖 최근 생성 질문</div>
                <div className="flex flex-col gap-2">
                  {summary.recentQuestions.map((q, i) => (
                    <div key={i} className="px-3 py-[10px] rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] border-l-[3px] border-l-[#0991B2] text-[12px] text-[#0A0A0A] leading-[1.55] font-medium">{q}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileTabBar activeTab="resume" />

      {/* ── CONTEXT MENU ── */}
      {ctxMenu.open && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,.2)] z-[299]" onClick={closeCtx}>
          <div
            ref={ctxRef}
            className="fixed bottom-0 left-0 right-0 z-[300] bg-white rounded-tl-lg rounded-tr-lg px-4 pt-4 pb-[max(40px,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,.12)] animate-[rl-slideUp_.3s_cubic-bezier(.4,0,.2,1)_both] md:bottom-auto md:left-auto md:right-auto md:rounded-lg md:p-[10px] md:w-[220px] md:shadow-[0_8px_32px_rgba(0,0,0,.15)] md:animate-[rl-fadeUp_.2s_ease_both]"
            style={{ top: ctxMenu.y, left: Math.min(ctxMenu.x, window.innerWidth - 236) }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-sm bg-[#E5E7EB] mx-auto mb-4 md:hidden" />
            <div className="font-inter text-[14px] font-extrabold text-[#0A0A0A] mb-1 text-center md:text-[13px] md:text-left md:ml-1">{activeResume?.title ?? ""}</div>
            <div className="text-[12px] text-[#6B7280] text-center mb-[14px] md:hidden">이 이력서에 대해 무엇을 할까요?</div>

            <button className="flex items-center gap-3 px-[14px] py-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] mb-2 cursor-pointer w-full text-left transition-[background] duration-[120ms] active:scale-[.97] md:bg-transparent md:border-none md:mb-[2px] md:px-[10px] md:py-[9px] md:hover:bg-[rgba(9,145,178,.07)]" onClick={() => { navigate(`/resume/input?uuid=${ctxMenu.resumeId}`); closeCtx(); }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[15px] shrink-0 bg-gradient-to-br from-[#BAE6FD] to-[#2563EB] md:w-7 md:h-7 md:text-[13px]">✏️</div>
              <div>
                <div className="text-[14px] font-bold text-[#0A0A0A] md:text-[13px]">수정하기</div>
                <div className="text-[12px] text-[#6B7280] font-medium md:hidden">이력서 내용을 편집합니다</div>
              </div>
            </button>

            <button className="flex items-center gap-3 px-[14px] py-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] mb-2 cursor-pointer w-full text-left transition-[background] duration-[120ms] active:scale-[.97] md:bg-transparent md:border-none md:mb-[2px] md:px-[10px] md:py-[9px] md:hover:bg-[rgba(9,145,178,.07)]" onClick={() => ctxMenu.resumeId && deleteResume(ctxMenu.resumeId)}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[15px] shrink-0 bg-gradient-to-br from-[#FCA5A5] to-[#EF4444] md:w-7 md:h-7 md:text-[13px]">🗑️</div>
              <div>
                <div className="text-[14px] font-bold text-[#EF4444] md:text-[13px]">삭제하기</div>
                <div className="text-[12px] text-[#6B7280] font-medium md:hidden">이 이력서를 영구 삭제합니다</div>
              </div>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
