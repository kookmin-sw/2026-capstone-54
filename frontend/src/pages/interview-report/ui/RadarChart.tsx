import type { InterviewCategoryScore } from "@/features/interview-session";

export function RadarChart({ scores }: { scores: InterviewCategoryScore[] }) {
  if (scores.length < 3) return null;
  const cx = 105, cy = 105, r = 72, n = scores.length;

  const toXY = (i: number, pct: number) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + r * pct * Math.cos(a), y: cy + r * pct * Math.sin(a) };
  };

  const labelXY = (i: number) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    const dist = r + 22;
    return { x: cx + dist * Math.cos(a), y: cy + dist * Math.sin(a) };
  };

  const axes = scores.map((_, i) => {
    const p = toXY(i, 1);
    return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(0,0,0,.06)" strokeWidth="1" />;
  });

  const webs = [0.25, 0.5, 0.75, 1].map((pct) => {
    const pts = scores.map((_, i) => { const p = toXY(i, pct); return `${p.x},${p.y}`; }).join(" ");
    return <polygon key={pct} points={pts} fill="none" stroke="rgba(0,0,0,.06)" strokeWidth="1" />;
  });

  const dataPoints = scores.map((s, i) => { const p = toXY(i, s.score / 100); return `${p.x},${p.y}`; }).join(" ");

  return (
    <svg viewBox="0 0 210 210" className="w-full max-w-[210px] mx-auto">
      {webs}{axes}
      <polygon points={dataPoints} fill="rgba(9,145,178,.1)" stroke="#0991B2" strokeWidth="1.5" />
      {scores.map((s, i) => {
        const p = toXY(i, s.score / 100);
        return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#0991B2" stroke="#fff" strokeWidth="2" />;
      })}
      {scores.map((s, i) => {
        const { x, y } = labelXY(i);
        const anchor = x < cx - 5 ? "end" : x > cx + 5 ? "start" : "middle";
        return (
          <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle"
            fontSize="10" fontWeight="500" fill="#9CA3AF">
            {s.category}
          </text>
        );
      })}
    </svg>
  );
}
