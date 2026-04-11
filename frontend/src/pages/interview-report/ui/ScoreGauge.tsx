export function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(1, Math.max(0, score / 100));
  const r = 60, cx = 80, cy = 80;
  const circumference = Math.PI * r;
  const dashOffset = circumference * (1 - pct);
  const color = score >= 90 ? "#059669" : score >= 70 ? "#0991B2" : score >= 50 ? "#D97706" : "#DC2626";

  return (
    <svg viewBox="0 0 160 90" className="w-full max-w-[160px] mx-auto">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#F3F4F6" strokeWidth="12" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${circumference}`} strokeDashoffset={dashOffset} style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="28" fontWeight="900" fill="#0A0A0A">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#9CA3AF">/ 100</text>
    </svg>
  );
}
