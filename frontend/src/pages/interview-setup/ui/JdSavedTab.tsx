import { SelectableCard } from "@/shared/ui/SelectableCard";
import { CompanyIcon } from "@/shared/ui/CompanyIcon";

interface JdItem {
  uuid: string;
  company: string;
  role: string;
  stage: string;
  categoryId: number;
  badgeLabel: string;
  badgeType: string;
  disabled: boolean;
}

interface JdSavedTabProps {
  jdList: JdItem[];
  jdListLoading: boolean;
  selectedJdId: string | null;
  onSelectJd: (uuid: string) => void;
}

export function JdSavedTab({ jdList, jdListLoading, selectedJdId, onSelectJd }: JdSavedTabProps) {
  if (jdListLoading) return <div className="p-4 text-center text-[13px] text-[#9CA3AF]">불러오는 중...</div>;

  if (jdList.length === 0) {
    return (
      <div className="p-4 text-center text-[13px] text-[#6B7280] border border-dashed border-[#E5E7EB] rounded-lg">
        등록된 채용공고가 없어요. 먼저 채용공고를 업로드해 주세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[7px] flex-1 overflow-y-auto min-h-0">
      {jdList.map((jd) => (
        <SelectableCard
          key={jd.uuid}
          selected={selectedJdId === jd.uuid}
          disabled={jd.disabled}
          onClick={() => { if (!jd.disabled) onSelectJd(jd.uuid); }}
        >
          <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden">
              <CompanyIcon categoryId={jd.categoryId} size={16} />
            </div>
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
