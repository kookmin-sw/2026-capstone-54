import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { JobCategory, Job } from "@/shared/api/profileApi";
import { CATEGORY_STYLE } from "@/shared/ui/categoryIconStyle";

function getCategoryIcon(id: number) {
  const { Icon, color } = CATEGORY_STYLE[id] ?? CATEGORY_STYLE[0];
  return <Icon size={16} className={color} />;
}

interface CategoryProps {
  categories: JobCategory[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

interface JobProps {
  jobs: Job[];
  loading: boolean;
  selectedIds: number[];
  onToggle: (id: number) => void;
}

interface JobCategorySelectorProps {
  categoryProps: CategoryProps;
  jobProps: JobProps;
}

export function JobCategorySelector({
  categoryProps,
  jobProps,
}: JobCategorySelectorProps) {
  const { categories, loading: categoriesLoading, selectedId: selectedCategoryId, onSelect: onSelectCategory } = categoryProps;
  const { jobs: availableJobs, loading: jobsLoading, selectedIds: selectedJobIds, onToggle: onToggleJob } = jobProps;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = categories.find((c) => c.id === selectedCategoryId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* 직군 드롭다운 */}
      <div className="flex flex-col gap-[5px]">
        <label className="font-plex-sans-kr text-[12px] font-bold text-[#0A0A0A] tracking-[0.1px] flex items-center gap-1">
          희망 직군 <span className="text-[#EF4444] text-[10px]">*</span>
        </label>

        {categoriesLoading ? (
          <div className="h-[42px] rounded-lg skeleton-shimmer" />
        ) : (
          <div ref={ref} className="relative">
            {/* 트리거 버튼 */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`w-full flex items-center justify-between gap-2 px-[14px] py-[10px] rounded-lg border-[1.5px] bg-white text-[14px] font-normal transition-all duration-150 ${
                open
                  ? "border-[#0991B2] shadow-[0_0_0_3px_rgba(9,145,178,0.1)]"
                  : "border-[#E5E7EB] hover:border-[#0991B2]"
              }`}
            >
              {selected ? (
                <span className="flex items-center gap-2 text-[#0A0A0A]">
                  {getCategoryIcon(selected.id)}
                  {selected.name}
                </span>
              ) : (
                <span className="text-[#9CA3AF]">직군을 선택하세요</span>
              )}
              <ChevronDown
                size={16}
                className={`text-[#9CA3AF] flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>

            {/* 드롭다운 목록 */}
            {open && (
              <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1)] overflow-hidden max-h-[300px] overflow-y-auto">
                {categories.map((cat) => {
                  const isSelected = cat.id === selectedCategoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { onSelectCategory(cat.id); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-[10px] text-left text-[14px] font-normal transition-colors duration-100 ${
                        isSelected
                          ? "bg-[#E6F7FA] text-[#0991B2]"
                          : "text-[#374151] hover:bg-[#F9FAFB]"
                      }`}
                    >
                      <span className="flex-shrink-0">{getCategoryIcon(cat.id)}</span>
                      <span className="flex-1">{cat.name}</span>
                      {isSelected && <Check size={14} className="text-[#0991B2] flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <p className="text-[11px] text-[#6B7280] leading-[1.45]">면접 질문 생성에 반영됩니다</p>
      </div>

      {/* 직업 다중 선택 */}
      {selectedCategoryId && (
        <div className="flex flex-col gap-[5px]">
          <label className="font-plex-sans-kr text-[12px] font-bold text-[#0A0A0A] tracking-[0.1px]">
            직업 선택{" "}
            <span className="text-[11px] font-normal text-[#6B7280]">(최대 3개 선택)</span>
          </label>

          {jobsLoading ? (
            <div className="grid grid-cols-2 gap-2 max-[640px]:grid-cols-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 rounded-lg skeleton-shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-[640px]:grid-cols-1">
              {availableJobs.map((job) => {
                const isSelected = selectedJobIds.includes(job.id);
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => onToggleJob(job.id)}
                    className={`flex items-center gap-2 text-left text-[14px] font-normal px-3 py-2 rounded-lg border-[1.5px] transition-all duration-150 ${
                      isSelected
                        ? "border-[#0991B2] bg-[#E6F7FA] text-[#0991B2]"
                        : "border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] hover:border-[#0991B2] hover:bg-white"
                    }`}
                  >
                    <Check
                      size={13}
                      className={`flex-shrink-0 transition-opacity duration-150 ${isSelected ? "opacity-100 text-[#0991B2]" : "opacity-0"}`}
                    />
                    {job.name}
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-[#6B7280] leading-[1.45]">면접 맥락 설정에 활용됩니다</p>
        </div>
      )}
    </div>
  );
}
