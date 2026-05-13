import { BookOpen, GitBranch, LayoutList, Lock, Zap } from "lucide-react";
import { SetupSection } from "@/shared/ui/SetupSection";
import { OptionCard } from "@/shared/ui/OptionCard";
import { InfoTooltip } from "@/shared/ui/InfoTooltip";
import type { InterviewMode, PracticeMode } from "@/features/interview-setup";

interface InterviewModeSectionProps {
  interviewMode: InterviewMode;
  practiceMode: PracticeMode;
  isProPlan: boolean;
  onModeChange: (mode: InterviewMode) => void;
  onPracticeModeChange: (mode: PracticeMode) => void;
}

export function InterviewModeSection({
  interviewMode, practiceMode,
  isProPlan,
  onModeChange, onPracticeModeChange,
}: InterviewModeSectionProps) {
  return (
    <>
      <SetupSection eyebrow="면접 방식" title="면접 유형" className="flex-1">
        <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          <OptionCard
            selected={interviewMode === "tail"}
            onClick={() => onModeChange("tail")}
            icon={<div className="w-8 h-8 rounded-lg bg-[#E0F2FE] flex items-center justify-center"><GitBranch size={16} className="text-[#0284C7]" /></div>}
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
            selected={interviewMode === "full"}
            disabled={!isProPlan}
            onClick={() => {
              if (!isProPlan) {
                alert("Pro 플랜 업그레이드 후 사용 가능해요!");
                return;
              }
              onModeChange("full");
            }}
            icon={<div className="w-8 h-8 rounded-lg bg-[#E6F7FA] flex items-center justify-center"><LayoutList size={16} className="text-[#0991B2]" /></div>}
            title="전체 프로세스"
            description="면접 전 과정 시뮬레이션"
            badge={
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-white bg-[#0991B2] py-px px-2 rounded-full">Pro</span>
                <InfoTooltip text="자기소개 → 지원동기 → 직무 질문 → 인성 질문 → 마무리까지 실제 면접의 전체 흐름을 시뮬레이션합니다." />
              </span>
            }
          >
            <div className="flex items-center gap-1 text-[10px] text-[#6B7280] mt-1"><Lock size={10} className="text-[#9CA3AF]" /> Pro 플랜 필요</div>
          </OptionCard>
        </div>
      </SetupSection>

      <SetupSection eyebrow="진행 모드" title="연습 방식" className="flex-1">
        <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          <OptionCard
            selected={practiceMode === "practice"}
            onClick={() => onPracticeModeChange("practice")}
            icon={<div className="w-8 h-8 rounded-lg bg-[#ECFDF5] flex items-center justify-center"><BookOpen size={16} className="text-[#059669]" /></div>}
            title="연습 모드"
            description="준비 후 직접 시작"
            badge={
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] py-px px-2 rounded-full">Free</span>
                <InfoTooltip text="질문 음성이 끝난 후 '말하기 시작' 버튼을 직접 눌러 답변합니다. 자신의 페이스에 맞춰 충분히 생각한 후 답변할 수 있어요." />
              </span>
            }
          />
          <OptionCard
            selected={practiceMode === "real"}
            disabled={!isProPlan}
            onClick={() => {
              if (!isProPlan) {
                alert("실전 모드는 Pro 플랜에서만 사용할 수 있어요.");
                return;
              }
              onPracticeModeChange("real");
            }}
            icon={<div className="w-8 h-8 rounded-lg bg-[#FFFBEB] flex items-center justify-center"><Zap size={16} className="text-[#D97706]" /></div>}
            title="실전 모드"
            description="랜덤 대기 후 자동 시작"
            badge={
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-white bg-[#0991B2] py-px px-2 rounded-full">Pro</span>
                <InfoTooltip text="질문 음성이 끝나면 5~30초 랜덤 대기 후 자동으로 STT가 시작됩니다. 실제 면접의 긴장감을 최대한 재현합니다." />
              </span>
            }
          />
        </div>
      </SetupSection>
    </>
  );
}
