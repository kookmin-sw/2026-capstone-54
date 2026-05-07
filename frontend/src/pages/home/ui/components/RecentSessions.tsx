import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart2, ClipboardList } from "lucide-react";
import { interviewApi, SESSION_TYPE_LABEL, DIFFICULTY_LABEL } from "@/features/interview-session";
import type { InterviewSessionListItem } from "@/features/interview-session";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewApi.getMyInterviews(1).then((data) => {
      setSessions(data.results.filter((s) => s.interviewSessionStatus === "completed").slice(0, 3));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div
      className={`hp-card-white hp-rv${revealed ? " hp-rv-in" : ""}`}
      style={{ padding: 20, transitionDelay: "275ms", marginBottom: 16 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-[16px] font-bold text-[#0A0A0A]">최근 면접 기록</h3>
        <Link to="/interview/results" className="text-[12px] text-[#0991B2] ml-auto">전체 보기 →</Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[52px] rounded-lg bg-[#F3F4F6] animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-[13px] text-[#9CA3AF] py-2">아직 완료된 면접이 없어요</p>
      ) : (
        sessions.map((session, i) => (
          <Link
            key={session.uuid}
            to={`/interview/session/${session.uuid}/report`}
            className={`hp-job-item no-underline hp-rv${revealed ? " hp-rv-in" : ""}`}
            style={{ transitionDelay: `${330 + i * 55}ms`, color: "inherit" }}
          >
            <div className="w-7 h-7 shrink-0 flex items-center justify-center">
              {session.reportStatus === "completed"
                ? <BarChart2 size={16} className="text-[#0991B2]" />
                : <ClipboardList size={16} className="text-[#9CA3AF]" />}
            </div>
            <div className="hp-job-body">
              <div className="hp-job-name flex items-center gap-1.5">
                {session.jobDescriptionLabel}
                <span className="hp-badge" style={{ fontSize: 10 }}>
                  {SESSION_TYPE_LABEL[session.interviewSessionType] ?? session.interviewSessionType}
                </span>
              </div>
              <div className="hp-job-sub">
                {session.resumeTitle} · {DIFFICULTY_LABEL[session.interviewDifficultyLevel] ?? session.interviewDifficultyLevel} · {formatDate(session.createdAt)}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
