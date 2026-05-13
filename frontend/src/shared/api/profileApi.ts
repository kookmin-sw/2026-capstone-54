import { apiRequest } from "./client";

export interface JobCategory {
  id: number;
  emoji: string;
  name: string;
}

export interface Job {
  id: number;
  name: string;
}

export interface UserProfile {
  id: number;
  user: number;
  jobCategory: JobCategory;
  jobs: Job[];
  careerStage: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveProfileParams {
  jobCategoryId: number;
  jobIds: number[];
  careerStage?: string;
}

export interface PaginatedJobCategories {
  count: number;
  totalPagesCount: number;
  results: JobCategory[];
}

export interface AvatarResponse {
  avatarUrl: string | null;
}

export const profileApi = {
  getJobCategories: () =>
    apiRequest<PaginatedJobCategories>("/api/v1/job-categories/?per_page=100"),

  getJobsByCategory: (jobCategoryId: number) =>
    apiRequest<{ count: number; results: Job[] }>(
      `/api/v1/job-categories/${jobCategoryId}/jobs/?per_page=100`
    ),

  getMyProfile: () =>
    apiRequest<UserProfile>("/api/v1/profiles/me/", { auth: true }),

  saveMyProfile: (params: SaveProfileParams) =>
    apiRequest<UserProfile>("/api/v1/profiles/me/", {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        jobCategoryId: params.jobCategoryId,
        jobIds: params.jobIds,
        ...(params.careerStage && { career_stage: params.careerStage }),
      }),
    }),

  getAvatar: () =>
    apiRequest<AvatarResponse>("/api/v1/profiles/me/avatar/", { auth: true }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    // Content-Type은 브라우저가 multipart/form-data로 자동 설정
    return apiRequest<AvatarResponse>("/api/v1/profiles/me/avatar/", {
      method: "POST",
      auth: true,
      headers: {},
      body: formData,
    });
  },
};
