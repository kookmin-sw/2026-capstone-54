import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  resumeSectionsApi,
  useResumeSectionMutation,
  type ParsedAward,
} from "@/features/resume";

interface Props {
  resumeUuid: string;
  items: ParsedAward[];
  onChange: (next: ParsedAward[]) => void;
}

const EMPTY: ParsedAward = { name: "", year: "", organization: "", description: "" };

export function AwardsSection({ resumeUuid, items, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ParsedAward>(EMPTY);
  const { isSaving, save } = useResumeSectionMutation<ParsedAward>();

  const handleSave = async () => {
    const isUpdate = editingIndex! < items.length;
    const target = isUpdate ? items[editingIndex!] : null;
    await save({
      mutator: async () => {
        if (isUpdate && target?.uuid) {
          return resumeSectionsApi.updateAward(resumeUuid, target.uuid, {
            name: draft.name,
            year: draft.year,
            organization: draft.organization,
            description: draft.description,
          }) as unknown as Promise<ParsedAward>;
        }
        return resumeSectionsApi.addAward(resumeUuid, {
          name: draft.name,
          year: draft.year,
          organization: draft.organization,
          description: draft.description,
          displayOrder: items.length,
        } as never) as unknown as Promise<ParsedAward>;
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

  const handleDelete = async (item: ParsedAward) => {
    if (!item.uuid) return;
    await resumeSectionsApi.deleteAward(resumeUuid, item.uuid);
    onChange(items.filter((it) => it.uuid !== item.uuid));
  };

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-extrabold text-[#0A0A0A]">수상 이력</h2>
        <button
          onClick={() => {
            setDraft(EMPTY);
            setEditingIndex(items.length);
          }}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0991B2]"
        >
          <Plus size={12} /> 추가
        </button>
      </header>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={item.uuid ?? i} className="group">
            {editingIndex === i ? (
              <Form
                draft={draft}
                setDraft={setDraft}
                isSaving={isSaving}
                onSave={handleSave}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-start justify-between text-[13px]">
                <div className="flex-1">
                  <div>
                    <strong className="text-[#0A0A0A]">{item.name}</strong>
                    {item.organization && <> · {item.organization}</>}
                    {item.year && <span className="text-[#6B7280]"> · {item.year}</span>}
                  </div>
                  {item.description && (
                    <p className="text-[12px] text-[#6B7280] mt-0.5 whitespace-pre-wrap">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 shrink-0">
                  <button
                    onClick={() => {
                      setDraft({ ...item });
                      setEditingIndex(i);
                    }}
                    className="text-[11px] text-[#0991B2]"
                  >
                    편집
                  </button>
                  <button onClick={() => handleDelete(item)} className="text-[11px] text-[#DC2626]">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {editingIndex === items.length && (
          <li>
            <Form
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

function Form({
  draft,
  setDraft,
  isSaving,
  onSave,
  onCancel,
}: {
  draft: ParsedAward;
  setDraft: (v: ParsedAward) => void;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-[#F9FAFB] rounded p-3 grid grid-cols-3 gap-2">
      <input
        placeholder="수상 이름"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]"
      />
      <input
        placeholder="주최"
        value={draft.organization}
        onChange={(e) => setDraft({ ...draft, organization: e.target.value })}
        className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]"
      />
      <input
        placeholder="연도"
        value={draft.year}
        onChange={(e) => setDraft({ ...draft, year: e.target.value })}
        className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]"
      />
      <textarea
        placeholder="상세 설명"
        rows={2}
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        className="col-span-3 border border-[#E5E7EB] rounded px-2 py-1 text-[13px]"
      />
      <div className="col-span-3 flex gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="text-[11px] font-bold text-white bg-[#0991B2] rounded px-3 py-1.5 disabled:opacity-50 inline-flex items-center gap-1"
        >
          {isSaving && <Loader2 size={12} className="animate-spin" />} 저장
        </button>
        <button onClick={onCancel} className="text-[11px] text-[#6B7280]">
          취소
        </button>
      </div>
    </div>
  );
}
