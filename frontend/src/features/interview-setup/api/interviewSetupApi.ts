import { apiRequest } from "@/shared/api/client";
import type {
  InterviewSessionType,
  InterviewDifficultyLevel,
  InterviewPracticeMode,
} from "@/features/interview-session";

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
  // Fetch user's resumes for selection
  fetchResumes: (): Promise<ResumeOption[]> =>
    apiRequest<ResumeOption[]>("/api/v1/resumes/", { auth: true }),

  // TODO: Fetch user job descriptions once the list API is available.
  // Until then callers should use TEMP_USER_JOB_DESCRIPTION_UUID below.
  // fetchUserJobDescriptions: (): Promise<UserJobDescriptionOption[]> =>
  //   apiRequest<UserJobDescriptionOption[]>("/api/v1/job-descriptions/user/", { auth: true }),

  // Create an interview session
  createSession: (params: CreateInterviewSessionParams): Promise<CreatedInterviewSession> =>
    apiRequest<CreatedInterviewSession>("/api/v1/interviews/interview-sessions/", {
      method: "POST",
      body: JSON.stringify(params),
      auth: true,
    }),
};

// TEMPORARY: hard-coded user job description UUID until the UJD list API ships.
// Replace with the value returned from fetchUserJobDescriptions() once integrated.
// TODO
export const TEMP_USER_JOB_DESCRIPTION_UUID = "00572934-3684-4d9b-a0fe-a14d7e632895";
