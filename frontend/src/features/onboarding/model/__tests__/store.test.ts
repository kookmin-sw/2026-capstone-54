const mockFetchCategories = jest.fn();
const mockFetchJobs = jest.fn();
const mockSubmit = jest.fn();
const mockIsApiError = jest.fn();

jest.mock("../../api/onboardingApi", () => ({
  fetchJobCategoriesApi: (...args: unknown[]) => mockFetchCategories(...args),
  fetchJobsByCategoryApi: (...args: unknown[]) => mockFetchJobs(...args),
  submitOnboardingProfileApi: (...args: unknown[]) => mockSubmit(...args),
}));

jest.mock("@/shared/api/client", () => ({
  isApiError: (e: unknown) => mockIsApiError(e),
}));

import { useOnboardingStore, JOB_STATUS_OPTIONS } from "../store";

beforeEach(() => {
  jest.clearAllMocks();
  useOnboardingStore.setState({
    jobCategories: [],
    jobCategoriesLoading: false,
    selectedJobCategoryId: null,
    availableJobs: [],
    availableJobsLoading: false,
    selectedJobIds: [],
    careerStage: "",
    isLoading: false,
    error: null,
  });
});

describe("JOB_STATUS_OPTIONS", () => {
  it("8개 옵션 (대학생/대학원생/연차/기타) 정의", () => {
    expect(JOB_STATUS_OPTIONS).toHaveLength(8);
    expect(JOB_STATUS_OPTIONS[0].value).toBe("");
    expect(JOB_STATUS_OPTIONS.find((o) => o.value === "other")?.label).toBe("기타");
  });
});

describe("loadJobCategories", () => {
  it("초기 호출 → 카테고리 fetch + 상태 갱신", async () => {
    mockFetchCategories.mockResolvedValue([{ id: 1, name: "IT/개발", emoji: "💻" }]);

    await useOnboardingStore.getState().loadJobCategories();
    const s = useOnboardingStore.getState();
    expect(s.jobCategories).toHaveLength(1);
    expect(s.jobCategoriesLoading).toBe(false);
  });

  it("이미 카테고리 있음 → fetch 호출 안 함 (캐시)", async () => {
    useOnboardingStore.setState({ jobCategories: [{ id: 1, name: "x", emoji: "" }] });
    await useOnboardingStore.getState().loadJobCategories();
    expect(mockFetchCategories).not.toHaveBeenCalled();
  });

  it("API 실패 → loading false 로 복귀", async () => {
    mockFetchCategories.mockRejectedValue(new Error("fail"));
    await useOnboardingStore.getState().loadJobCategories();
    expect(useOnboardingStore.getState().jobCategoriesLoading).toBe(false);
  });
});

describe("selectJobCategory", () => {
  it("새 카테고리 선택 → selectedJobCategoryId + availableJobs fetch", async () => {
    mockFetchJobs.mockResolvedValue([{ id: 1, name: "Backend" }]);

    await useOnboardingStore.getState().selectJobCategory(1);
    const s = useOnboardingStore.getState();
    expect(s.selectedJobCategoryId).toBe(1);
    expect(s.availableJobs).toHaveLength(1);
  });

  it("같은 카테고리 재선택 → no-op (fetch 호출 안 함)", async () => {
    useOnboardingStore.setState({ selectedJobCategoryId: 1 });
    await useOnboardingStore.getState().selectJobCategory(1);
    expect(mockFetchJobs).not.toHaveBeenCalled();
  });

  it("선택 변경 → selectedJobIds 초기화 + availableJobs 빈 배열", async () => {
    useOnboardingStore.setState({ selectedJobIds: [1, 2] });
    mockFetchJobs.mockResolvedValue([]);

    await useOnboardingStore.getState().selectJobCategory(1);
    expect(useOnboardingStore.getState().selectedJobIds).toEqual([]);
  });

  it("API 실패 → availableJobsLoading=false 로 복귀", async () => {
    mockFetchJobs.mockRejectedValue(new Error("fail"));
    await useOnboardingStore.getState().selectJobCategory(2);
    expect(useOnboardingStore.getState().availableJobsLoading).toBe(false);
  });
});

describe("toggleJobId", () => {
  it("선택 추가 → selectedJobIds 에 포함", () => {
    useOnboardingStore.getState().toggleJobId(5);
    expect(useOnboardingStore.getState().selectedJobIds).toEqual([5]);
  });

  it("이미 있는 ID 토글 → 제거", () => {
    useOnboardingStore.setState({ selectedJobIds: [1, 2] });
    useOnboardingStore.getState().toggleJobId(1);
    expect(useOnboardingStore.getState().selectedJobIds).toEqual([2]);
  });

  it("3 개 초과 추가 → 무시 (최대 3개)", () => {
    useOnboardingStore.setState({ selectedJobIds: [1, 2, 3] });
    useOnboardingStore.getState().toggleJobId(4);
    expect(useOnboardingStore.getState().selectedJobIds).toEqual([1, 2, 3]);
  });
});

describe("submitProfile validation", () => {
  it("selectedJobCategoryId 없음 → error '희망 직군' + false", async () => {
    const ok = await useOnboardingStore.getState().submitProfile();
    expect(ok).toBe(false);
    expect(useOnboardingStore.getState().error).toContain("희망 직군");
  });

  it("selectedJobIds 비어있음 → error '희망 직업'", async () => {
    useOnboardingStore.setState({ selectedJobCategoryId: 1 });
    const ok = await useOnboardingStore.getState().submitProfile();
    expect(ok).toBe(false);
    expect(useOnboardingStore.getState().error).toContain("희망 직업");
  });

  it("careerStage 없음 → error '직업 상태'", async () => {
    useOnboardingStore.setState({ selectedJobCategoryId: 1, selectedJobIds: [1] });
    const ok = await useOnboardingStore.getState().submitProfile();
    expect(ok).toBe(false);
    expect(useOnboardingStore.getState().error).toContain("직업 상태");
  });

  it("모든 필드 채움 → submit API + true 반환", async () => {
    mockSubmit.mockResolvedValue(undefined);
    useOnboardingStore.setState({
      selectedJobCategoryId: 1,
      selectedJobIds: [1, 2],
      careerStage: "1_3_years",
    });

    const ok = await useOnboardingStore.getState().submitProfile();
    expect(ok).toBe(true);
    expect(mockSubmit).toHaveBeenCalledWith({
      jobCategoryId: 1,
      jobIds: [1, 2],
      careerStage: "1_3_years",
    });
  });

  it("submit 실패 (ApiError) → isApiError(message) 사용", async () => {
    mockSubmit.mockRejectedValue({ status: 400, message: "API 검증 실패" });
    mockIsApiError.mockReturnValue(true);
    useOnboardingStore.setState({
      selectedJobCategoryId: 1,
      selectedJobIds: [1],
      careerStage: "1_3_years",
    });

    const ok = await useOnboardingStore.getState().submitProfile();
    expect(ok).toBe(false);
    expect(useOnboardingStore.getState().error).toBe("API 검증 실패");
  });

  it("submit 실패 (non-ApiError) → 기본 메시지", async () => {
    mockSubmit.mockRejectedValue(new Error("server"));
    mockIsApiError.mockReturnValue(false);
    useOnboardingStore.setState({
      selectedJobCategoryId: 1,
      selectedJobIds: [1],
      careerStage: "1_3_years",
    });

    const ok = await useOnboardingStore.getState().submitProfile();
    expect(ok).toBe(false);
    expect(useOnboardingStore.getState().error).toContain("프로필 저장");
  });
});

describe("setCareerStage / clearError", () => {
  it("setCareerStage → 상태 갱신", () => {
    useOnboardingStore.getState().setCareerStage("3_7_years");
    expect(useOnboardingStore.getState().careerStage).toBe("3_7_years");
  });

  it("clearError → null", () => {
    useOnboardingStore.setState({ error: "x" });
    useOnboardingStore.getState().clearError();
    expect(useOnboardingStore.getState().error).toBeNull();
  });
});
