interface StreakCalendarProps {
  streakData: number[];
  revealed: boolean;
}

export function StreakCalendar({ streakData, revealed }: StreakCalendarProps) {
  return (
    <div
      className={`hp-card-white hp-rv${revealed ? " hp-rv-in" : ""}`}
      style={{ padding: 20, transitionDelay: "495ms" }}
    >
      <div className="hp-sec-head" style={{ marginBottom: 12 }}>
        <div className="hp-sec-title" style={{ fontSize: 13 }}>🔥 이번 달 스트릭</div>
        <span className="hp-badge" style={{ fontSize: 10 }}>3월</span>
      </div>
      <div className="hp-streak-cal">
        {streakData.map((v, i) => (
          <div key={i} className={`hp-sc-day hp-sc-${v}`} />
        ))}
      </div>
      <div className="hp-sc-days-label" style={{ marginTop: 6 }}>
        {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
          <span key={d} className="hp-sc-dl">{d}</span>
        ))}
      </div>
    </div>
  );
}
