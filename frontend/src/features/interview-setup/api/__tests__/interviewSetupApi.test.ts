const mockApiRequest = jest.fn();

jest.mock("@/shared/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { interviewSetupApi } from "../interviewSetupApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("interviewSetupApi", () => {
  it("fetchResumes → /api/v1/resumes/?page=1 GET + results 추출 (.then)", async () => {
    const resumes = [
      { uuid: "r1", type: "file" as const, title: "이력서", isActive: true, isParsed: true, analysisStatus: "completed" as const, analysisStep: "", analyzedAt: "", createdAt: "", updatedAt: "" },
    ];
    mockApiRequest.mockResolvedValue({ results: resumes, count: 1, totalPagesCount: 1, nextPage: null, previousPage: null });

    const result = await interviewSetupApi.fetchResumes();

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/resumes/?page=1",
      expect.objectContaining({ auth: true }),
    );
    expect(result).toEqual(resumes);
  });

  it("createSession → POST 세션 생성 endpoint + JSON body + auth", async () => {
    mockApiRequest.mockResolvedValue({ uuid: "s1" });

    const params = {
      resume_uuid: "r1",
      user_job_description_uuid: "j1",
      interview_session_type: "followup" as const,
      interview_difficulty_level: "normal" as const,
      interview_practice_mode: "practice" as const,
    };

    await interviewSetupApi.createSession(params);

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/interview-sessions/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(params),
        auth: true,
      }),
    );
  });
});
