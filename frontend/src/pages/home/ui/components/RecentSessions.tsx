import type { HomeSession } from "@/features/home/api/homeApi";

interface RecentSessionsProps {
  sessions: HomeSession[];
  revealed: boolean;
}

export function RecentSessions({ sessions, revealed }: RecentSessionsProps) {
  return (
    <>
      <div className={`hp-sec-head hp-rv${revealed ? " hp-rv-in" : ""}`} style={{ transitionDelay: "275ms" }}>
        <div className="hp-sec-title">최근 면접 기록</div>
        <a className="hp-sec-link" href="#">전체 보기 →</a>
      </div>
      <div className="hp-session-list">
        {sessions.map((session, i) => (
          <a
            key={session.id}
            className={`hp-session-item hp-rv${revealed ? " hp-rv-in" : ""}`}
            style={{ transitionDelay: `${330 + i * 55}ms` }}
            href="#"
          >
            <div className="hp-si-icon">{session.icon}</div>
            <div className="hp-si-body">
              <div className="hp-si-company">
                {session.company}
                <span
                  className={`hp-badge${session.badgeType === "neutral" ? " hp-badge-neutral" : ""}`}
                  style={{ fontSize: 10 }}
                >
                  {session.badgeLabel}
                </span>
              </div>
              <div className="hp-si-meta">
                {session.role} · {session.round} · {session.date}
              </div>
            </div>
            <div className="hp-si-score">
              <div className="hp-si-num">{session.score}</div>
              <div className="hp-si-num-label">종합 점수</div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
