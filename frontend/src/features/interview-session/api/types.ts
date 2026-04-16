// ── Enums / Union Types ──
export type InterviewSessionType = "followup" | "full_process";
export type InterviewDifficultyLevel = "friendly" | "normal" | "pressure";
export type InterviewPracticeMode = "practice" | "real";
export type InterviewSessionStatus = "in_progress" | "completed";
export type InterviewTurnType = "initial" | "followup";
export type InterviewAnalysisReportStatus = "pending" | "generating" | "completed" | "failed";

// ── Core Models ──
export interface InterviewSession {
  uuid: string;
  interviewSessionType: InterviewSessionType;
  interviewSessionStatus: InterviewSessionStatus;
  interviewDifficultyLevel: InterviewDifficultyLevel;
  interviewPracticeMode: InterviewPracticeMode;
  totalQuestions: number;
  totalFollowupQuestions: number;
  estimatedTotalQuestions: number;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewTurn {
  id: number;
  turnType: InterviewTurnType;
  questionSource: string;
  question: string;
  answer: string;
  turnNumber: number;
  followupOrder: number | null;
  createdAt: string;
}

// ── Report Models ──
export interface InterviewCategoryScore {
  category: string;
  score: number;
  comment: string;
}

export interface InterviewStrengthItem {
  title: string;
  evidence: string;
}

export interface InterviewQuestionFeedback {
  turnId: number;
  question: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

export interface InterviewAnalysisReport {
  id: number;
  interviewAnalysisReportStatus: InterviewAnalysisReportStatus;
  overallScore: number | null;
  overallGrade: string;
  overallComment: string;
  categoryScores: InterviewCategoryScore[];
  questionFeedbacks: InterviewQuestionFeedback[];
  strengths: InterviewStrengthItem[];
  improvementAreas: InterviewStrengthItem[];
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}

// ── Request / Response ──
export interface CreateInterviewSessionParams {
  resume_uuid: string;
  user_job_description_uuid: string;
  interview_session_type: InterviewSessionType;
  interview_difficulty_level: InterviewDifficultyLevel;
  interview_practice_mode: InterviewPracticeMode;
}

export interface SubmitAnswerFollowupResponse {
  turns: InterviewTurn[];
  followupExhausted: boolean;
}

export type SubmitAnswerFullProcessResponse = InterviewTurn | { detail: string };
export type SubmitAnswerResponse = SubmitAnswerFollowupResponse | SubmitAnswerFullProcessResponse;

export interface PaginatedResponse<T> {
  count: number;
  totalPagesCount: number;
  nextPage: number | null;
  previousPage: number | null;
  results: T[];
}

export interface InterviewSessionListItem {
  uuid: string;
  interviewSessionType: InterviewSessionType;
  interviewSessionStatus: InterviewSessionStatus;
  interviewDifficultyLevel: InterviewDifficultyLevel;
  totalQuestions: number;
  totalFollowupQuestions: number;
  createdAt: string;
  resumeTitle: string;
  jobDescriptionLabel: string;
  anchorQuestions: { id: number; question: string }[];
  reportStatus: InterviewAnalysisReportStatus | null;
}
