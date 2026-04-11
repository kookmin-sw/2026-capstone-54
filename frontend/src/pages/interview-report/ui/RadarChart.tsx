import type { InterviewCategoryScore } from "@/features/interview-session";

export function RadarChart({ scores }: { scores: InterviewCategoryScore[] }) {
  if (scores.length < 3) return null;
  const cx = 120, cy = 120, r = 80, n = scores.length;

  const toXY = (i: number, pct: number) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + r * pct * Math.cos(a), y: cy + r * pct * Math.sin(a) };
  };

  const labelXY = (i: number) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    const dist = r + 24;
    return { x: cx + dist * Math.cos(a), y: cy + dist * Math.sin(a) };
  };

  const axes = scores.map((_, i) => {
    const p = toXY(i, 1);
    return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E5E7EB" strokeWidth="1" />;
  });

  const webs = [0.33, 0.66, 1].map((pct) => {
    const pts = scores.map((_, i) => { const p = toXY(i, pct); return `${p.x},${p.y}`; }).join(" ");
    return <polygon key={pct} points={pts} fill="none" stroke="#E5E7EB" strokeWidth="1" />;
  });

  const dataPoints = scores.map((s, i) => { const p = toXY(i, s.score / 100); return `${p.x},${p.y}`; }).join(" ");

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[240px] mx-auto">
      {webs}{axes}
      <polygon points={dataPoints} fill="#0991B2" fillOpacity="0.18" stroke="#0991B2" strokeWidth="2" />
      {scores.map((s, i) => { const p = toXY(i, s.score / 100); return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#0991B2" />; })}
      {scores.map((s, i) => {
        const { x, y } = labelXY(i);
        const anchor = x < cx - 5 ? "end" : x > cx + 5 ? "start" : "middle";
        return <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize="10" fontWeight="600" fill="#374151">{s.category}</text>;
      })}
    </svg>
  );
}
