import { SetupSection } from "@/shared/ui/SetupSection";
import type { JdTab } from "@/features/interview-setup";
import { JdSavedTab } from "./JdSavedTab";
import { JdDirectTab } from "./JdDirectTab";
import { JdSkipTab } from "./JdSkipTab";

interface JdItem {
  uuid: string;
  company: string;
  role: string;
  stage: string;
  icon: string;
  badgeLabel: string;
  badgeType: string;
  disabled: boolean;
}

interface JdSectionProps {
  jdTab: JdTab;
  jdList: JdItem[];
  jdListLoading: boolean;
  selectedJdId: string | null;
  directCompany: string;
  directRole: string;
  directStage: string;
  directUrl: string;
  onTabChange: (tab: JdTab) => void;
  onSelectJd: (uuid: string) => void;
  onDirectField: (field: "directCompany" | "directRole" | "directStage" | "directUrl", value: string) => void;
}

const TAB_LABELS: Record<JdTab, string> = {
  saved: "저장된 공고",
  direct: "직접 입력",
  skip: "건너뛰기",
};

export function JdSection({
  jdTab, jdList, jdListLoading, selectedJdId,
  directCompany, directRole, directStage, directUrl,
  onTabChange, onSelectJd, onDirectField,
}: JdSectionProps) {
  return (
    <SetupSection eyebrow="지원 컨텍스트" title="채용공고를 선택하세요" description="등록된 채용공고를 선택하거나 직접 입력할 수 있어요." className="flex-1 min-h-0">
      <div className="flex gap-1.5 mb-3.5">
        {(["saved", "direct", "skip"] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 rounded-lg text-[12px] font-semibold border-[1.5px] cursor-pointer transition-all ${
              jdTab === tab ? "bg-[#E6F7FA] border-[#0991B2] text-[#0991B2]" : "bg-transparent border-[#E5E7EB] text-[#6B7280]"
            }`}
            onClick={() => onTabChange(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {jdTab === "saved" && <JdSavedTab jdList={jdList} jdListLoading={jdListLoading} selectedJdId={selectedJdId} onSelectJd={onSelectJd} />}
      {jdTab === "direct" && <JdDirectTab directCompany={directCompany} directRole={directRole} directStage={directStage} directUrl={directUrl} onDirectField={onDirectField} />}
      {jdTab === "skip" && <JdSkipTab />}
    </SetupSection>
  );
}
