import type { HomeStat } from "@/features/home/api/homeApi";

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
          <span className="hp-stat-icon">{stat.icon}</span>
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
