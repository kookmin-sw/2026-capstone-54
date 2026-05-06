import { useEffect, useRef, useState } from "react";

const GRADE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  Excellent: { bg: "bg-[#EDE9FE]", text: "text-[#7C3AED]", label: "Excellent" },
  Good: { bg: "bg-[#E6F7FA]", text: "text-[#0991B2]", label: "Good" },
  Average: { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", label: "Average" },
  "Below Average": { bg: "bg-[#FEE2E2]", text: "text-[#B91C1C]", label: "Below Avg" },
  Poor: { bg: "bg-[#FEE2E2]", text: "text-[#B91C1C]", label: "Poor" },
};

function getGrade(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  if (score >= 30) return "Below Average";
  return "Poor";
}

export function ScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedPct, setAnimatedPct] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 1100;
    const target = Math.min(100, Math.max(0, score));

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * target));
      setAnimatedPct(eased * target);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [score]);

  const grade = getGrade(score);
  const badge = GRADE_BADGE[grade] ?? GRADE_BADGE.Average;

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <div
        className="w-[92px] h-[92px] rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(#0991B2 0% ${animatedPct}%, #E5E7EB ${animatedPct}% 100%)`,
        }}
      >
        <div className="w-[70px] h-[70px] rounded-full bg-white flex flex-col items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,.08)]">
          <span className="text-[24px] font-bold text-[#0991B2] tabular-nums">{animatedScore}</span>
          <span className="text-[11px] text-[#9CA3AF] -mt-0.5">/ 100</span>
        </div>
      </div>
      <span className={`absolute -top-1 -right-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    </div>
  );
}
