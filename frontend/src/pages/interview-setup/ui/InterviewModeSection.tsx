import { SetupSection } from "@/shared/ui/SetupSection";
import { OptionCard } from "@/shared/ui/OptionCard";
import { InfoTooltip } from "@/shared/ui/InfoTooltip";

interface InterviewModeSectionProps {
  interviewMode: string;
  practiceMode: string;
  onModeChange: (mode: string) => void;
  onPracticeModeChange: (mode: string) => void;
}

export function InterviewModeSection({
  interviewMode, practiceMode,
  onModeChange, onPracticeModeChange,
}: InterviewModeSectionProps) {
  return (
    <>
      <SetupSection eyebrow="면접 방식" title="면접 유형" className="mb-3">
        <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          <OptionCard
            selected={interviewMode === "tail"}
            onClick={() => onModeChange("tail")}
            title="꼬리질문 방식"
            description="답변 기반 심층 꼬리질문 생성"
            badge={
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] py-px px-2 rounded-full">Free</span>
                <InfoTooltip text="하나의 앵커 질문에서 시작해 답변을 분석하고, 연관된 꼬리질문을 1~3개 자동 생성합니다. 특정 역량을 깊이 검증하는 데 효과적입니다." />
              </span>
            }
            tags={["심층 탐구", "실시간 생성"]}
          />
          <OptionCard
            selected={false}
            disabled
            onClick={() => alert("Pro 플랜 업그레이드 후 사용 가능해요!")}
            title="전체 프로세스"
            description="면접 전 과정 시뮬레이션"
            badge={
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-white bg-[#0991B2] py-px px-2 rounded-full">Pro</span>
                <InfoTooltip text="자기소개 → 지원동기 → 직무 질문 → 인성 질문 → 마무리까지 실제 면접의 전체 흐름을 시뮬레이션합니다." />
              </span>
            }
          >
            <div className="text-[10px] text-[#6B7280] mt-1">🔒 Pro 플랜 필요</div>
          </OptionCard>
        </div>
      </SetupSection>

      <SetupSection eyebrow="진행 모드" title="연습 방식">
        <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          <OptionCard
            selected={practiceMode === "practice"}
            onClick={() => onPracticeModeChange("practice")}
            icon="🎮"
            title="연습 모드"
            description="준비 후 직접 시작"
            badge={<InfoTooltip text="질문 음성이 끝난 후 '말하기 시작' 버튼을 직접 눌러 답변합니다. 자신의 페이스에 맞춰 충분히 생각한 후 답변할 수 있어요." />}
          />
          <OptionCard
            selected={practiceMode === "real"}
            onClick={() => onPracticeModeChange("real")}
            icon="⚡"
            title="실전 모드"
            description="랜덤 대기 후 자동 시작"
            badge={<InfoTooltip text="질문 음성이 끝나면 5~30초 랜덤 대기 후 자동으로 STT가 시작됩니다. 실제 면접의 긴장감을 최대한 재현합니다." />}
          />
        </div>
      </SetupSection>
    </>
  );
}
