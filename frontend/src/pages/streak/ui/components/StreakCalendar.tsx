import { useState } from "react";

const MONTH_KO = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

interface CalendarCell {
  day: number | null;
  done: boolean;
  today: boolean;
}

function buildCalendarCells(
  year: number,
  month: number,
  doneSet: Set<number>,
  todayYear: number,
  todayMonth: number,
  todayDay: number
): CalendarCell[] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstDow; i++) {
    cells.push({ day: null, done: false, today: false });
  }

  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      day: d,
      done: doneSet.has(d),
      today: year === todayYear && month === todayMonth && d === todayDay,
    });
  }

  return cells;
}

function getCalendarCellClass(cell: CalendarCell): string {
  const base =
    "aspect-square rounded-lg flex items-center justify-center text-[12px] font-semibold text-[#6B7280] cursor-default transition-all select-none relative";

  if (!cell.day) return `${base} opacity-0 pointer-events-none`;
  if (cell.done && cell.today)
    return `${base} bg-[#0991B2] text-white font-bold shadow-[0_0_0_2px_#0991B2,0_2px_8px_rgba(9,145,178,.4)] animate-[skPop_.25s_ease]`;
  if (cell.done)
    return `${base} bg-[#0991B2] text-white font-bold shadow-[0_2px_8px_rgba(9,145,178,.35)] animate-[skPop_.25s_ease]`;
  if (cell.today) return `${base} bg-[#E6F7FA] text-[#0991B2] font-extrabold`;
  return `${base} hover:bg-[#E6F7FA] hover:text-[#0991B2]`;
}

interface StreakCalendarProps {
  calendarDoneMap: Record<string, number[]>;
  revealed: boolean;
  todayYear: number;
  todayMonth: number;
  todayDay: number;
}

export function StreakCalendar({
  calendarDoneMap,
  revealed,
  todayYear,
  todayMonth,
  todayDay,
}: StreakCalendarProps) {
  const [viewY, setViewY] = useState(todayYear);
  const [viewM, setViewM] = useState(todayMonth);

  const prevMonth = () => {
    if (viewM === 1) {
      setViewY((y) => y - 1);
      setViewM(12);
    } else {
      setViewM((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewM === 12) {
      setViewY((y) => y + 1);
      setViewM(1);
    } else {
      setViewM((m) => m + 1);
    }
  };

  const doneSet = new Set(calendarDoneMap[`${viewY}-${viewM}`] ?? []);
  const calCells = buildCalendarCells(viewY, viewM, doneSet, todayYear, todayMonth, todayDay);

  return (
    <div
      className={`bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] transition-[box-shadow,transform] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] sk-rv${
        revealed ? " sk-rv-in" : ""
      }`}
      style={{ transitionDelay: "80ms" }}
    >
      <span className="text-[10px] font-bold tracking-[1px] uppercase text-[#0991B2] bg-[#E6F7FA] py-[3px] px-2.5 rounded-full inline-block mb-2.5">
        참여 달력
      </span>
      <h2 className="text-[18px] font-black tracking-[-0.3px] mb-1 text-[#0A0A0A]">면접 참여 기록</h2>
      <p className="text-[13px] text-[#6B7280] mb-[22px] leading-[1.55]">
        🔥 표시된 날은 면접에 참여한 날입니다
      </p>

      <div className="flex items-center justify-between mb-4">
        <span className="text-[15px] font-black text-[#0A0A0A]">
          {viewY}년 {MONTH_KO[viewM - 1]}
        </span>
        <div className="flex gap-1.5">
          <button
            className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] cursor-pointer text-sm flex items-center justify-center text-[#0A0A0A] transition-all hover:bg-[#F3F4F6] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            onClick={prevMonth}
            aria-label="이전 달"
          >
            ‹
          </button>
          <button
            className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] cursor-pointer text-sm flex items-center justify-center text-[#0A0A0A] transition-all hover:bg-[#F3F4F6] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            onClick={nextMonth}
            aria-label="다음 달"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-[3px] mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="text-[10px] font-bold text-[#9CA3AF] text-center py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {calCells.map((cell, i) => (
          <div
            key={i}
            className={getCalendarCellClass(cell)}
            title={cell.done && cell.day ? `${viewM}월 ${cell.day}일 — 면접 참여 ✓` : undefined}
          >
            {cell.day}
            {cell.done && <span className="absolute top-0.5 right-0.5 text-[6px] leading-none">🔥</span>}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3.5 mt-4 flex-wrap">
        <div className="flex items-center gap-[5px] text-[11px] text-[#6B7280] font-semibold">
          <div className="w-3 h-3 rounded-[4px] shrink-0 bg-[#0991B2]" />
          면접 참여일
        </div>
        <div className="flex items-center gap-[5px] text-[11px] text-[#6B7280] font-semibold">
          <div className="w-3 h-3 rounded-[4px] shrink-0 bg-[#E6F7FA] border-[1.5px] border-[#0991B2]" />
          오늘
        </div>
        <div className="flex items-center gap-[5px] text-[11px] text-[#6B7280] font-semibold">
          <div className="w-3 h-3 rounded-[4px] shrink-0 bg-[#E5E7EB]" />
          미참여
        </div>
      </div>
    </div>
  );
}
