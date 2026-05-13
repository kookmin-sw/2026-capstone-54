const mockProfileApi = {
  getJobCategories: jest.fn(),
  getJobsByCategory: jest.fn(),
  saveMyProfile: jest.fn(),
};

jest.mock("@/shared/api/profileApi", () => ({
  profileApi: mockProfileApi,
}));

import {
  fetchJobCategoriesApi,
  fetchJobsByCategoryApi,
  submitOnboardingProfileApi,
} from "../onboardingApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("onboardingApi", () => {
  it("fetchJobCategoriesApi → results 배열 반환", async () => {
    const cats = [{ id: 1, name: "IT/개발", emoji: "💻" }];
    mockProfileApi.getJobCategories.mockResolvedValue({ results: cats });

    const result = await fetchJobCategoriesApi();
    expect(result).toEqual(cats);
  });

  it("fetchJobsByCategoryApi(categoryId) → 해당 카테고리 jobs 반환", async () => {
    const jobs = [{ id: 1, name: "Backend" }, { id: 2, name: "Frontend" }];
    mockProfileApi.getJobsByCategory.mockResolvedValue({ results: jobs });

    const result = await fetchJobsByCategoryApi(1);

    expect(mockProfileApi.getJobsByCategory).toHaveBeenCalledWith(1);
    expect(result).toEqual(jobs);
  });

  it("submitOnboardingProfileApi → profileApi.saveMyProfile 그대로 호출", async () => {
    mockProfileApi.saveMyProfile.mockResolvedValue(undefined);

    const payload = { jobCategoryId: 1, jobIds: [1, 2], careerStage: "senior" };
    await submitOnboardingProfileApi(payload);

    expect(mockProfileApi.saveMyProfile).toHaveBeenCalledWith(payload);
  });

  it("submitOnboardingProfileApi → careerStage 미지정도 처리", async () => {
    mockProfileApi.saveMyProfile.mockResolvedValue(undefined);
    await submitOnboardingProfileApi({ jobCategoryId: 1, jobIds: [] });
    expect(mockProfileApi.saveMyProfile).toHaveBeenCalledWith({
      jobCategoryId: 1,
      jobIds: [],
    });
  });
});
