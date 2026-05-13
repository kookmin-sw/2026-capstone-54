import type { SetupSummary, InterviewMode, PracticeMode } from "../model/types";
import type { InterviewDifficultyLevel } from "@/features/interview-session";

interface SummaryInput {
  jdList: { uuid: string; company: string; role: string; stage: string }[];
  selectedJdId: string | null;
  interviewMode: InterviewMode;
  practiceMode: PracticeMode;
  interviewDifficultyLevel: InterviewDifficultyLevel;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  friendly: "친근한 면접관",
  normal: "일반 면접관",
  pressure: "압박 면접관",
};

export function buildSummary(s: SummaryInput): SetupSummary {
  let company = "—";
  let role = "—";
  let stage = "—";

  const jd = s.selectedJdId ? s.jdList.find((j) => j.uuid === s.selectedJdId) : null;
  if (jd) {
    company = jd.company;
    role = jd.role;
    stage = jd.stage;
  }

  return {
    company,
    role,
    stage,
    interviewModeLabel: s.interviewMode === "tail" ? "꼬리질문 방식" : "전체 프로세스",
    practiceModeLabel: s.practiceMode === "practice" ? "연습 모드" : "실전 모드",
    difficultyLabel: DIFFICULTY_LABELS[s.interviewDifficultyLevel] ?? "일반 면접관",
  };
}
