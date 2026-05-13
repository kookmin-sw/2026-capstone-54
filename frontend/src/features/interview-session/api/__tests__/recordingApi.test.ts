const mockApiRequest = jest.fn();
const mockOwnerHeaders = jest.fn();

jest.mock("@/shared/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

jest.mock("../ownerHeaders", () => ({
  ownerHeaders: () => mockOwnerHeaders(),
}));

import { recordingApi } from "../recordingApi";

beforeEach(() => {
  jest.clearAllMocks();
  mockOwnerHeaders.mockReturnValue({ "X-Session-Owner-Token": "tk", "X-Session-Owner-Version": "1" });
});

describe("recordingApi.initiate", () => {
  it("POST + body + ownerHeaders 포함", async () => {
    mockApiRequest.mockResolvedValue({ recordingId: "rec-1", uploadId: "u1", s3Key: "k" });

    const result = await recordingApi.initiate("sess-1", 5, "video");

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/interview-sessions/sess-1/recordings/initiate/",
      expect.objectContaining({
        method: "POST",
        auth: true,
        body: JSON.stringify({ turnId: 5, mediaType: "video" }),
        headers: { "X-Session-Owner-Token": "tk", "X-Session-Owner-Version": "1" },
      }),
    );
    expect(result.recordingId).toBe("rec-1");
  });
});

describe("recordingApi.complete", () => {
  it("POST + parts/endTimestamp/durationMs body", async () => {
    mockApiRequest.mockResolvedValue({ recordingId: "rec-1", status: "completed" });

    const parts = [{ partNumber: 1, etag: "e1" }, { partNumber: 2, etag: "e2" }];
    await recordingApi.complete("rec-1", parts, "2025-05-15T10:00:00Z", 60000);

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/recordings/rec-1/complete/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ parts, endTimestamp: "2025-05-15T10:00:00Z", durationMs: 60000 }),
      }),
    );
  });
});

describe("recordingApi.abort / list / playbackUrl / presignPart", () => {
  it("abort: POST + headers", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    await recordingApi.abort("rec-9");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/recordings/rec-9/abort/",
      expect.objectContaining({ method: "POST", auth: true }),
    );
  });

  it("presignPart: GET + partNumber query", async () => {
    mockApiRequest.mockResolvedValue({ presignedUrl: "https://s3", partNumber: 3 });
    const result = await recordingApi.presignPart("rec-1", 3);
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/recordings/rec-1/presign-part/?partNumber=3",
      expect.objectContaining({ auth: true }),
    );
    expect(result.partNumber).toBe(3);
  });

  it("list: GET 세션별 녹화 목록", async () => {
    mockApiRequest.mockResolvedValue([]);
    await recordingApi.list("sess-1");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/interviews/interview-sessions/sess-1/recordings/",
      expect.objectContaining({ auth: true }),
    );
  });

  it("playbackUrl: GET 단일 녹화 재생 URL", async () => {
    mockApiRequest.mockResolvedValue({ url: "x", scaledUrl: null, audioUrl: null, expiresIn: 3600, mediaType: "video" });
    const result = await recordingApi.playbackUrl("rec-1");
    expect(result.expiresIn).toBe(3600);
  });
});
