import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  resumeSectionsApi,
  useResumeSectionMutation,
  type ParsedProject,
} from "@/features/resume";

interface Props {
  resumeUuid: string;
  items: ParsedProject[];
  onChange: (next: ParsedProject[]) => void;
}

const EMPTY: ParsedProject = { name: "", role: "", period: "", description: "", techStack: [] };

export function ProjectsSection({ resumeUuid, items, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ParsedProject>(EMPTY);
  const { isSaving, save } = useResumeSectionMutation<ParsedProject>();

  const handleSave = async () => {
    const isUpdate = editingIndex! < items.length;
    const target = isUpdate ? items[editingIndex!] : null;
    await save({
      mutator: async () => {
        if (isUpdate && target?.uuid) {
          return resumeSectionsApi.updateProject(resumeUuid, target.uuid, {
            name: draft.name, role: draft.role, period: draft.period,
            description: draft.description, techStack: draft.techStack,
          }) as unknown as Promise<ParsedProject>;
        }
        return resumeSectionsApi.addProject(resumeUuid, {
          name: draft.name, role: draft.role, period: draft.period,
          description: draft.description, techStack: draft.techStack,
          displayOrder: items.length,
        } as never) as unknown as Promise<ParsedProject>;
      },
      onSuccess: (saved) => {
        const next = [...items];
        if (isUpdate) next[editingIndex!] = saved; else next.push(saved);
        onChange(next);
        setEditingIndex(null);
      },
    });
  };

  const handleDelete = async (item: ParsedProject) => {
    if (!item.uuid) return;
    await resumeSectionsApi.deleteProject(resumeUuid, item.uuid);
    onChange(items.filter((it) => it.uuid !== item.uuid));
  };

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-lg p-5">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-extrabold text-[#0A0A0A]">프로젝트</h2>
        <button onClick={() => { setDraft(EMPTY); setEditingIndex(items.length); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0991B2]">
          <Plus size={12} /> 추가
        </button>
      </header>
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={item.uuid ?? i} className="group">
            {editingIndex === i ? (
              <Form draft={draft} setDraft={setDraft} isSaving={isSaving} onSave={handleSave} onCancel={() => setEditingIndex(null)} />
            ) : (
              <div className="flex items-start justify-between text-[13px]">
                <div>
                  <strong className="text-[#0A0A0A]">{item.name}</strong>
                  <span className="text-[#6B7280]"> · {item.role} · {item.period}</span>
                  {item.description && <p className="text-[12px] text-[#374151] mt-0.5">{item.description}</p>}
                  {item.techStack?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.techStack.map((t, j) => (
                        <span key={j} className="text-[10px] text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] rounded px-1.5 py-px">{t}</span>
                      ))}
                    </div>
                  )}
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
  draft: ParsedProject;
  setDraft: (v: ParsedProject) => void;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-[#F9FAFB] rounded p-3 flex flex-col gap-2">
      <input placeholder="프로젝트명" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]" />
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="역할" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]" />
        <input placeholder="기간" value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value })} className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]" />
      </div>
      <textarea placeholder="설명" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]" />
      <input
        placeholder="기술 스택 (콤마 구분)"
        value={(draft.techStack ?? []).join(", ")}
        onChange={(e) => setDraft({ ...draft, techStack: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
        className="border border-[#E5E7EB] rounded px-2 py-1 text-[13px]"
      />
      <div className="flex gap-2">
        <button onClick={onSave} disabled={isSaving} className="text-[11px] font-bold text-white bg-[#0991B2] rounded px-3 py-1.5 disabled:opacity-50 inline-flex items-center gap-1">
          {isSaving && <Loader2 size={12} className="animate-spin" />} 저장
        </button>
        <button onClick={onCancel} className="text-[11px] text-[#6B7280]">취소</button>
      </div>
    </div>
  );
}
