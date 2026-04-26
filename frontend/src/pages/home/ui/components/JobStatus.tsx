import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { useJdListStore } from "@/features/jd";
import { CompanyIcon } from "@/shared/ui/CompanyIcon";

const STATUS_BADGE: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  planned:   { label: "지원 예정", dot: "bg-[#0991B2]", bg: "bg-[#E6F7FA]", text: "text-[#0991B2]" },
  applied:   { label: "지원 완료", dot: "bg-[#059669]", bg: "bg-[#ECFDF5]", text: "text-[#059669]" },
  saved:     { label: "관심 저장", dot: "bg-[#F59E0B]", bg: "bg-[#FEF3C7]", text: "text-[#D97706]" },
  analyzing: { label: "분석 중",   dot: "bg-[#9CA3AF]", bg: "bg-[#F3F4F6]", text: "text-[#6B7280]" },
};

interface JobStatusProps {
  revealed: boolean;
}

export function JobStatus({ revealed }: JobStatusProps) {
  const { items, isLoading, fetchList } = useJdListStore();

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const displayItems = items.slice(0, 3);

  return (
    <div
      className={`hp-card-white hp-rv${revealed ? " hp-rv-in" : ""}`}
      style={{ padding: 20, transitionDelay: "550ms" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-[#E6F7FA] flex items-center justify-center">
          <ClipboardList size={14} className="text-[#0991B2]" />
        </span>
        <h3 className="text-[14px] font-bold text-[#0A0A0A]">채용공고</h3>
        <Link to="/jd" className="text-[12px] text-[#0991B2] ml-auto">관리 →</Link>
      </div>

      {isLoading ? (
        <div className="text-[13px] text-[#9CA3AF] py-2">불러오는 중...</div>
      ) : displayItems.length === 0 ? (
        <div className="text-[13px] text-[#9CA3AF] py-2">등록된 채용공고가 없어요</div>
      ) : (
        displayItems.map((jd) => {
          const badge = STATUS_BADGE[jd.status] ?? STATUS_BADGE.analyzing;
          return (
            <Link key={jd.uuid} to={`/jd/${jd.uuid}`} className="hp-job-item no-underline">
              <div className="w-7 h-7 shrink-0">
                <CompanyIcon platform={jd.raw.jobDescription.platform} title={jd.title} size={16} />
              </div>
              <div className="hp-job-body">
                <div className="hp-job-name">{jd.company}</div>
                <div className="hp-job-sub">{jd.title}</div>
              </div>
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${badge.bg} ${badge.text}`}>
                {badge.label}
              </div>
            </Link>
          );
        })
      )}

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
