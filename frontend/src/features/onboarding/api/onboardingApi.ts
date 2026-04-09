import { profileApi } from "@/shared/api/profileApi";
import type { JobCategory, Job } from "@/shared/api/profileApi";

export type { JobCategory, Job };

export interface OnboardingPayload {
  jobCategoryId: number;
  jobIds: number[];
  jobStatus: string; // 백엔드 미지원, 프론트에서만 보관
}

export async function fetchJobCategoriesApi(): Promise<JobCategory[]> {
  const res = await profileApi.getJobCategories();
  return res.results;
}

export async function fetchJobsByCategoryApi(jobCategoryId: number): Promise<Job[]> {
  const res = await profileApi.getJobsByCategory(jobCategoryId);
  return res.results;
}

export async function submitOnboardingProfileApi(
  payload: OnboardingPayload
): Promise<{ success: boolean; message: string }> {
  try {
    await profileApi.saveMyProfile({
      jobCategoryId: payload.jobCategoryId,
      jobIds: payload.jobIds,
    });
    return { success: true, message: "프로필이 저장되었습니다." };
  } catch {
    return { success: false, message: "프로필 저장에 실패했습니다." };
  }
}
