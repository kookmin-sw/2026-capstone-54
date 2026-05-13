const mockApiRequest = jest.fn();

jest.mock("../client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { profileApi } from "../profileApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("profileApi", () => {
  it("getJobCategories: GET /job-categories/?per_page=100", async () => {
    mockApiRequest.mockResolvedValue({ count: 0, totalPagesCount: 0, results: [] });
    await profileApi.getJobCategories();
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/job-categories/?per_page=100");
  });

  it("getJobsByCategory(id): GET /{id}/jobs/?per_page=100", async () => {
    mockApiRequest.mockResolvedValue({ count: 0, results: [] });
    await profileApi.getJobsByCategory(5);
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/job-categories/5/jobs/?per_page=100",
    );
  });

  it("getMyProfile: GET /profiles/me/ + auth", async () => {
    mockApiRequest.mockResolvedValue({});
    await profileApi.getMyProfile();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/profiles/me/",
      expect.objectContaining({ auth: true }),
    );
  });

  it("saveMyProfile: POST + body 직렬화 (careerStage 있음)", async () => {
    mockApiRequest.mockResolvedValue({});
    await profileApi.saveMyProfile({ jobCategoryId: 1, jobIds: [1, 2], careerStage: "senior" });

    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({
      jobCategoryId: 1,
      jobIds: [1, 2],
      career_stage: "senior",
    });
  });

  it("saveMyProfile: careerStage 미지정 → career_stage 키 미포함", async () => {
    mockApiRequest.mockResolvedValue({});
    await profileApi.saveMyProfile({ jobCategoryId: 1, jobIds: [] });
    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ jobCategoryId: 1, jobIds: [] });
  });

  it("getAvatar: GET /profiles/me/avatar/ + auth", async () => {
    mockApiRequest.mockResolvedValue({ avatarUrl: null });
    await profileApi.getAvatar();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/profiles/me/avatar/",
      expect.objectContaining({ auth: true }),
    );
  });

  it("uploadAvatar: FormData with 'avatar' field + 빈 headers (Content-Type 자동 설정)", async () => {
    mockApiRequest.mockResolvedValue({ avatarUrl: "x" });
    const file = new File(["x"], "a.png");
    await profileApi.uploadAvatar(file);

    const opts = mockApiRequest.mock.calls[0][1] as { method: string; auth: boolean; headers: Record<string, string>; body: FormData };
    expect(opts.method).toBe("POST");
    expect(opts.auth).toBe(true);
    expect(opts.headers).toEqual({});
    expect(opts.body).toBeInstanceOf(FormData);
    expect((opts.body.get("avatar") as File).name).toBe("a.png");
  });
});
