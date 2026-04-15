import { useState } from "react";
import { resumeSectionsApi, useResumeSectionMutation } from "@/features/resume";
import { EditableSection } from "./EditableSection";

interface Props {
  resumeUuid: string;
  value: string[];
  onChange: (next: string[]) => void;
}

export function IndustryDomainsSection({ resumeUuid, value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState((value ?? []).join(", "));
  const { isSaving, save } = useResumeSectionMutation<unknown>();

  const handleSave = async () => {
    const arr = draft.split(",").map((s) => s.trim()).filter(Boolean);
    await save({
      mutator: () => resumeSectionsApi.putIndustryDomains(resumeUuid, arr),
      onSuccess: () => { onChange(arr); setEditing(false); },
    });
  };

  return (
    <EditableSection
      title="산업 도메인"
      isEditing={editing}
      isSaving={isSaving}
      onEdit={() => { setDraft((value ?? []).join(", ")); setEditing(true); }}
      onCancel={() => setEditing(false)}
      onSave={handleSave}
      readView={
        <div className="flex flex-wrap gap-1.5">
          {(value ?? []).length > 0
            ? value.map((d, i) => (
              <span key={`${d}-${i}`} className="text-[11px] font-semibold text-[#374151] bg-[#F9FAFB] border border-[#E5E7EB] rounded-full px-2 py-0.5">{d}</span>
            ))
            : <span className="text-[12px] text-[#9CA3AF] italic">(없음)</span>}
        </div>
      }
      editView={
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="콤마로 구분 (예: 핀테크, 이커머스, 헬스케어)"
          className="w-full border border-[#E5E7EB] rounded px-2 py-1.5 text-[13px]"
        />
      }
    />
  );
}
