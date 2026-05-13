import { useState } from "react";
import { resumeSectionsApi, useResumeSectionMutation, type ResumeJobCategory } from "@/features/resume";
import { EditableSection } from "./EditableSection";

const CATEGORY_OPTIONS = [
  "IT/개발", "마케팅", "디자인", "영업", "재무/회계",
  "인사", "기획", "CS", "디지털 마케팅", "기타",
];

interface Props {
  resumeUuid: string;
  value: ResumeJobCategory | null;
  onChange: (next: ResumeJobCategory | null) => void;
}

export function JobCategorySection({ resumeUuid, value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value?.name ?? "");
  const { isSaving, save } = useResumeSectionMutation<{ category: ResumeJobCategory | null }>();

  const handleSave = async () => {
    await save({
      mutator: () => resumeSectionsApi.putJobCategory(resumeUuid, draft),
      onSuccess: (res) => { onChange(res.category); setEditing(false); },
    });
  };

  return (
    <EditableSection
      title="직군"
      isEditing={editing}
      isSaving={isSaving}
      onEdit={() => { setDraft(value?.name ?? ""); setEditing(true); }}
      onCancel={() => setEditing(false)}
      onSave={handleSave}
      readView={
        <p className="text-[13px] text-[#374151]">
          {value ? `${value.emoji ?? ""} ${value.name}` : "(미설정)"}
        </p>
      }
      editView={
        <select
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="border border-[#E5E7EB] rounded px-2 py-1.5 text-[13px]"
        >
          <option value="">(미설정)</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      }
    />
  );
}
