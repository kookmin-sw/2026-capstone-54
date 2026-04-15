import { useState } from "react";
import {
  resumeSectionsApi,
  useResumeSectionMutation,
  type ParsedSkillGroup,
} from "@/features/resume";
import { EditableSection } from "./EditableSection";

interface Props {
  resumeUuid: string;
  value: ParsedSkillGroup;
  onChange: (next: ParsedSkillGroup) => void;
}

const GROUPS: { key: keyof ParsedSkillGroup; label: string }[] = [
  { key: "technical", label: "기술" },
  { key: "soft", label: "소프트" },
  { key: "tools", label: "도구" },
  { key: "languages", label: "언어" },
];

const toCsv = (arr?: string[]) => (arr ?? []).join(", ");
const fromCsv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function SkillsSection({ resumeUuid, value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ParsedSkillGroup>(value);
  const { isSaving, save } = useResumeSectionMutation<unknown>();

  const handleSave = async () => {
    await save({
      mutator: () => resumeSectionsApi.putSkills(resumeUuid, draft),
      onSuccess: () => { onChange(draft); setEditing(false); },
    });
  };

  return (
    <EditableSection
      title="스킬"
      isEditing={editing}
      isSaving={isSaving}
      onEdit={() => { setDraft(value); setEditing(true); }}
      onCancel={() => setEditing(false)}
      onSave={handleSave}
      readView={
        <div className="flex flex-col gap-2">
          {GROUPS.map(({ key, label }) => {
            const arr = (value[key] ?? []) as string[];
            if (arr.length === 0) return null;
            return (
              <div key={key} className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-[#6B7280] w-12">{label}</span>
                {arr.map((s, i) => (
                  <span key={`${s}-${i}`} className="text-[11px] font-semibold text-[#0991B2] bg-[#E6F7FA] border border-[rgba(9,145,178,.2)] rounded-full px-2 py-0.5">
                    {s}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      }
      editView={
        <div className="grid grid-cols-1 gap-2">
          {GROUPS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#6B7280] w-14">{label}</span>
              <input
                value={toCsv(draft[key] as string[])}
                onChange={(e) => setDraft({ ...draft, [key]: fromCsv(e.target.value) })}
                placeholder={`${label} (콤마 구분)`}
                className="flex-1 border border-[#E5E7EB] rounded px-2 py-1.5 text-[13px]"
              />
            </label>
          ))}
        </div>
      }
    />
  );
}
