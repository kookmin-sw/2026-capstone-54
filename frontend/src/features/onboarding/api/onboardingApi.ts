import { profileApi } from "@/shared/api/profileApi";
import type { JobCategory, Job } from "@/shared/api/profileApi";

export type { JobCategory, Job };

export async function fetchJobCategoriesApi(): Promise<JobCategory[]> {
  const res = await profileApi.getJobCategories();
  return res.results;
}

export async function fetchJobsByCategoryApi(jobCategoryId: number): Promise<Job[]> {
  const res = await profileApi.getJobsByCategory(jobCategoryId);
  return res.results;
}

export async function submitOnboardingProfileApi(payload: {
  jobCategoryId: number;
  jobIds: number[];
}): Promise<void> {
  await profileApi.saveMyProfile({
    jobCategoryId: payload.jobCategoryId,
    jobIds: payload.jobIds,
  });
}
