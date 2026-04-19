import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
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
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-[#E6F7FA] flex items-center justify-center">
          <ClipboardList size={14} className="text-[#0991B2]" />
        </span>
        <h3 className="text-[14px] font-bold text-[#0A0A0A]">지원 현황</h3>
        <Link to="/jd" className="text-[12px] text-[#0991B2] ml-auto">관리 →</Link>
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
