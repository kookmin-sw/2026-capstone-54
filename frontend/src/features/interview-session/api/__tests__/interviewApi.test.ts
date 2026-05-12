const mockApiRequest = jest.fn();
const mockOwnerHeaders = jest.fn();

jest.mock("@/shared/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

jest.mock("../ownerHeaders", () => ({
  ownerHeaders: () => mockOwnerHeaders(),
}));

import { interviewApi } from "../interviewApi";

beforeEach(() => {
  jest.clearAllMocks();
  mockOwnerHeaders.mockReturnValue({ "X-Session-Owner-Token": "tk" });
});

describe("interviewApi 기본 CRUD", () => {
  it("createInterviewSession: POST body 직렬화", async () => {
    mockApiRequest.mockResolvedValue({ uuid: "s1" });
    const params = { mode: "general" as const, difficulty: "normal" };

    await interviewApi.createInterviewSession(params as never);

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/interview-sessions/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(params),
      }),
    );
  });

  it("getInterviewSession: GET URL", async () => {
    mockApiRequest.mockResolvedValue({});
    await interviewApi.getInterviewSession("s1");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/interview-sessions/s1/",
      expect.objectContaining({ auth: true }),
    );
  });

  it("startInterview: POST start", async () => {
    mockApiRequest.mockResolvedValue({});
    await interviewApi.startInterview("s1");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/interview-sessions/s1/start/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("takeoverInterviewSession: POST takeover", async () => {
    mockApiRequest.mockResolvedValue({});
    await interviewApi.takeoverInterviewSession("s1");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/interview-sessions/s1/takeover/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("getInterviewTurns: GET turns", async () => {
    mockApiRequest.mockResolvedValue([]);
    await interviewApi.getInterviewTurns("s1");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/interview-sessions/s1/turns/",
      expect.objectContaining({ auth: true }),
    );
  });
});

describe("interviewApi.submitAnswer — turnMetrics payload", () => {
  it("answer + segments + metrics 모두 포함", async () => {
    mockApiRequest.mockResolvedValue({});
    await interviewApi.submitAnswer(
      "s1",
      3,
      "내 답변",
      [{ text: "안", startMs: 0, endMs: 100 }],
      { gazeAwayCount: 2, headAwayCount: 1, speechRateSps: 4.5, pillarWordCounts: { tech: 3 } },
    );

    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({
      answer: "내 답변",
      speech_segments: [{ text: "안", startMs: 0, endMs: 100 }],
      gaze_away_count: 2,
      head_away_count: 1,
      speech_rate_sps: 4.5,
      pillar_word_counts: { tech: 3 },
    });
  });

  it("segments / metrics 미지정 → snake_case 기본값", async () => {
    mockApiRequest.mockResolvedValue({});
    await interviewApi.submitAnswer("s1", 1, "ans");

    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toMatchObject({
      answer: "ans",
      speech_segments: [],
      gaze_away_count: 0,
      head_away_count: 0,
      speech_rate_sps: null,
      pillar_word_counts: {},
    });
  });

  it("ownerHeaders 포함", async () => {
    mockApiRequest.mockResolvedValue({});
    await interviewApi.submitAnswer("s1", 1, "ans");
    expect(mockApiRequest.mock.calls[0][1]).toHaveProperty("headers", { "X-Session-Owner-Token": "tk" });
  });
});

describe("interviewApi 종료 / 리포트", () => {
  it("finishInterview: POST + ownerHeaders", async () => {
    mockApiRequest.mockResolvedValue({ status: "completed" });
    await interviewApi.finishInterview("s1");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/interview-sessions/s1/finish/",
      expect.objectContaining({ method: "POST", headers: { "X-Session-Owner-Token": "tk" } }),
    );
  });

  it("getInterviewAnalysisReport: GET", async () => {
    mockApiRequest.mockResolvedValue({});
    await interviewApi.getInterviewAnalysisReport("s1");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/interview-sessions/s1/analysis-report/",
      expect.objectContaining({ auth: true }),
    );
  });

  it("generateReport: POST + ownerHeaders", async () => {
    mockApiRequest.mockResolvedValue({});
    await interviewApi.generateReport("s1");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/interview-sessions/s1/generate-report/",
      expect.objectContaining({ method: "POST", headers: { "X-Session-Owner-Token": "tk" } }),
    );
  });

  it("getMyInterviews: page + status 쿼리스트링", async () => {
    mockApiRequest.mockResolvedValue({ results: [], count: 0, totalPagesCount: 1, nextPage: null, previousPage: null });
    await interviewApi.getMyInterviews(2, "completed");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/interview-sessions/?page=2&status=completed",
      expect.objectContaining({ auth: true }),
    );
  });

  it("getMyInterviews: status 미지정 → page 만", async () => {
    mockApiRequest.mockResolvedValue({ results: [] });
    await interviewApi.getMyInterviews(3);
    expect(mockApiRequest.mock.calls[0][0]).toBe("/api/v1/interviews/interview-sessions/?page=3");
  });

  it("getBehaviorAnalyses: results 배열 추출 (Promise .then)", async () => {
    mockApiRequest.mockResolvedValue({ results: [{ id: 1 }, { id: 2 }] });
    const result = await interviewApi.getBehaviorAnalyses("s1");
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
