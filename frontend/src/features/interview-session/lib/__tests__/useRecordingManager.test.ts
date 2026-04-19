import { renderHook, act } from "@testing-library/react";

jest.mock("../../api/recordingApi", () => ({
  recordingApi: {
    initiate: jest.fn(),
    complete: jest.fn(),
    abort: jest.fn(),
  },
}));

import { recordingApi } from "../../api/recordingApi";

const mockInitiate = recordingApi.initiate as jest.Mock;
const mockComplete = recordingApi.complete as jest.Mock;
const mockAbort = recordingApi.abort as jest.Mock;

jest.mock("../useMediaRecorder", () => ({
  useMediaRecorder: () => ({
    start: mockMediaStart,
    stop: mockMediaStop,
    stream: null,
    isRecording: false,
    error: null,
  }),
}));

jest.mock("../useChunkUploader", () => ({
  useChunkUploader: () => ({
    uploadedParts: [],
    currentPartNumber: 1,
    isUploading: false,
    progress: 0,
    error: null,
    init: mockUploaderInit,
    uploadChunk: mockUploadChunk,
    reset: mockUploaderReset,
  }),
}));

const mockMediaStart = jest.fn().mockResolvedValue(undefined);
const mockMediaStop = jest.fn();
const mockUploaderInit = jest.fn();
const mockUploadChunk = jest.fn();
const mockUploaderReset = jest.fn();

import { useRecordingManager } from "../useRecordingManager";

const INIT_RESPONSE = {
  recordingId: "rec-123",
  uploadId: "upload-456",
  s3Key: "session/turn/test.webm",
};

describe("useRecordingManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitiate.mockResolvedValue(INIT_RESPONSE);
    mockComplete.mockResolvedValue({ recordingId: "rec-123", status: "completed" });
    mockAbort.mockResolvedValue(undefined);
    mockMediaStop.mockResolvedValue(new Blob([new ArrayBuffer(1024)]));
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock;
  });

  it("startRecording: initiate API → chunkUploader.init → mediaRecorder.start", async () => {
    const { result } = renderHook(() =>
      useRecordingManager({ sessionUuid: "sess-1" }),
    );

    await act(async () => { await result.current.startRecording(10); });

    expect(mockInitiate).toHaveBeenCalledWith("sess-1", 10, "video");
    expect(mockUploaderInit).toHaveBeenCalledWith(INIT_RESPONSE.recordingId);
    expect(mockMediaStart).toHaveBeenCalled();
  });

  it("stopRecording (단일 업로드): parts=0이면 recordingApi.upload 후 complete(singleUpload=true)", async () => {
    const mockUpload = jest.fn().mockResolvedValue({ status: "uploaded" });
    (recordingApi as Record<string, unknown>).upload = mockUpload;

    const finalBlob = new Blob([new ArrayBuffer(2048)]);
    mockMediaStop.mockResolvedValue(finalBlob);
    mockUploadChunk.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useRecordingManager({ sessionUuid: "sess-1" }),
    );

    await act(async () => { await result.current.startRecording(10); });
    await act(async () => { await result.current.stopRecording(); });

    expect(mockUpload).toHaveBeenCalledWith("rec-123", finalBlob);
    expect(mockComplete).toHaveBeenCalledWith(
      "rec-123",
      [],
      expect.any(String),
      expect.any(Number),
      true,
    );
  });

  it("stopRecording: complete API에 올바른 타임스탬프와 duration을 전달한다", async () => {
    const mockUpload = jest.fn().mockResolvedValue({ status: "uploaded" });
    (recordingApi as Record<string, unknown>).upload = mockUpload;

    const finalBlob = new Blob([new ArrayBuffer(2048)]);
    mockMediaStop.mockResolvedValue(finalBlob);

    const { result } = renderHook(() =>
      useRecordingManager({ sessionUuid: "sess-1" }),
    );

    await act(async () => { await result.current.startRecording(10); });
    await act(async () => { await result.current.stopRecording(); });

    expect(mockComplete).toHaveBeenCalled();
    const [, , endTimestamp, durationMs] = mockComplete.mock.calls[0];
    expect(new Date(endTimestamp).getTime()).toBeGreaterThan(0);
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });

  it("abortRecording: abort API 호출 + 상태 초기화", async () => {
    const { result } = renderHook(() =>
      useRecordingManager({ sessionUuid: "sess-1" }),
    );

    await act(async () => { await result.current.startRecording(10); });
    await act(async () => { await result.current.abortRecording(); });

    expect(mockAbort).toHaveBeenCalledWith("rec-123");
    expect(mockUploaderReset).toHaveBeenCalled();
  });

  it("enabled=false이면 startRecording이 무시된다", async () => {
    const { result } = renderHook(() =>
      useRecordingManager({ sessionUuid: "sess-1", enabled: false }),
    );

    await act(async () => { await result.current.startRecording(10); });

    expect(mockInitiate).not.toHaveBeenCalled();
  });

  it("stopRecording: finalBlob=null + parts=0 → abort", async () => {
    mockMediaStop.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useRecordingManager({ sessionUuid: "sess-1" }),
    );

    await act(async () => { await result.current.startRecording(10); });
    await act(async () => { await result.current.stopRecording(); });

    expect(mockAbort).toHaveBeenCalledWith("rec-123");
    expect(mockComplete).not.toHaveBeenCalled();
  });
});
