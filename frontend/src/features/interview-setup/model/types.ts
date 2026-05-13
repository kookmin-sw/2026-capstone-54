export type InterviewMode = "tail" | "full";
export type PracticeMode = "practice" | "real";

export interface SetupSummary {
  company: string;
  role: string;
  stage: string;
  interviewModeLabel: string;
  practiceModeLabel: string;
  difficultyLabel: string;
}
