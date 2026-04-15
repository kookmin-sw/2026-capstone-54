import { useState } from "react";
import {
  resumeSectionsApi,
  useResumeSectionMutation,
  type ParsedBasicInfo,
} from "@/features/resume";
import { EditableSection } from "./EditableSection";

interface Props {
  resumeUuid: string;
  value: ParsedBasicInfo;
  onChange: (next: ParsedBasicInfo) => void;
}

export function BasicInfoSection({ resumeUuid, value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ParsedBasicInfo>(value);
  const { isSaving, save } = useResumeSectionMutation<ParsedBasicInfo>();

  const handleSave = async () => {
    await save({
      mutator: async () => {
        const row = await resumeSectionsApi.putBasicInfo(resumeUuid, {
          name: draft.name ?? "",
          email: draft.email ?? "",
          phone: draft.phone ?? "",
          location: draft.location ?? "",
        });
        return row;
      },
      onSuccess: () => {
        onChange(draft);
        setEditing(false);
      },
    });
  };

  return (
    <EditableSection
      title="기본 정보"
      isEditing={editing}
      isSaving={isSaving}
      onEdit={() => { setDraft(value); setEditing(true); }}
      onCancel={() => setEditing(false)}
      onSave={handleSave}
      readView={
        <dl className="grid grid-cols-2 gap-y-2 text-[13px]">
          <Field label="이름" value={value.name} />
          <Field label="이메일" value={value.email} />
          <Field label="전화" value={value.phone} />
          <Field label="지역" value={value.location} />
        </dl>
      }
      editView={
        <div className="grid grid-cols-2 gap-3">
          <Input label="이름" value={draft.name ?? ""} onChange={(v) => setDraft({ ...draft, name: v })} />
          <Input label="이메일" value={draft.email ?? ""} onChange={(v) => setDraft({ ...draft, email: v })} />
          <Input label="전화" value={draft.phone ?? ""} onChange={(v) => setDraft({ ...draft, phone: v })} />
          <Input label="지역" value={draft.location ?? ""} onChange={(v) => setDraft({ ...draft, location: v })} />
        </div>
      }
    />
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <>
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="text-[#0A0A0A]">{value || "-"}</dd>
    </>
  );
}

function Input({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-[#6B7280]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-[#E5E7EB] rounded px-2 py-1.5 text-[13px]"
      />
    </label>
  );
}
