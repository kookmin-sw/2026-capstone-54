import { useMemo, useRef, useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CELL_GAP    = 3;
const MAX_WEEKS   = 52;
const MOBILE_WEEKS = 28;
const MOBILE_BP   = 500;
const NUM_DAYS    = 7;

const CELL_COLORS = [
  "#E5E7EB",
  "#BAE6F0",
  "#67C8DC",
  "#0991B2",
  "#065F79",
];

interface StreakCalendarProps {
  calendarDoneMap: Record<string, Record<number, number>>;
  revealed: boolean;
  todayYear: number;
  todayMonth: number;
  todayDay: number;
  hideIcon?: boolean;
}

interface DayCell {
  date: Date | null;
  count: number;
  today: boolean;
  label?: string;
}

function buildYearGrid(
  calendarDoneMap: Record<string, Record<number, number>>,
  todayYear: number,
  todayMonth: number,
  todayDay: number
): { weeks: DayCell[][]; monthPositions: { label: string; col: number }[] } {
  const today = new Date(todayYear, todayMonth - 1, todayDay);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (MAX_WEEKS - 1) * 7 - today.getDay());

  const weeks: DayCell[][] = [];
  const monthPositions: { label: string; col: number }[] = [];
  let lastMonth = -1;

  for (let w = 0; w < MAX_WEEKS; w++) {
    const week: DayCell[] = [];
    for (let d = 0; d < NUM_DAYS; d++) {
      const cur = new Date(startDate);
      cur.setDate(startDate.getDate() + w * NUM_DAYS + d);

      if (cur > today) {
        week.push({ date: null, count: 0, today: false });
        continue;
      }

      const y   = cur.getFullYear();
      const mo  = cur.getMonth() + 1;
      const day = cur.getDate();
      const monthKey = `${y}-${mo}`;
      const count = calendarDoneMap[monthKey]?.[day] ?? 0;

      week.push({
        date: cur,
        count,
        today: y === todayYear && mo === todayMonth && day === todayDay,
        label: count > 0
          ? `${y}년 ${mo}월 ${day}일 — 면접 ${count}회 ✓`
          : `${y}년 ${mo}월 ${day}일`,
      });

      if (d === 0 && mo !== lastMonth) {
        monthPositions.push({ label: MONTH_SHORT[mo - 1], col: w });
        lastMonth = mo;
      }
    }
    weeks.push(week);
  }

  return { weeks, monthPositions };
}

export function StreakCalendar({
  calendarDoneMap,
  revealed,
  todayYear,
  todayMonth,
  todayDay,
  hideIcon = false,
}: StreakCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(13);
  const [visibleWeeks, setVisibleWeeks] = useState(MAX_WEEKS);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const calc = (contentWidth: number) => {
      const numWeeks = contentWidth < MOBILE_BP ? MOBILE_WEEKS : MAX_WEEKS;
      setVisibleWeeks(numWeeks);
      // All width goes to cells — no label column, minus padding for outline breathing room
      const size = (contentWidth - 6 - (numWeeks - 1) * CELL_GAP) / numWeeks;
      setCellSize(Math.max(6, size));
    };

    const style = getComputedStyle(el);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    calc(el.offsetWidth - padX);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) calc(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { weeks: allWeeks, monthPositions: allMonthPositions } = useMemo(
    () => buildYearGrid(calendarDoneMap, todayYear, todayMonth, todayDay),
    [calendarDoneMap, todayYear, todayMonth, todayDay]
  );

  const offset = MAX_WEEKS - visibleWeeks;
  const weeks = allWeeks.slice(offset);
  const monthPositions = allMonthPositions
    .filter((m) => m.col >= offset)
    .map((m) => ({ ...m, col: m.col - offset }));

  const totalDone = useMemo(() => {
    let n = 0;
    for (const dayMap of Object.values(calendarDoneMap)) n += Object.keys(dayMap).length;
    return n;
  }, [calendarDoneMap]);

  return (
    <div
      ref={containerRef}
      className={`bg-white border border-[#E5E7EB] rounded-xl p-6 max-sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] sk-rv${
        revealed ? " sk-rv-in" : ""
      }`}
      style={{ transitionDelay: "80ms" }}
    >
      <div className="flex items-center gap-2 mb-4">
        {!hideIcon && (
          <span className="w-7 h-7 rounded-lg bg-[#E6F7FA] flex items-center justify-center">
            <Calendar size={14} className="text-[#0991B2]" />
          </span>
        )}
        <Link to="/streak" className={`${hideIcon ? "text-[16px]" : "text-[14px]"} font-bold text-[#0A0A0A] no-underline hover:text-[#0991B2] transition-colors`}>스트릭</Link>
        <span className="text-[11px] text-[#9CA3AF] font-medium ml-auto">
          {visibleWeeks < MAX_WEEKS ? `최근 ${visibleWeeks}주` : "최근 52주"} ·{" "}
          <strong className="text-[#0991B2]">{totalDone}일</strong> 참여
        </span>
      </div>

      {/* Graph — edge to edge */}
      <div style={{ width: "100%", overflow: "hidden", padding: 3 }}>
        {/* Month labels */}
        <div style={{ display: "flex", marginBottom: 4 }}>
          {weeks.map((_, col) => {
            const mp = monthPositions.find((m) => m.col === col);
            return (
              <div
                key={col}
                style={{
                  width: cellSize,
                  flexShrink: 0,
                  marginRight: col < visibleWeeks - 1 ? CELL_GAP : 0,
                  fontSize: 9,
                  color: "#9CA3AF",
                  fontFamily: "monospace",
                  lineHeight: 1,
                  overflow: "visible",
                  whiteSpace: "nowrap",
                }}
              >
                {mp ? mp.label : ""}
              </div>
            );
          })}
        </div>

        {/* Day rows */}
        {Array.from({ length: NUM_DAYS }, (_, row) => (
          <div key={row} style={{ display: "flex", marginBottom: row < NUM_DAYS - 1 ? CELL_GAP : 0 }}>
            {weeks.map((week, col) => {
              const cell = week[row];
              const isEmpty = !cell?.date;
              const count   = cell?.count  ?? 0;
              const isToday = cell?.today ?? false;
              const colorIdx = count === 0 ? 0 : Math.min(count, CELL_COLORS.length - 1);
              return (
                <div
                  key={col}
                  title={cell?.label}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    flexShrink: 0,
                    borderRadius: Math.max(2, Math.floor(cellSize / 4)),
                    marginRight: col < visibleWeeks - 1 ? CELL_GAP : 0,
                    background: isEmpty ? "transparent" : CELL_COLORS[colorIdx],
                    outline: "none",
                    outlineOffset: 0,
                    boxShadow: isToday
                      ? count > 0
                        ? "0 0 0 2px #0991B2, 0 0 6px rgba(9,145,178,0.5)"
                        : "0 0 0 2px #0991B2"
                      : undefined,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-[10px] text-[#9CA3AF] mr-0.5">Less</span>
        {CELL_COLORS.map((bg, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              flexShrink: 0,
              borderRadius: 2,
              background: bg,
              border: "1px solid rgba(0,0,0,0.04)",
            }}
          />
        ))}
        <span className="text-[10px] text-[#9CA3AF] ml-0.5">More</span>
      </div>


    </div>
  );
}
