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
