import { create } from "zustand";
import type { InterviewSessionStore } from "./types";
import { initialInterviewSessionState } from "./types";
import {
  loadInterviewSession,
  loadInterviewTurns,
  startInterview,
  finishInterview,
} from "./actions/loadSession";
import { submitInterviewAnswer } from "./actions/submitAnswer";
import { startReportPolling, stopReportStream } from "./actions/reportStream";

export const useInterviewSessionStore = create<InterviewSessionStore>((set, get) => ({
  ...initialInterviewSessionState,

  loadInterviewSession: (uuid) => loadInterviewSession(set, uuid),
  loadInterviewTurns: (uuid) => loadInterviewTurns(set, uuid),
  startInterview: (uuid) => startInterview(set, uuid),
  finishInterview: (uuid) => finishInterview(set, uuid),
  submitInterviewAnswer: (uuid, turnPk, answer) => submitInterviewAnswer(set, get, uuid, turnPk, answer),
  startReportPolling: (uuid) => startReportPolling(set, uuid),

  resetInterviewSession: () => {
    stopReportStream();
    set(initialInterviewSessionState);
  },
}));
