/** 직업별 이력서 템플릿을 선택하는 컴포넌트. 백엔드 API에서 템플릿을 불러온다. */
import { useEffect, useState } from "react";
import { Loader2, Lightbulb } from "lucide-react";
import { resumeTemplatesApi, type ResumeTemplateListItem } from "@/features/resume";

interface ResumeTemplatePickerProps {
  onSelect: (content: string) => void;
}

export function ResumeTemplatePicker({ onSelect }: ResumeTemplatePickerProps) {
  const [templates, setTemplates] = useState<ResumeTemplateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    resumeTemplatesApi.list()
      .then((data) => setTemplates(data))
      .catch(() => setTemplates([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelect = async (uuid: string) => {
    try {
      const detail = await resumeTemplatesApi.retrieve(uuid);
      onSelect(detail.content);
    } catch { /* ignore */ }
  };

  if (isLoading) {
    return (
      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 flex items-center gap-2 text-[12px] text-[#6B7280]">
        <Loader2 size={12} className="animate-spin" /> 템플릿을 불러오는 중...
      </div>
    );
  }

  if (templates.length === 0) return null;

  // 카테고리별 그룹화
  const byCategory = templates.reduce<Record<string, ResumeTemplateListItem[]>>((acc, t) => {
    const key = t.job.category ?? "기타";
    (acc[key] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-[#D97706]" />
          <span className="text-[13px] font-bold text-[#0A0A0A]">빠른 템플릿으로 시작하기</span>
        </div>
        <span className="text-[11px] text-[#6B7280]">{expanded ? "접기" : "펼치기"}</span>
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 max-h-[300px] overflow-y-auto">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category}>
              <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-1.5">{category}</div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((t) => (
                  <button
                    key={t.uuid}
                    onClick={() => handleSelect(t.uuid)}
                    className="text-[11px] font-semibold text-[#0991B2] bg-white border border-[#E5E7EB] rounded-full px-3 py-1 hover:border-[#0991B2] hover:bg-[#E6F7FA] transition-colors"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
