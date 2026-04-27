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
  ownerToken: string | null;
  ownerVersion: number | null;
  wsTicket: string | null;
  takeoverModalOpen: boolean;
  isPaused: boolean;
  pauseReason: string | null;
}

export interface InterviewSessionActions {
  loadInterviewSession: (uuid: string) => Promise<void>;
  loadInterviewTurns: (uuid: string) => Promise<void>;
  startInterview: (uuid: string) => Promise<void>;
  submitInterviewAnswer: (
    uuid: string,
    turnPk: number,
    answer: string,
    speechSegments?: { text: string; startMs: number; endMs: number }[],
    fallbackOptions?: { fallbackRequested?: boolean; recordingUuid?: string },
  ) => Promise<void>;
  finishInterview: (uuid: string) => Promise<void>;
  startReportPolling: (uuid: string) => void;
  resetInterviewSession: () => void;
  applyTakeover: (uuid: string) => Promise<void>;
  setTakeoverModalOpen: (open: boolean) => void;
  setPaused: (paused: boolean, reason?: string | null) => void;
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
  ownerToken: null,
  ownerVersion: null,
  wsTicket: null,
  takeoverModalOpen: false,
  isPaused: false,
  pauseReason: null,
};
