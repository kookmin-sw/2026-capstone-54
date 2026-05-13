import { useState } from "react";
import { resumeSectionsApi, useResumeSectionMutation } from "@/features/resume";
import { EditableSection } from "./EditableSection";

interface Props {
  resumeUuid: string;
  years: number | null;
  months: number | null;
  onChange: (years: number | null, months: number | null) => void;
}

const parseIntOrNull = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

export function CareerMetaSection({ resumeUuid, years, months, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [yearDraft, setYearDraft] = useState<string>(years != null ? String(years) : "");
  const [monthDraft, setMonthDraft] = useState<string>(months != null ? String(months) : "");
  const { isSaving, save } = useResumeSectionMutation<unknown>();

  const handleSave = async () => {
    const nextYears = parseIntOrNull(yearDraft);
    const nextMonths = parseIntOrNull(monthDraft);
    if (nextMonths != null && (nextMonths < 0 || nextMonths > 11)) return;
    await save({
      mutator: () => resumeSectionsApi.putCareerMeta(resumeUuid, nextYears, nextMonths),
      onSuccess: () => { onChange(nextYears, nextMonths); setEditing(false); },
    });
  };

  const readLabel =
    years != null || months != null
      ? `${years ?? 0}년 ${months ?? 0}개월`
      : "(미입력)";

  return (
    <EditableSection
      title="총 경력"
      isEditing={editing}
      isSaving={isSaving}
      onEdit={() => {
        setYearDraft(years != null ? String(years) : "");
        setMonthDraft(months != null ? String(months) : "");
        setEditing(true);
      }}
      onCancel={() => setEditing(false)}
      onSave={handleSave}
      readView={<p className="text-[13px] text-[#374151]">{readLabel}</p>}
      editView={
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={yearDraft}
            onChange={(e) => setYearDraft(e.target.value)}
            className="border border-[#E5E7EB] rounded px-2 py-1.5 text-[13px] w-20"
            placeholder="년"
          />
          <span className="text-[12px] text-[#6B7280]">년</span>
          <input
            type="number"
            min={0}
            max={11}
            value={monthDraft}
            onChange={(e) => setMonthDraft(e.target.value)}
            className="border border-[#E5E7EB] rounded px-2 py-1.5 text-[13px] w-20"
            placeholder="개월"
          />
          <span className="text-[12px] text-[#6B7280]">개월</span>
        </div>
      }
    />
  );
}
