import { X } from "lucide-react";
import { useAchievementsStore } from "../model/store";
import { SelectFilter } from "@/shared/ui/SelectFilter";

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

  const hasActiveFilters =
    filters.category !== null || filters.status !== null || filters.rewardClaim !== null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <SelectFilter
        value={filters.category ?? ""}
        options={CATEGORY_OPTIONS}
        onChange={(v) => setFilters({ category: v || null })}
      />
      <div className="w-px h-4 bg-[#E5E7EB]" />
      <SelectFilter
        value={filters.status ?? ""}
        options={STATUS_OPTIONS}
        onChange={(v) => setFilters({ status: v || null })}
      />
      <div className="w-px h-4 bg-[#E5E7EB]" />
      <SelectFilter
        value={filters.rewardClaim ?? ""}
        options={REWARD_CLAIM_OPTIONS}
        onChange={(v) => setFilters({ rewardClaim: v || null })}
      />
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
