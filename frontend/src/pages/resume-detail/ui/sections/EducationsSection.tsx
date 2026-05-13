import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  resumeSectionsApi,
  useResumeSectionMutation,
  type ParsedEducation,
} from "@/features/resume";

interface Props {
  resumeUuid: string;
  items: ParsedEducation[];
  onChange: (next: ParsedEducation[]) => void;
}

const EMPTY: ParsedEducation = { school: "", degree: "", major: "", period: "" };

export function EducationsSection({ resumeUuid, items, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ParsedEducation>(EMPTY);
  const { isSaving, save } = useResumeSectionMutation<ParsedEducation>();

  const handleSave = async () => {
    const isUpdate = editingIndex! < items.length;
    const target = isUpdate ? items[editingIndex!] : null;
    await save({
      mutator: async () => {
        if (isUpdate && target?.uuid) {
          return resumeSectionsApi.updateEducation(resumeUuid, target.uuid, {
            school: draft.school, degree: draft.degree, major: draft.major, period: draft.period,
          }) as unknown as Promise<ParsedEducation>;
        }
        return resumeSectionsApi.addEducation(resumeUuid, {
          school: draft.school, degree: draft.degree, major: draft.major, period: draft.period,
          displayOrder: items.length,
        } as never) as unknown as Promise<ParsedEducation>;
      },
      onSuccess: (saved) => {
        const next = [...items];
        if (isUpdate) next[editingIndex!] = saved; else next.push(saved);
        onChange(next);
        setEditingIndex(null);
      },
    });
  };

  const handleDelete = async (item: ParsedEducation) => {
    if (!item.uuid) return;
    await resumeSectionsApi.deleteEducation(resumeUuid, item.uuid);
    onChange(items.filter((it) => it.uuid !== item.uuid));
  };

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-extrabold text-[#0A0A0A]">학력</h2>
        <button onClick={() => { setDraft(EMPTY); setEditingIndex(items.length); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0991B2]">
          <Plus size={12} /> 추가
        </button>
      </header>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={item.uuid ?? i} className="group">
            {editingIndex === i ? (
              <Form draft={draft} setDraft={setDraft} isSaving={isSaving} onSave={handleSave} onCancel={() => setEditingIndex(null)} />
            ) : (
              <div className="flex items-start justify-between text-[13px]">
                <div>
                  <strong className="text-[#0A0A0A]">{item.school}</strong>
                  {item.major && <> · {item.major}</>}
                  {item.degree && <> · {item.degree}</>}
                  {item.period && <span className="text-[#6B7280]"> · {item.period}</span>}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => { setDraft({ ...item }); setEditingIndex(i); }} className="text-[11px] text-[#0991B2]">편집</button>
                  <button onClick={() => handleDelete(item)} className="text-[11px] text-[#DC2626]"><Trash2 size={12} /></button>
                </div>
              </div>
            )}
          </li>
        ))}
        {editingIndex === items.length && (
          <li><Form draft={draft} setDraft={setDraft} isSaving={isSaving} onSave={handleSave} onCancel={() => setEditingIndex(null)} /></li>
        )}
      </ul>
    </section>
  );
}

function Form({ draft, setDraft, isSaving, onSave, onCancel }: {
  draft: ParsedEducation;
  setDraft: (v: ParsedEducation) => void;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-[#F9FAFB] rounded p-3 grid grid-cols-2 gap-2">
      <input placeholder="학교" value={draft.school} onChange={(e) => setDraft({ ...draft, school: e.target.value })} className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]" />
      <input placeholder="전공" value={draft.major} onChange={(e) => setDraft({ ...draft, major: e.target.value })} className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]" />
      <input placeholder="학위 (학사/석사/박사)" value={draft.degree} onChange={(e) => setDraft({ ...draft, degree: e.target.value })} className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]" />
      <input placeholder="기간" value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value })} className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]" />
      <div className="col-span-2 flex gap-2">
        <button onClick={onSave} disabled={isSaving} className="text-[11px] font-bold text-white bg-[#0991B2] rounded px-3 py-1.5 disabled:opacity-50 inline-flex items-center gap-1">
          {isSaving && <Loader2 size={12} className="animate-spin" />} 저장
        </button>
        <button onClick={onCancel} className="text-[11px] text-[#6B7280]">취소</button>
      </div>
    </div>
  );
}
