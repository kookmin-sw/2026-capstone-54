import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart2, ClipboardList } from "lucide-react";
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
            className={`hp-session-item hp-rv${revealed ? " hp-rv-in" : ""}`}
            style={{ transitionDelay: `${330 + i * 55}ms` }}
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0">
              {session.reportStatus === "completed"
                ? <BarChart2 size={16} className="text-[#0991B2]" />
                : <ClipboardList size={16} className="text-[#9CA3AF]" />}
            </div>
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
  );
}
