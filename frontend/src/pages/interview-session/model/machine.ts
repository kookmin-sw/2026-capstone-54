/**
 * Interview Session State Machine — Pure reducer.
 * idle → ready → starting → tts_playing → preparing_record → countdown|awaiting_start → speaking → submitting → (loop | finished)
 * Side effects live in useInterviewMachine hook, not here.
 */

export type MachinePhase =
  | "idle"              // waiting for session + media
  | "ready"             // user can click Start
  | "starting"          // startInterview API in-flight
  | "tts_playing"       // question audio playing
  | "preparing_record"  // TTS done, waiting for recording initiate to complete
  | "countdown"         // real mode: auto-start countdown
  | "awaiting_start"    // practice mode: waiting user click
  | "speaking"          // STT + recording active
  | "submitting"        // answer submitted, backend processing
  | "finished"
  | "error";

export interface MachineState {
  phase: MachinePhase;
  isRealMode: boolean;
  turnId: number | null;
  question: string | null;
  countdown: number | null;
  error: string | null;
}

export type MachineEvent =
  | { type: "MEDIA_READY" }
  | { type: "RESUME"; turnId: number; question: string }
  | { type: "START" }
  | { type: "QUESTION_ARRIVED"; turnId: number; question: string }
  | { type: "TTS_DONE" }
  | { type: "RECORDING_READY" }
  | { type: "COUNTDOWN_TICK" }
  | { type: "PRACTICE_START" }
  | { type: "SUBMIT" }
  | { type: "ANSWER_ACCEPTED"; nextTurnId: number; nextQuestion: string }
  | { type: "FINISH" }
  | { type: "ERROR"; message: string }
  | { type: "SET_REAL_MODE"; isRealMode: boolean };

export const initialMachineState: MachineState = {
  phase: "idle",
  isRealMode: false,
  turnId: null,
  question: null,
  countdown: null,
  error: null,
};

function randomCountdown(): number {
  return Math.floor(Math.random() * 26) + 5;
}

export function machineReducer(state: MachineState, event: MachineEvent): MachineState {
  if (event.type === "ERROR") {
    return { ...state, phase: "error", error: event.message };
  }
  if (event.type === "FINISH") {
    return { ...state, phase: "finished", countdown: null };
  }
  if (event.type === "SET_REAL_MODE") {
    return { ...state, isRealMode: event.isRealMode };
  }

  switch (state.phase) {
    case "idle":
      if (event.type === "MEDIA_READY") return { ...state, phase: "ready" };
      if (event.type === "RESUME") {
        return { ...state, phase: "tts_playing", turnId: event.turnId, question: event.question };
      }
      return state;

    case "ready":
      if (event.type === "START") return { ...state, phase: "starting" };
      return state;

    case "starting":
      if (event.type === "QUESTION_ARRIVED") {
        return { ...state, phase: "tts_playing", turnId: event.turnId, question: event.question };
      }
      return state;

    case "tts_playing":
      if (event.type === "TTS_DONE") {
        return { ...state, phase: "preparing_record" };
      }
      return state;

    case "preparing_record":
      if (event.type === "RECORDING_READY") {
        return state.isRealMode
          ? { ...state, phase: "countdown", countdown: randomCountdown() }
          : { ...state, phase: "awaiting_start" };
      }
      return state;

    case "countdown":
      if (event.type === "COUNTDOWN_TICK") {
        const next = (state.countdown ?? 1) - 1;
        if (next <= 0) return { ...state, phase: "speaking", countdown: null };
        return { ...state, countdown: next };
      }
      return state;

    case "awaiting_start":
      if (event.type === "PRACTICE_START") return { ...state, phase: "speaking" };
      return state;

    case "speaking":
      if (event.type === "SUBMIT") return { ...state, phase: "submitting" };
      return state;

    case "submitting":
      if (event.type === "ANSWER_ACCEPTED") {
        return {
          ...state,
          phase: "tts_playing",
          turnId: event.nextTurnId,
          question: event.nextQuestion,
        };
      }
      return state;

    case "finished":
    case "error":
      return state;
  }
}
