/** 직군별로 그룹핑된 템플릿 카드 그리드. loading / error / empty 상태 포함. */

import { Loader2 } from "lucide-react";
import { Alert, Button, Spinner } from "@/shared/ui";
import type { ResumeTemplateListItem } from "@/features/resume";

interface TemplatePickerListProps {
  loading: boolean;
  error: string | null;
  templates: ResumeTemplateListItem[];
  groupedTemplates: [string, ResumeTemplateListItem[]][];
  debouncedSearch: string;
  pickerLoadingUuid: string | null;
  onPick: (template: ResumeTemplateListItem) => void;
  onRetry: () => void;
}

export function TemplatePickerList({
  loading,
  error,
  templates,
  groupedTemplates,
  debouncedSearch,
  pickerLoadingUuid,
  onPick,
  onRetry,
}: TemplatePickerListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[13px] text-[#6B7280] gap-2">
        <Spinner size="md" />
        템플릿을 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 flex flex-col items-center gap-3">
        <Alert variant="error">{error}</Alert>
        <Button type="button" variant="link" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-[13px] text-[#9CA3AF] py-12 text-center">
        {debouncedSearch
          ? `"${debouncedSearch}" 와 일치하는 템플릿이 없어요.`
          : "사용 가능한 템플릿이 없어요."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groupedTemplates.map(([category, items]) => (
        <section key={category}>
          <div className="text-[11px] font-bold tracking-wide uppercase text-[#0991B2] mb-2">
            {category}
          </div>
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            {items.map((t) => {
              const isLoading = pickerLoadingUuid === t.uuid;
              return (
                <button
                  key={t.uuid}
                  type="button"
                  onClick={() => onPick(t)}
                  disabled={pickerLoadingUuid !== null}
                  className="flex items-start gap-3 p-3 rounded-lg border border-[#E5E7EB] bg-white text-left transition-all hover:border-[#0991B2] hover:bg-[#F0FDFE] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#E6F7FA] flex items-center justify-center text-[14px] shrink-0">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-[#0A0A0A] truncate">{t.title}</div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5 truncate">{t.job.name}</div>
                  </div>
                  {isLoading && (
                    <Loader2 size={14} className="animate-spin text-[#0991B2] shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
