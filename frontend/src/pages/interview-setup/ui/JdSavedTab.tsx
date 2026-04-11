import { SelectableCard } from "@/shared/ui/SelectableCard";

interface JdItem {
  id: number;
  company: string;
  role: string;
  stage: string;
  icon: string;
  badgeLabel: string;
  badgeType: string;
}

interface JdSavedTabProps {
  jdList: JdItem[];
  jdListLoading: boolean;
  selectedJdId: number | null;
  onSelectJd: (id: number) => void;
}

export function JdSavedTab({ jdList, jdListLoading, selectedJdId, onSelectJd }: JdSavedTabProps) {
  if (jdListLoading) return <div className="p-4 text-center text-[13px] text-[#9CA3AF]">불러오는 중...</div>;

  return (
    <div className="flex flex-col gap-[7px] flex-1 overflow-y-auto min-h-0">
      {jdList.map((jd) => (
        <SelectableCard key={jd.id} selected={selectedJdId === jd.id} onClick={() => onSelectJd(jd.id)}>
          <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-sm shrink-0">{jd.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold">{jd.company}</div>
            <div className="text-[11px] text-[#6B7280] mt-px">{jd.role} · {jd.stage}</div>
          </div>
          <span className={`inline-flex items-center text-[10px] font-bold py-[3px] px-2.5 rounded-full ${jd.badgeType === "green" ? "text-[#059669] bg-[#ECFDF5]" : "text-[#0991B2] bg-[#E6F7FA]"}`}>
            {jd.badgeLabel}
          </span>
        </SelectableCard>
      ))}
    </div>
  );
}
