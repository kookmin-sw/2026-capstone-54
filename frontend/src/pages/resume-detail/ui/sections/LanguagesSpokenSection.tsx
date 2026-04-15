import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  resumeSectionsApi,
  useResumeSectionMutation,
  type ParsedLanguage,
} from "@/features/resume";

interface Props {
  resumeUuid: string;
  items: ParsedLanguage[];
  onChange: (next: ParsedLanguage[]) => void;
}

const EMPTY: ParsedLanguage = { language: "", level: "" };

export function LanguagesSpokenSection({ resumeUuid, items, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ParsedLanguage>(EMPTY);
  const { isSaving, save } = useResumeSectionMutation<ParsedLanguage>();

  const handleSave = async () => {
    const isUpdate = editingIndex! < items.length;
    const target = isUpdate ? items[editingIndex!] : null;
    await save({
      mutator: async () => {
        if (isUpdate && target?.uuid) {
          return resumeSectionsApi.updateLanguageSpoken(resumeUuid, target.uuid, {
            language: draft.language, level: draft.level,
          }) as unknown as Promise<ParsedLanguage>;
        }
        return resumeSectionsApi.addLanguageSpoken(resumeUuid, {
          language: draft.language, level: draft.level, displayOrder: items.length,
        } as never) as unknown as Promise<ParsedLanguage>;
      },
      onSuccess: (saved) => {
        const next = [...items];
        if (isUpdate) next[editingIndex!] = saved; else next.push(saved);
        onChange(next);
        setEditingIndex(null);
      },
    });
  };

  const handleDelete = async (item: ParsedLanguage) => {
    if (!item.uuid) return;
    await resumeSectionsApi.deleteLanguageSpoken(resumeUuid, item.uuid);
    onChange(items.filter((it) => it.uuid !== item.uuid));
  };

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-extrabold text-[#0A0A0A]">구사 언어</h2>
        <button onClick={() => { setDraft(EMPTY); setEditingIndex(items.length); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0991B2]">
          <Plus size={12} /> 추가
        </button>
      </header>
      <ul className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <li key={item.uuid ?? i} className="group">
            {editingIndex === i ? (
              <Form draft={draft} setDraft={setDraft} isSaving={isSaving} onSave={handleSave} onCancel={() => setEditingIndex(null)} />
            ) : (
              <span className="inline-flex items-center gap-1 text-[12px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-full px-2 py-0.5">
                {item.language} · {item.level}
                <button onClick={() => { setDraft({ ...item }); setEditingIndex(i); }} className="text-[#0991B2] ml-1">편집</button>
                <button onClick={() => handleDelete(item)} className="text-[#DC2626]"><Trash2 size={10} /></button>
              </span>
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
  draft: ParsedLanguage;
  setDraft: (v: ParsedLanguage) => void;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-[#F9FAFB] rounded p-2 flex gap-2 items-center">
      <input placeholder="언어" value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} className="border border-[#E5E7EB] rounded px-2 py-1 text-[12px] w-24" />
      <input placeholder="수준" value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value })} className="border border-[#E5E7EB] rounded px-2 py-1 text-[12px] w-32" />
      <button onClick={onSave} disabled={isSaving} className="text-[11px] font-bold text-white bg-[#0991B2] rounded px-2 py-1 disabled:opacity-50 inline-flex items-center gap-1">
        {isSaving && <Loader2 size={10} className="animate-spin" />} 저장
      </button>
      <button onClick={onCancel} className="text-[11px] text-[#6B7280]">취소</button>
    </div>
  );
}
