import { apiRequest } from "@/shared/api/client";
import type {
  InterviewSession,
  InterviewTurn,
  InterviewAnalysisReport,
  CreateInterviewSessionParams,
  SubmitAnswerResponse,
  PaginatedResponse,
  InterviewSessionListItem,
  BehaviorAnalysis,
} from "./types";

const BASE = "/api/v1/interviews/interview-sessions";

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
    apiRequest<InterviewTurn[]>(`${BASE}/${interviewSessionUuid}/start/`, {
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
  ) =>
    apiRequest<SubmitAnswerResponse>(
      `${BASE}/${interviewSessionUuid}/turns/${turnPk}/answer/`,
      { method: "POST", body: JSON.stringify({ answer, speech_segments: speechSegments ?? [] }), auth: true },
    ),

  finishInterview: (interviewSessionUuid: string) =>
    apiRequest<{ status: string }>(`${BASE}/${interviewSessionUuid}/finish/`, {
      method: "POST",
      auth: true,
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
    }),

  getBehaviorAnalyses: (interviewSessionUuid: string) =>
    apiRequest<{ results: BehaviorAnalysis[] }>(`${BASE}/${interviewSessionUuid}/behavior-analyses/`, { auth: true })
      .then((res) => res.results),
};
