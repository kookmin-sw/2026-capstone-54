import { X } from "lucide-react";
import { useAchievementsStore } from "../model/store";

const CATEGORY_OPTIONS = [
  { value: "", label: "전체" },
  { value: "profile", label: "프로필" },
  { value: "interview", label: "면접" },
  { value: "streak", label: "스트릭" },
  { value: "activity", label: "활동" },
  { value: "other", label: "기타" },
];

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "achieved", label: "달성함" },
  { value: "unachieved", label: "미달성" },
];

const REWARD_CLAIM_OPTIONS = [
  { value: "", label: "전체" },
  { value: "claimed", label: "수령함" },
  { value: "unclaimed", label: "미수령" },
];

export function FilterUI() {
  const { filters, setFilters, clearFilters } = useAchievementsStore();

  const hasActiveFilters = filters.category || filters.status || filters.rewardClaim;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-semibold text-[#6B7280] whitespace-nowrap">카테고리</label>
        <select
          aria-label="카테고리 필터"
          value={filters.category ?? ""}
          onChange={(e) => setFilters({ category: e.target.value || null })}
          className="text-sm border border-[#E5E7EB] rounded-lg py-2 px-3 bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#0991B2]/30 focus:border-[#0991B2] transition-colors"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-semibold text-[#6B7280] whitespace-nowrap">달성 여부</label>
        <select
          aria-label="달성 여부 필터"
          value={filters.status ?? ""}
          onChange={(e) => setFilters({ status: e.target.value || null })}
          className="text-sm border border-[#E5E7EB] rounded-lg py-2 px-3 bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#0991B2]/30 focus:border-[#0991B2] transition-colors"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-semibold text-[#6B7280] whitespace-nowrap">보상 수령</label>
        <select
          aria-label="보상 수령 필터"
          value={filters.rewardClaim ?? ""}
          onChange={(e) => setFilters({ rewardClaim: e.target.value || null })}
          className="text-sm border border-[#E5E7EB] rounded-lg py-2 px-3 bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#0991B2]/30 focus:border-[#0991B2] transition-colors"
        >
          {REWARD_CLAIM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
        >
          <X size={14} />
          필터 초기화
        </button>
      )}
    </div>
  );
}
