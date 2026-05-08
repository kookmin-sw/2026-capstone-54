import { useEffect, useRef, useState } from "react";
import { GRADE_BADGE, getGrade } from "./constants";

export function ScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedPct, setAnimatedPct] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    const start = performance.now();
    const duration = 1100;
    const target = Math.min(100, Math.max(0, score));

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * target));
      setAnimatedPct(eased * target);
      if (progress < 1) rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [score]);

  const grade = getGrade(score);
  const badge = GRADE_BADGE[grade] ?? GRADE_BADGE.Average;

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <div
        className="w-[120px] h-[120px] rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(#0891B2 0% ${animatedPct}%, #E5E7EB ${animatedPct}% 100%)`,
        }}
      >
        <div className="w-[92px] h-[92px] rounded-full bg-white flex flex-col items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,.08)]">
          <span className="text-[32px] font-bold text-[#0891B2] tabular-nums">{animatedScore}</span>
          <span className="text-[12px] text-[#9CA3AF] -mt-0.5">/ 100</span>
        </div>
      </div>
      <span className={`absolute -top-1 -right-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    </div>
  );
}
