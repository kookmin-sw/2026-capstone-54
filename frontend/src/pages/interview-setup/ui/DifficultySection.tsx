import { SetupSection } from "@/shared/ui/SetupSection";
import { OptionCard } from "@/shared/ui/OptionCard";
import type { InterviewDifficultyLevel } from "@/features/interview-session";

interface DifficultySectionProps {
  interviewDifficultyLevel: InterviewDifficultyLevel;
  onDifficultyChange: (level: InterviewDifficultyLevel) => void;
}

const DIFFICULTIES = [
  { value: "friendly", label: "친근한 면접관", icon: "😊", desc: "부드럽고 격려적인 질문. 긴장감이 낮아 처음 연습할 때 적합해요." },
  { value: "normal", label: "일반 면접관", icon: "🤵", desc: "표준적인 면접 형식. 실제 면접과 가장 유사한 환경을 제공해요." },
  { value: "pressure", label: "압박 면접관", icon: "🔍", desc: "날카롭고 도전적인 질문. 실전 대비 역량을 최대한 이끌어내요." },
] as const;

export function DifficultySection({ interviewDifficultyLevel, onDifficultyChange }: DifficultySectionProps) {
  return (
    <SetupSection eyebrow="면접관 유형" title="면접관 유형을 선택하세요" description="면접관의 성격과 질문 방식이 달라집니다.">
      <div className="flex flex-col gap-2.5">
        {DIFFICULTIES.map(({ value, label, icon, desc }) => (
          <OptionCard
            key={value}
            selected={interviewDifficultyLevel === value}
            onClick={() => onDifficultyChange(value)}
            icon={icon}
            title={label}
            description={desc}
          />
        ))}
      </div>
    </SetupSection>
  );
}
