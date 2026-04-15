import { useState } from "react";
import { resumeSectionsApi, useResumeSectionMutation } from "@/features/resume";
import { EditableSection } from "./EditableSection";

interface Props {
  resumeUuid: string;
  value: string;
  onChange: (next: string) => void;
}

export function SummarySection({ resumeUuid, value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const { isSaving, save } = useResumeSectionMutation<unknown>();

  const handleSave = async () => {
    await save({
      mutator: () => resumeSectionsApi.putSummary(resumeUuid, draft),
      onSuccess: () => { onChange(draft); setEditing(false); },
    });
  };

  return (
    <EditableSection
      title="요약"
      isEditing={editing}
      isSaving={isSaving}
      onEdit={() => { setDraft(value); setEditing(true); }}
      onCancel={() => setEditing(false)}
      onSave={handleSave}
      readView={
        <p className="text-[13px] text-[#374151] leading-[1.6] whitespace-pre-wrap">
          {value || "(요약이 없습니다)"}
        </p>
      }
      editView={
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full border border-[#E5E7EB] rounded p-2 text-[13px] leading-[1.6]"
          placeholder="한국어 1-2 문장 경력 요약"
        />
      }
    />
  );
}
