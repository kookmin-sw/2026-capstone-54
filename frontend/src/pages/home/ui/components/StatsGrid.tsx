import { Target, TrendingUp, Flame, Timer, BarChart2 } from "lucide-react";
import type { HomeStat } from "@/features/home/api/homeApi";

const ICON_MAP: Record<string, React.ReactNode> = {
  "target":      <Target      size={20} className="text-[#0991B2]" />,
  "trending-up": <TrendingUp  size={20} className="text-[#059669]" />,
  "flame":       <Flame       size={20} className="text-[#F97316]" />,
  "timer":       <Timer       size={20} className="text-[#8B5CF6]" />,
  "bar-chart":   <BarChart2   size={20} className="text-[#9CA3AF]" />,
};

interface StatsGridProps {
  stats: HomeStat[];
  revealed: boolean;
}

export function StatsGrid({ stats, revealed }: StatsGridProps) {
  return (
    <div className="hp-stats-grid">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`hp-stat-card hp-rv${revealed ? " hp-rv-in" : ""}`}
          style={{ transitionDelay: `${55 + i * 55}ms` }}
        >
          <span className="hp-stat-icon">
            {ICON_MAP[stat.icon] ?? <BarChart2 size={20} className="text-[#9CA3AF]" />}
          </span>
          <div className="hp-stat-num">
            {stat.value}
            {stat.unit && (
              <small style={{ fontSize: 14, opacity: 0.5 }}>{stat.unit}</small>
            )}
          </div>
          <div className="hp-stat-label">{stat.label}</div>
          <span
            className={`hp-stat-delta ${
              stat.deltaType === "up"
                ? "hp-delta-up"
                : stat.deltaType === "down"
                ? "hp-delta-dn"
                : "hp-delta-neutral"
            }`}
          >
            {stat.delta}
          </span>
        </div>
      ))}
    </div>
  );
}
