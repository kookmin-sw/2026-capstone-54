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

const cardCls = "bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] transition-[box-shadow,transform] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)]";

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

  const calCellCls = (cell: { day: number | null; done: boolean; today: boolean }) => {
    const base = "aspect-square rounded-lg flex items-center justify-center text-[12px] font-semibold text-[#6B7280] cursor-default transition-all select-none relative";
    if (!cell.day) return `${base} opacity-0 pointer-events-none`;
    if (cell.done && cell.today) return `${base} bg-[#0991B2] text-white font-bold shadow-[0_0_0_2px_#0991B2,0_2px_8px_rgba(9,145,178,.4)] animate-[skPop_.25s_ease]`;
    if (cell.done) return `${base} bg-[#0991B2] text-white font-bold shadow-[0_2px_8px_rgba(9,145,178,.35)] animate-[skPop_.25s_ease]`;
    if (cell.today) return `${base} bg-[#E6F7FA] text-[#0991B2] font-extrabold`;
    return `${base} hover:bg-[#E6F7FA] hover:text-[#0991B2]`;
  };

  const msMeta = (status: string, daysRemaining?: number) => {
    if (status === "achieved") return {
      itemCls: "flex items-center gap-2.5 py-3 px-3.5 rounded-[10px] transition-all bg-[#E6F7FA]",
      badgeCls: "w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-sm shrink-0 bg-[#0991B2] shadow-[0_2px_8px_rgba(9,145,178,.3)]",
      tagCls: "text-[11px] font-bold py-[3px] px-[9px] rounded-full shrink-0 text-[#059669] bg-[#ECFDF5]",
      tagText: "완료",
    };
    if (status === "next") return {
      itemCls: "flex items-center gap-2.5 py-3 px-3.5 rounded-[10px] transition-all bg-[rgba(9,145,178,.06)] border-[1.5px] border-dashed border-[rgba(9,145,178,.3)]",
      badgeCls: "w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-sm shrink-0 bg-[rgba(9,145,178,.12)] border-[1.5px] border-dashed border-[rgba(9,145,178,.4)]",
      tagCls: "text-[11px] font-bold py-[3px] px-[9px] rounded-full shrink-0 text-[#0991B2] bg-[#E6F7FA]",
      tagText: `D-${daysRemaining}`,
    };
    return {
      itemCls: "flex items-center gap-2.5 py-3 px-3.5 rounded-[10px] transition-all opacity-45 bg-[#F9FAFB] border border-[#E5E7EB]",
      badgeCls: "w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-sm shrink-0 bg-[#E5E7EB]",
      tagCls: "text-[11px] font-bold py-[3px] px-[9px] rounded-full shrink-0 text-[#6B7280] bg-[#F3F4F6]",
      tagText: `${daysRemaining}일 남음`,
    };
  };

  return (
    <>
      {/* NAV */}
      <nav className="sticky top-0 z-[200] bg-white/[.92] backdrop-blur-[20px] border-b border-[#E5E7EB] h-[60px] flex items-center px-8 gap-3 max-sm:px-4">
        <Link to="/home" className="text-[20px] font-black text-[#0A0A0A] no-underline tracking-[-0.4px] mr-auto">
          me<span className="text-[#0991B2]">Fit</span>
        </Link>
        <Link to="/home" className="text-[13px] font-semibold text-[#6B7280] no-underline py-1.5 px-3 rounded-lg transition-colors hover:text-[#0A0A0A] hover:bg-[#F9FAFB]">← 홈으로</Link>
        <Link to="/interview/setup" className="text-[13px] font-bold text-white bg-[#0A0A0A] border-none rounded-lg py-[9px] px-[18px] cursor-pointer no-underline whitespace-nowrap inline-flex items-center gap-[5px] transition-[opacity,transform] hover:opacity-85 hover:-translate-y-px">면접 시작 →</Link>
      </nav>

      <div className="bg-white min-h-[calc(100vh-60px)] p-8 max-w-container mx-auto max-sm:p-[20px_16px]">
        {loading && !data ? (
          <div className="flex flex-col gap-4">
            <div className="skeleton-gray rounded-lg" style={{ height: 180 }} />
            <div className="grid grid-cols-3 gap-3.5">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton-gray rounded-lg" style={{ height: 110 }} />)}
            </div>
            <div className="grid grid-cols-[1fr_340px] gap-5">
              <div className="skeleton-gray rounded-lg" style={{ height: 360 }} />
              <div className="skeleton-gray rounded-lg" style={{ height: 360 }} />
            </div>
          </div>
        ) : data ? (
          <>
            {/* ─── HERO ─── */}
            <div className="bg-[#0A0A0A] rounded-2xl p-[40px_44px] relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,.18),0_16px_48px_rgba(0,0,0,.12)] mb-5 animate-[skFadeUp_.45s_ease_both] max-[960px]:p-7 max-sm:rounded-xl max-sm:p-[22px_20px]">
              <div className="absolute w-[300px] h-[300px] bg-[rgba(9,145,178,.12)] blur-[80px] rounded-full -top-[100px] -right-[60px] pointer-events-none" />
              <div className="absolute w-[200px] h-[200px] bg-[rgba(6,182,212,.08)] blur-[60px] rounded-full -bottom-[60px] -left-[40px] pointer-events-none" />
              <div className="relative z-[1] flex items-center gap-10">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.2px] uppercase text-white/45 bg-white/[.08] py-1 px-3 rounded-full mb-[18px]">🔥 스트릭 현황</div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[56px] leading-none animate-[skFlicker_3s_ease-in-out_infinite] max-[960px]:text-[44px] max-sm:text-[40px]">🔥</span>
                    <span className="text-[96px] font-black leading-[.9] tracking-[-4px] text-white max-[960px]:text-[72px] max-sm:text-[60px]">{data.currentStreak}</span>
                    <span className="text-[28px] font-bold text-white/45 self-end pb-2.5">일</span>
                  </div>
                  <p className="text-[15px] text-white/55 font-medium mb-5">
                    연속 면접 참여 중 · <strong className="text-white font-bold">{data.todayCompleted ? "오늘도 참여했어요!" : "오늘 아직 참여 전이에요"}</strong>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-[rgba(9,145,178,.25)] border border-[rgba(9,145,178,.45)] text-[#67E8F9] text-[12px] font-bold py-1.5 px-3.5 rounded-full">🏆 역대 최장 {data.bestStreak}일</span>
                    <span className="bg-white/[.08] border border-white/[.12] text-white/70 text-[12px] font-bold py-1.5 px-3.5 rounded-full">총 {data.totalDays}일 참여</span>
                    <span className="bg-white/[.08] border border-white/[.12] text-white/70 text-[12px] font-bold py-1.5 px-3.5 rounded-full">보상 {data.rewardsCount}회 수령</span>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col gap-3.5 items-end max-[960px]:hidden">
                  <div className="w-[148px] h-[148px] bg-[rgba(9,145,178,.15)] border border-[rgba(9,145,178,.25)] rounded-full flex items-center justify-center text-[60px] animate-[skBreathe_3s_ease-in-out_infinite] shadow-[0_0_48px_rgba(9,145,178,.2)]">🔥</div>
                  <div className="flex flex-col gap-2">
                    <div className="bg-white/[.07] border border-white/[.08] rounded-[10px] py-2.5 px-4 text-right">
                      <div className="text-[20px] font-black text-white leading-none">{data.bestStreak}일</div>
                      <div className="text-[10px] text-white/35 mt-0.5 font-semibold">최장 기록</div>
                    </div>
                    <div className="bg-white/[.07] border border-white/[.08] rounded-[10px] py-2.5 px-4 text-right">
                      <div className="text-[20px] font-black text-white leading-none">{data.totalDays}일</div>
                      <div className="text-[10px] text-white/35 mt-0.5 font-semibold">총 참여일</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── STATS ROW ─── */}
            <div className="grid grid-cols-3 gap-3.5 mb-5 animate-[skFadeUp_.45s_ease_.06s_both]">
              {[
                { icon: "🏆", value: data.bestStreak,    label: "최장 연속 기록", accent: true },
                { icon: "📅", value: data.totalDays,     label: "총 참여일",       accent: false },
                { icon: "🎁", value: data.rewardsCount,  label: "보상 수령 횟수", accent: false },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl py-[22px] px-[22px] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] text-center transition-[box-shadow,transform] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[3px] sk-rv${revealed ? " sk-rv-in" : ""}`}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <span className="text-[24px] block mb-2">{s.icon}</span>
                  <span className={`text-[36px] font-black tracking-[-1px] leading-none block mb-1 ${s.accent ? "text-[#0991B2]" : "text-[#0A0A0A]"}`}>{s.value}</span>
                  <span className="text-[12px] text-[#6B7280] font-semibold">{s.label}</span>
                </div>
              ))}
            </div>

            {/* ─── CONTENT GRID ─── */}
            <div className="grid grid-cols-[1fr_340px] gap-5 items-start max-[960px]:grid-cols-1">
              {/* LEFT */}
              <div className="flex flex-col gap-4">

                {/* CALENDAR */}
                <div className={`${cardCls} sk-rv${revealed ? " sk-rv-in" : ""}`} style={{ transitionDelay: "80ms" }}>
                  <span className="text-[10px] font-bold tracking-[1px] uppercase text-[#0991B2] bg-[#E6F7FA] py-[3px] px-2.5 rounded-full inline-block mb-2.5">참여 달력</span>
                  <h2 className="text-[18px] font-black tracking-[-0.3px] mb-1 text-[#0A0A0A]">면접 참여 기록</h2>
                  <p className="text-[13px] text-[#6B7280] mb-[22px] leading-[1.55]">🔥 표시된 날은 면접에 참여한 날입니다</p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[15px] font-black text-[#0A0A0A]">{viewY}년 {MONTH_KO[viewM - 1]}</span>
                    <div className="flex gap-1.5">
                      <button className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] cursor-pointer text-sm flex items-center justify-center text-[#0A0A0A] transition-all hover:bg-[#F3F4F6] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]" onClick={prevMonth} aria-label="이전 달">‹</button>
                      <button className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] cursor-pointer text-sm flex items-center justify-center text-[#0A0A0A] transition-all hover:bg-[#F3F4F6] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]" onClick={nextMonth} aria-label="다음 달">›</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-[3px] mb-1">
                    {["일","월","화","수","목","금","토"].map((d) => (
                      <div key={d} className="text-[10px] font-bold text-[#9CA3AF] text-center py-1">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-[3px]">
                    {calCells.map((cell, i) => (
                      <div
                        key={i}
                        className={calCellCls(cell)}
                        title={cell.done && cell.day ? `${viewM}월 ${cell.day}일 — 면접 참여 ✓` : undefined}
                      >
                        {cell.day}
                        {cell.done && (
                          <span className="absolute top-0.5 right-0.5 text-[6px] leading-none">🔥</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3.5 mt-4 flex-wrap">
                    <div className="flex items-center gap-[5px] text-[11px] text-[#6B7280] font-semibold"><div className="w-3 h-3 rounded-[4px] shrink-0 bg-[#0991B2]" />면접 참여일</div>
                    <div className="flex items-center gap-[5px] text-[11px] text-[#6B7280] font-semibold"><div className="w-3 h-3 rounded-[4px] shrink-0 bg-[#E6F7FA] border-[1.5px] border-[#0991B2]" />오늘</div>
                    <div className="flex items-center gap-[5px] text-[11px] text-[#6B7280] font-semibold"><div className="w-3 h-3 rounded-[4px] shrink-0 bg-[#E5E7EB]" />미참여</div>
                  </div>
                </div>

                {/* REWARD HISTORY */}
                <div className={`${cardCls} sk-rv${revealed ? " sk-rv-in" : ""}`} style={{ transitionDelay: "130ms" }}>
                  <span className="text-[10px] font-bold tracking-[1px] uppercase text-[#0991B2] bg-[#E6F7FA] py-[3px] px-2.5 rounded-full inline-block mb-2.5">보상 내역</span>
                  <h2 className="text-[18px] font-black tracking-[-0.3px] mb-1 text-[#0A0A0A]">스트릭 보상 수령 이력</h2>
                  <p className="text-[13px] text-[#6B7280] mb-[22px] leading-[1.55]">마일스톤 달성 시 Pro 기능 사용권이 자동 지급됩니다</p>
                  <div className="flex flex-col gap-2">
                    {data.rewardHistory.map((rh) => (
                      <div key={rh.id} className="flex items-center gap-3 py-3 px-3.5 bg-white border border-[#E5E7EB] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-px">
                        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-base shrink-0" style={iconBgStyle(rh.iconBg)}>{rh.icon}</div>
                        <div className="flex-1">
                          <div className="text-[13px] font-bold mb-0.5 text-[#0A0A0A]">{rh.title}</div>
                          <div className="text-[11px] text-[#6B7280]">{rh.description} · {rh.date}</div>
                        </div>
                        <span className="text-[11px] font-bold text-[#0991B2] bg-[#E6F7FA] py-[3px] px-[9px] rounded-full whitespace-nowrap">수령 완료</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-col gap-4">

                {/* NEXT REWARD */}
                <div className={`bg-[#0A0A0A] rounded-xl p-[26px] relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,.16),0_12px_40px_rgba(0,0,0,.1)] sk-rv${revealed ? " sk-rv-in" : ""}`} style={{ transitionDelay: "100ms" }}>
                  <div className="absolute w-[200px] h-[200px] bg-[rgba(9,145,178,.12)] blur-[60px] rounded-full -top-[60px] -right-[40px] pointer-events-none" />
                  <div className="relative z-[1]">
                    <div className="text-[10px] font-bold tracking-[1px] uppercase text-white/35 mb-3.5">다음 보상까지</div>
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="text-[34px] font-black text-white tracking-[-1px] leading-none">
                        {data.nextReward.targetDays}<span className="text-sm font-bold text-white/40 ml-[3px]">일 달성 목표</span>
                      </div>
                      <div className="text-[12px] font-bold text-white/45">{data.nextReward.daysRemaining}일 남음</div>
                    </div>
                    <div className="h-2 bg-white/[.1] rounded-full overflow-hidden my-3.5">
                      <div
                        className="h-full bg-[#0991B2] rounded-full [transition:width_1s_cubic-bezier(.34,1.56,.64,1)]"
                        style={{ width: `${data.nextReward.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/35">{data.currentStreak} / {data.nextReward.targetDays}일 완료</span>
                      <div className="flex items-center gap-[5px] bg-[rgba(9,145,178,.25)] border border-[rgba(9,145,178,.4)] rounded-full py-1 px-2.5 text-[12px] font-bold text-[#67E8F9]">🎁 {data.nextReward.reward}</div>
                    </div>
                    <div className="mt-4 pt-3.5 border-t border-white/[.07]">
                      <p className="text-[12px] text-white/35 leading-[1.65]">{data.nextReward.rewardDetail}</p>
                    </div>
                  </div>
                </div>

                {/* MILESTONES */}
                <div className={`${cardCls} sk-rv${revealed ? " sk-rv-in" : ""}`} style={{ transitionDelay: "150ms" }}>
                  <span className="text-[10px] font-bold tracking-[1px] uppercase text-[#0991B2] bg-[#E6F7FA] py-[3px] px-2.5 rounded-full inline-block mb-2.5">마일스톤</span>
                  <h3 className="text-base font-black tracking-[-0.3px] mb-1 text-[#0A0A0A]">보상 달성 로드맵</h3>
                  <p className="text-[13px] text-[#6B7280] mb-[22px] leading-[1.55]">스트릭 목표를 달성하면 Pro 기능을 무료로 이용하세요</p>
                  <div className="flex flex-col gap-2">
                    {data.milestones.map((ms) => {
                      const meta = msMeta(ms.status, ms.daysRemaining);
                      return (
                        <div key={ms.days} className={meta.itemCls}>
                          <div className={meta.badgeCls}>
                            {ms.status === "achieved" ? "✓" : ms.rewardIcon}
                          </div>
                          <div className="flex-1">
                            <div className="text-[13px] font-bold text-[#0A0A0A] mb-0.5">{ms.days}일 달성</div>
                            <div className="text-[11px] text-[#6B7280] leading-[1.45]">{ms.reward}</div>
                          </div>
                          <span className={meta.tagCls}>{meta.tagText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CTA */}
                <div className={`bg-[#0A0A0A] rounded-xl p-[24px_26px] flex items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,.14)] relative overflow-hidden max-sm:flex-col max-sm:items-start sk-rv${revealed ? " sk-rv-in" : ""}`} style={{ transitionDelay: "200ms" }}>
                  <div className="absolute w-[160px] h-[160px] bg-[rgba(9,145,178,.1)] blur-[50px] rounded-full -top-[50px] right-20 pointer-events-none" />
                  <div className="relative z-[1]">
                    <div className="text-base font-black text-white mb-1">오늘의 면접 시작하기</div>
                    <div className="text-[12px] text-white/45 leading-[1.55]">
                      {data.nextReward.daysRemaining}일만 더 하면 보상이 기다려요.<br />
                      지금 바로 이어가세요 🔥
                    </div>
                  </div>
                  <Link to="/interview/setup" className="relative z-[1] text-[13px] font-bold text-[#0A0A0A] bg-white border-none rounded-lg py-[11px] px-5 cursor-pointer whitespace-nowrap no-underline transition-all hover:bg-[#F3F4F6] hover:-translate-y-0.5 inline-block max-sm:w-full max-sm:text-center">면접 시작 →</Link>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
