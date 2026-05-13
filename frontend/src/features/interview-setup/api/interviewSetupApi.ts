import { apiRequest } from "@/shared/api/client";
import type { PaginatedResponse } from "@/shared/api";
import type {
  InterviewSessionType,
  InterviewDifficultyLevel,
  InterviewPracticeMode,
} from "@/features/interview-session";
import type { ResumeJobCategory } from "@/features/resume";

export type { ResumeJobCategory };

// ── Resume option (matches backend ResumeSerializer) ──
export interface ResumeOption {
  uuid: string;
  type: "file" | "text";
  title: string;
  isActive: boolean;
  isParsed: boolean;
  analysisStatus: "pending" | "processing" | "completed" | "failed";
  analysisStep: string;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resumeJobCategory: ResumeJobCategory | null;
}

// ── User job description option (future) ──
export interface UserJobDescriptionOption {
  uuid: string;
  label: string; // composed "{company} — {title}"
}

// ── Session creation ──
export interface CreateInterviewSessionParams {
  resume_uuid: string;
  user_job_description_uuid: string;
  interview_session_type: InterviewSessionType;
  interview_difficulty_level: InterviewDifficultyLevel;
  interview_practice_mode: InterviewPracticeMode;
}

export interface CreatedInterviewSession {
  uuid: string;
  interviewSessionType: InterviewSessionType;
  interviewSessionStatus: string;
  interviewDifficultyLevel: InterviewDifficultyLevel;
  totalQuestions: number;
  totalFollowupQuestions: number;
  createdAt: string;
}

export const interviewSetupApi = {
  // Fetch user's resumes for selection.
  // 백엔드는 DRF 페이지네이션 응답({ count, results, ... })을 반환하므로 results 만 꺼낸다.
  // 인터뷰 준비 화면에서는 현재 1페이지만 사용한다.
  fetchResumes: (): Promise<ResumeOption[]> =>
    apiRequest<PaginatedResponse<ResumeOption>>("/api/v1/resumes/?page=1", { auth: true })
      .then((res) => res.results),

  // Create an interview session. user_job_description_uuid 는
  // `/api/v1/user-job-descriptions/` 에서 선택된 항목의 uuid 를 그대로 전달한다.
  createSession: (params: CreateInterviewSessionParams): Promise<CreatedInterviewSession> =>
    apiRequest<CreatedInterviewSession>("/api/v1/interviews/interview-sessions/", {
      method: "POST",
      body: JSON.stringify(params),
      auth: true,
    }),
};
