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
  createdAt: string;
  updatedAt: string;
}

export interface SaveProfileParams {
  jobCategoryId: number;
  jobIds: number[];
}

export interface PaginatedJobCategories {
  count: number;
  totalPagesCount: number;
  results: JobCategory[];
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
      body: JSON.stringify({ jobCategoryId: params.jobCategoryId, jobIds: params.jobIds }),
    }),
};
