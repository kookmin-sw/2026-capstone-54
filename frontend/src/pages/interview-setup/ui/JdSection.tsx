import { SetupSection } from "@/shared/ui/SetupSection";
import { JdSavedTab } from "./JdSavedTab";

interface JdItem {
  uuid: string;
  company: string;
  role: string;
  stage: string;
  platform: string;
  badgeLabel: string;
  badgeType: string;
  disabled: boolean;
}

interface JdSectionProps {
  jdList: JdItem[];
  jdListLoading: boolean;
  selectedJdId: string | null;
  onSelectJd: (uuid: string) => void;
}

export function JdSection({ jdList, jdListLoading, selectedJdId, onSelectJd }: JdSectionProps) {
  return (
    <SetupSection
      eyebrow="채용공고"
      title="채용공고를 선택하세요"
      description="등록된 채용공고 중 면접에 사용할 항목을 선택하세요."
      className="flex-1 min-h-0"
    >
      <JdSavedTab
        jdList={jdList}
        jdListLoading={jdListLoading}
        selectedJdId={selectedJdId}
        onSelectJd={onSelectJd}
      />
    </SetupSection>
  );
}
