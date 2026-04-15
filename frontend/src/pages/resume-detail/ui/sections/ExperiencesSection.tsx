import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  resumeSectionsApi,
  useResumeSectionMutation,
  type ParsedExperience,
} from "@/features/resume";

interface Props {
  resumeUuid: string;
  items: ParsedExperience[];
  onChange: (next: ParsedExperience[]) => void;
}

const EMPTY: ParsedExperience = {
  company: "", role: "", period: "", responsibilities: [], highlights: [],
};

export function ExperiencesSection({ resumeUuid, items, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ParsedExperience>(EMPTY);
  const { isSaving, save } = useResumeSectionMutation<ParsedExperience>();

  const handleAddNew = () => {
    setDraft(EMPTY);
    setEditingIndex(items.length);
  };

  const handleSave = async () => {
    const isUpdate = editingIndex! < items.length;
    const target = isUpdate ? items[editingIndex!] : null;

    await save({
      mutator: async () => {
        if (isUpdate && target?.uuid) {
          return resumeSectionsApi.updateExperience(resumeUuid, target.uuid, {
            company: draft.company, role: draft.role, period: draft.period,
            responsibilities: draft.responsibilities, highlights: draft.highlights,
          }) as unknown as Promise<ParsedExperience>;
        }
        return resumeSectionsApi.addExperience(resumeUuid, {
          company: draft.company, role: draft.role, period: draft.period,
          responsibilities: draft.responsibilities, highlights: draft.highlights,
          displayOrder: items.length,
        } as never) as unknown as Promise<ParsedExperience>;
      },
      onSuccess: (saved) => {
        const next = [...items];
        if (isUpdate) next[editingIndex!] = saved;
        else next.push(saved);
        onChange(next);
        setEditingIndex(null);
      },
    });
  };

  const handleDelete = async (item: ParsedExperience) => {
    if (!item.uuid) return;
    await resumeSectionsApi.deleteExperience(resumeUuid, item.uuid);
    onChange(items.filter((it) => it.uuid !== item.uuid));
  };

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-extrabold text-[#0A0A0A]">경력</h2>
        <button onClick={handleAddNew} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0991B2]">
          <Plus size={12} /> 추가
        </button>
      </header>
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={item.uuid ?? i} className="border-l-2 border-[#0991B2] pl-3 group">
            {editingIndex === i ? (
              <ItemForm
                draft={draft}
                setDraft={setDraft}
                isSaving={isSaving}
                onSave={handleSave}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[14px] font-bold text-[#0A0A0A]">{item.company}</span>
                    {item.role && (
                      <span className="text-[12px] font-semibold text-[#374151]">{item.role}</span>
                    )}
                  </div>
                  {item.period && (
                    <div className="text-[11px] text-[#6B7280] mt-0.5">{item.period}</div>
                  )}
                  {item.responsibilities?.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide mb-0.5">
                        주요 업무
                      </div>
                      <ul className="text-[12px] text-[#374151] leading-[1.5] space-y-0.5">
                        {item.responsibilities.map((r, j) => (
                          <li key={j}>• {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {item.highlights?.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[10px] font-bold text-[#0991B2] uppercase tracking-wide mb-0.5">
                        주요 성과
                      </div>
                      <ul className="text-[12px] text-[#374151] leading-[1.5] space-y-0.5">
                        {item.highlights.map((h, j) => (
                          <li key={j}>• {h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => { setDraft({ ...item }); setEditingIndex(i); }}
                    className="text-[11px] text-[#0991B2]"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="text-[11px] text-[#DC2626]"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {editingIndex === items.length && (
          <li>
            <ItemForm
              draft={draft}
              setDraft={setDraft}
              isSaving={isSaving}
              onSave={handleSave}
              onCancel={() => setEditingIndex(null)}
            />
          </li>
        )}
      </ul>
    </section>
  );
}

function ItemForm({
  draft, setDraft, isSaving, onSave, onCancel,
}: {
  draft: ParsedExperience;
  setDraft: (v: ParsedExperience) => void;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-[#F9FAFB] rounded p-3 flex flex-col gap-2">
      <input
        placeholder="회사명"
        value={draft.company}
        onChange={(e) => setDraft({ ...draft, company: e.target.value })}
        className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]"
      />
      <input
        placeholder="직함/직무"
        value={draft.role}
        onChange={(e) => setDraft({ ...draft, role: e.target.value })}
        className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]"
      />
      <input
        placeholder="기간 (예: 2022.03 - 2024.06)"
        value={draft.period}
        onChange={(e) => setDraft({ ...draft, period: e.target.value })}
        className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]"
      />
      <textarea
        placeholder="주요 업무 (한 줄에 하나)"
        value={(draft.responsibilities ?? []).join("\n")}
        onChange={(e) => setDraft({ ...draft, responsibilities: e.target.value.split("\n").filter(Boolean) })}
        rows={3}
        className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]"
      />
      <textarea
        placeholder="주요 성과 (한 줄에 하나, 수치 포함 권장)"
        value={(draft.highlights ?? []).join("\n")}
        onChange={(e) => setDraft({ ...draft, highlights: e.target.value.split("\n").filter(Boolean) })}
        rows={2}
        className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]"
      />
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="text-[11px] font-bold text-white bg-[#0991B2] rounded px-3 py-1.5 disabled:opacity-50 inline-flex items-center gap-1"
        >
          {isSaving && <Loader2 size={12} className="animate-spin" />} 저장
        </button>
        <button onClick={onCancel} className="text-[11px] text-[#6B7280]">취소</button>
      </div>
    </div>
  );
}
