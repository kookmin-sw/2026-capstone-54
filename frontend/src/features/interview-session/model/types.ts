import type {
  InterviewSession,
  InterviewTurn,
  InterviewAnalysisReport,
} from "../api/types";

export type InterviewPhase =
  | "idle"
  | "connecting"
  | "starting"
  | "listening"
  | "submitting"
  | "generating_followup"
  | "finished"
  | "error";

export type AnswerState = "waiting_ready" | "waiting_start" | "speaking";

export interface InterviewSessionState {
  interviewSession: InterviewSession | null;
  interviewTurns: InterviewTurn[];
  currentInterviewTurnIndex: number;
  currentInterviewTurn: InterviewTurn | null;
  interviewPhase: InterviewPhase;
  interviewError: string | null;
  interviewAnalysisReport: InterviewAnalysisReport | null;
  isReportPolling: boolean;
}

export interface InterviewSessionActions {
  loadInterviewSession: (uuid: string) => Promise<void>;
  loadInterviewTurns: (uuid: string) => Promise<void>;
  startInterview: (uuid: string) => Promise<void>;
  submitInterviewAnswer: (uuid: string, turnPk: number, answer: string, speechSegments?: { text: string; startMs: number; endMs: number }[]) => Promise<void>;
  finishInterview: (uuid: string) => Promise<void>;
  startReportPolling: (uuid: string) => void;
  resetInterviewSession: () => void;
}

export type InterviewSessionStore = InterviewSessionState & InterviewSessionActions;

export const initialInterviewSessionState: InterviewSessionState = {
  interviewSession: null,
  interviewTurns: [],
  currentInterviewTurnIndex: 0,
  currentInterviewTurn: null,
  interviewPhase: "idle",
  interviewError: null,
  interviewAnalysisReport: null,
  isReportPolling: false,
};
