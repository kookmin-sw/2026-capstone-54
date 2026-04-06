import { Link } from "react-router-dom";
import type { HomeJob } from "@/features/home/api/homeApi";

interface JobStatusProps {
  jobs: HomeJob[];
  revealed: boolean;
}

export function JobStatus({ jobs, revealed }: JobStatusProps) {
  return (
    <div
      className={`hp-card-white hp-rv${revealed ? " hp-rv-in" : ""}`}
      style={{ padding: 20, transitionDelay: "550ms" }}
    >
      <div className="hp-sec-head" style={{ marginBottom: 12 }}>
        <div className="hp-sec-title" style={{ fontSize: 13 }}>📋 지원 현황</div>
        <Link to="/jd" className="hp-sec-link">관리 →</Link>
      </div>
      {jobs.map((job) => (
        <div key={job.id} className="hp-job-item">
          <div className={`hp-job-dot hp-jd-${job.dotColor}`} />
          <div className="hp-job-body">
            <div className="hp-job-name">{job.company} — {job.role}</div>
            <div className="hp-job-sub">{job.stage}</div>
          </div>
          <div className="hp-job-dday">D-{job.dday}</div>
        </div>
      ))}
      <div style={{ marginTop: 14 }}>
        <Link
          to="/interview/setup"
          className="hp-btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          면접 시작하기 →
        </Link>
      </div>
    </div>
  );
}
