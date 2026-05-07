// ── Enums / Union Types ──
export type InterviewSessionType = "followup" | "full_process";
export type InterviewDifficultyLevel = "friendly" | "normal" | "pressure";
export type InterviewPracticeMode = "practice" | "real";
export type InterviewSessionStatus = "in_progress" | "paused" | "completed";
export type InterviewTurnType = "initial" | "followup";
export type InterviewAnalysisReportStatus = "pending" | "generating" | "completed" | "failed";
export type InterviewSttMode = "browser" | "backend";
export type TranscriptStatus = "pending" | "processing" | "completed" | "failed" | null;
export type TranscriptSource = "browser_stt" | "backend_stt" | "none";

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

export interface SpeechSegment {
  text: string;
  startMs: number;
  endMs: number;
}

export interface TurnMetrics {
  gazeAwayCount: number;
  headAwayCount: number;
  speechRateSps: number | null;
  pillarWordCounts: Record<string, number>;
}

export interface InterviewTurn {
  id: number;
  turnType: InterviewTurnType;
  questionSource: string;
  question: string;
  answer: string;
  speechSegments: SpeechSegment[];
  turnNumber: number;
  followupOrder: number | null;
  gazeAwayCount: number;
  headAwayCount: number;
  speechRateSps: number | null;
  pillarWordCounts: Record<string, number>;
  createdAt: string;
  transcriptStatus?: TranscriptStatus;
  transcriptSource?: TranscriptSource;
  transcriptErrorCode?: string;
  transcriptText?: string;
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
  // 면접 개요
  companyName: string;
  positionTitle: string;
  interviewDate: string | null;
  durationSeconds: number | null;
  difficultyLevel: InterviewDifficultyLevel;
  totalQuestions: number;
  totalFollowupQuestions: number;
}

// ── Request / Response ──
export interface CreateInterviewSessionParams {
  resume_uuid: string;
  user_job_description_uuid: string;
  interview_session_type: InterviewSessionType;
  interview_difficulty_level: InterviewDifficultyLevel;
  interview_practice_mode: InterviewPracticeMode;
}

export interface StartInterviewResponse {
  turns: InterviewTurn[];
  interviewSession: InterviewSession;
  ownerToken: string;
  ownerVersion: number;
  wsTicket: string;
}

export interface TakeoverInterviewSessionResponse {
  ownerToken: string;
  ownerVersion: number;
  wsTicket: string;
}

export interface SubmitAnswerFollowupResponse {
  turns: InterviewTurn[];
  followupExhausted: boolean;
}

export type SubmitAnswerFullProcessResponse = InterviewTurn | { detail: string };
export type SubmitAnswerResponse = SubmitAnswerFollowupResponse | SubmitAnswerFullProcessResponse;

// ── Paginated Response (공통 타입 — shared 에서 re-export) ──
export type { PaginatedResponse } from "@/shared/api/client";

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

export interface SpeechTimelineSegment {
  startMs: number;
  endMs: number;
  type: "speech" | "silence";
  dbfs: number | null;
}

export interface VoiceSummary {
  totalDurationMs: number;
  speechDurationMs: number;
  silenceDurationMs: number;
  silenceRatio: number;
  speechRatio: number;
  avgDbfsOverall: number | null;
  avgDbfsSpeech: number | null;
  silenceSegmentCount: number;
  speechSegmentCount: number;
}

export interface BehaviorAnalysis {
  uuid: string;
  interviewTurn: number;
  status: string;
  speechData: {
    summary: VoiceSummary;
    timeline: SpeechTimelineSegment[];
  } | null;
  expressionData: Record<string, unknown>;
}

