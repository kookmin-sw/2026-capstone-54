import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { interviewApi } from "@/features/interview-session";
import type { InterviewSessionListItem } from "@/features/interview-session";

const SESSION_TYPE_LABEL: Record<string, string> = {
  followup: "꼬리질문",
  full_process: "전체 프로세스",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  friendly: "편안한",
  normal: "일반",
  pressure: "압박",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

interface RecentSessionsProps {
  revealed: boolean;
}

export function RecentSessions({ revealed }: RecentSessionsProps) {
  const [sessions, setSessions] = useState<InterviewSessionListItem[]>([]);

  useEffect(() => {
    interviewApi.getMyInterviews(1).then((data) => {
      const completed = data.results
        .filter((s) => s.interviewSessionStatus === "completed")
        .slice(0, 3);
      setSessions(completed);
    }).catch(() => {});
  }, []);

  return (
    <>
      <div className={`hp-sec-head hp-rv${revealed ? " hp-rv-in" : ""}`} style={{ transitionDelay: "275ms" }}>
        <div className="hp-sec-title">최근 면접 기록</div>
        <Link to="/interview/results" className="hp-sec-link">전체 보기 →</Link>
      </div>
      <div className="hp-session-list">
        {sessions.length === 0 ? (
          <p className="text-[13px] text-[#9CA3AF] py-2">아직 완료된 면접이 없어요</p>
        ) : (
          sessions.map((session, i) => (
            <Link
              key={session.uuid}
              to={`/interview/session/${session.uuid}/report`}
              className={`hp-session-item hp-rv${revealed ? " hp-rv-in" : ""}`}
              style={{ transitionDelay: `${330 + i * 55}ms` }}
            >
              <div className="hp-si-body">
                <div className="hp-si-company">
                  {session.jobDescriptionLabel}
                  <span className="hp-badge" style={{ fontSize: 10 }}>
                    {SESSION_TYPE_LABEL[session.interviewSessionType] ?? session.interviewSessionType}
                  </span>
                </div>
                <div className="hp-si-meta">
                  {session.resumeTitle} · {DIFFICULTY_LABEL[session.interviewDifficultyLevel] ?? session.interviewDifficultyLevel} · {formatDate(session.createdAt)}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
