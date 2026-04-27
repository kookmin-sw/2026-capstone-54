import { apiRequest } from "@/shared/api/client";
import { useInterviewSessionStore } from "../model/store";
import type {
  InterviewSession,
  InterviewTurn,
  InterviewAnalysisReport,
  CreateInterviewSessionParams,
  StartInterviewResponse,
  SubmitAnswerResponse,
  TakeoverInterviewSessionResponse,
  PaginatedResponse,
  InterviewSessionListItem,
  BehaviorAnalysis,
} from "./types";

const BASE = "/api/v1/interviews/interview-sessions";

function ownerHeaders(): Record<string, string> {
  const state = useInterviewSessionStore.getState();
  if (!state.ownerToken || state.ownerVersion === null) return {};
  return {
    "X-Session-Owner-Token": state.ownerToken,
    "X-Session-Owner-Version": String(state.ownerVersion),
  };
}

export const interviewApi = {
  createInterviewSession: (params: CreateInterviewSessionParams) =>
    apiRequest<InterviewSession>(BASE + "/", {
      method: "POST",
      body: JSON.stringify(params),
      auth: true,
    }),

  getInterviewSession: (interviewSessionUuid: string) =>
    apiRequest<InterviewSession>(`${BASE}/${interviewSessionUuid}/`, { auth: true }),

  startInterview: (interviewSessionUuid: string) =>
    apiRequest<StartInterviewResponse>(`${BASE}/${interviewSessionUuid}/start/`, {
      method: "POST",
      auth: true,
    }),

  takeoverInterviewSession: (interviewSessionUuid: string) =>
    apiRequest<TakeoverInterviewSessionResponse>(`${BASE}/${interviewSessionUuid}/takeover/`, {
      method: "POST",
      auth: true,
    }),

  getInterviewTurns: (interviewSessionUuid: string) =>
    apiRequest<InterviewTurn[]>(`${BASE}/${interviewSessionUuid}/turns/`, { auth: true }),

  submitAnswer: (
    interviewSessionUuid: string,
    turnPk: number,
    answer: string,
    speechSegments?: { text: string; startMs: number; endMs: number }[],
    options?: { fallbackRequested?: boolean; recordingUuid?: string },
  ) =>
    apiRequest<SubmitAnswerResponse>(
      `${BASE}/${interviewSessionUuid}/turns/${turnPk}/answer/`,
      {
        method: "POST",
        body: JSON.stringify({
          answer,
          speech_segments: speechSegments ?? [],
          fallback_requested: options?.fallbackRequested ?? false,
          recording_uuid: options?.recordingUuid ?? null,
        }),
        auth: true,
        headers: ownerHeaders(),
      },
    ),

  finishInterview: (interviewSessionUuid: string) =>
    apiRequest<{ status: string }>(`${BASE}/${interviewSessionUuid}/finish/`, {
      method: "POST",
      auth: true,
      headers: ownerHeaders(),
    }),

  getInterviewAnalysisReport: (interviewSessionUuid: string) =>
    apiRequest<InterviewAnalysisReport>(`${BASE}/${interviewSessionUuid}/analysis-report/`, {
      auth: true,
    }),

  getMyInterviews: (page = 1) =>
    apiRequest<PaginatedResponse<InterviewSessionListItem>>(`/api/v1/interviews/interview-sessions/?page=${page}`, { auth: true }),

  generateReport: (interviewSessionUuid: string) =>
    apiRequest<InterviewAnalysisReport>(`${BASE}/${interviewSessionUuid}/generate-report/`, {
      method: "POST",
      auth: true,
      headers: ownerHeaders(),
    }),

  getBehaviorAnalyses: (interviewSessionUuid: string) =>
    apiRequest<{ results: BehaviorAnalysis[] }>(`${BASE}/${interviewSessionUuid}/behavior-analyses/`, { auth: true })
      .then((res) => res.results),
};
