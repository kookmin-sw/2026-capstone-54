import { Medal } from "lucide-react";
import { useEffect } from "react";
import { useMilestoneStore } from "../model/milestoneStore";
import { MilestoneCard } from "./MilestoneCard";
import { MilestoneLoading } from "./MilestoneLoading";
import type { Milestone } from "../api/types";

interface MilestonesProps {
  /** 폴백 마일스톤 데이터 (API 실패 시 사용) */
  fallbackData?: Milestone[];
  revealed?: boolean;
}

export function Milestones({ fallbackData, revealed }: MilestonesProps) {
  const { data, loading, error, fetchMilestones, setFallbackData } = useMilestoneStore();

  useEffect(() => {
    if (fallbackData) {
      setFallbackData(fallbackData);
    }
    fetchMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) {
    return <MilestoneLoading revealed={revealed} />;
  }

  const displayData = data ?? fallbackData;

  if (error && !displayData) {
    return (
      <div
        className={`bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sk-rv${
          revealed ? " sk-rv-in" : ""
        }`}
        style={{ transitionDelay: "150ms" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="w-7 h-7 rounded-lg bg-[#FFF7ED] flex items-center justify-center">
            <Medal size={14} className="text-[#F97316]" />
          </span>
          <h3 className="text-[14px] font-bold text-[#0A0A0A]">마일스톤</h3>
        </div>
        <p className="text-sm text-[#9CA3AF]">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] sk-rv${
        revealed ? " sk-rv-in" : ""
      }`}
      style={{ transitionDelay: "150ms" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-7 h-7 rounded-lg bg-[#FFF7ED] flex items-center justify-center">
          <Medal size={14} className="text-[#F97316]" />
        </span>
        <h3 className="text-[14px] font-bold text-[#0A0A0A]">마일스톤</h3>
      </div>

      <div className="flex flex-col gap-2">
        {displayData?.map((ms) => (
          <MilestoneCard key={ms.id ?? ms.days} milestone={ms} />
        ))}
      </div>
    </div>
  );
}
