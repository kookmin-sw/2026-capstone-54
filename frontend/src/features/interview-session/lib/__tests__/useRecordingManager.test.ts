import { renderHook, act } from "@testing-library/react";

jest.mock("../../api/recordingApi", () => ({
  recordingApi: {
    initiate: jest.fn(),
    complete: jest.fn(),
    abort: jest.fn(),
    presignPart: jest.fn(),
  },
}));

import { recordingApi } from "../../api/recordingApi";

const mockInitiate = recordingApi.initiate as jest.Mock;
const mockComplete = recordingApi.complete as jest.Mock;
const mockAbort = recordingApi.abort as jest.Mock;

const mockMediaStart = jest.fn().mockResolvedValue(undefined);
const mockMediaStop = jest.fn();
const mockUploaderInit = jest.fn();
const mockUploadChunk = jest.fn();
const mockUploaderReset = jest.fn();

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
    isUploading: false,
    uploadedBytes: 0,
    error: null,
    init: mockUploaderInit,
    uploadChunk: mockUploadChunk,
    reset: mockUploaderReset,
  }),
}));

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
    mockUploadChunk.mockResolvedValue({ partNumber: 1, etag: "etag-1" });
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

  it("stopRecording: finalBlob → uploadChunk → complete with parts", async () => {
    const finalBlob = new Blob([new ArrayBuffer(2048)]);
    mockMediaStop.mockResolvedValue(finalBlob);
    mockUploadChunk.mockResolvedValue({ partNumber: 1, etag: "final-etag" });

    const { result } = renderHook(() =>
      useRecordingManager({ sessionUuid: "sess-1" }),
    );

    await act(async () => { await result.current.startRecording(10); });
    await act(async () => { await result.current.stopRecording(); });

    expect(mockUploadChunk).toHaveBeenCalledWith(finalBlob);
    expect(mockComplete).toHaveBeenCalledWith(
      "rec-123",
      expect.arrayContaining([expect.objectContaining({ partNumber: 1 })]),
      expect.any(String),
      expect.any(Number),
    );
  });

  it("stopRecording: complete API receives valid timestamp and duration", async () => {
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

  it("abortRecording: abort API + state reset", async () => {
    const { result } = renderHook(() =>
      useRecordingManager({ sessionUuid: "sess-1" }),
    );

    await act(async () => { await result.current.startRecording(10); });
    await act(async () => { await result.current.abortRecording(); });

    expect(mockAbort).toHaveBeenCalledWith("rec-123");
    expect(mockUploaderReset).toHaveBeenCalled();
  });

  it("enabled=false → startRecording is ignored", async () => {
    const { result } = renderHook(() =>
      useRecordingManager({ sessionUuid: "sess-1", enabled: false }),
    );

    await act(async () => { await result.current.startRecording(10); });

    expect(mockInitiate).not.toHaveBeenCalled();
  });

  it("stopRecording: finalBlob=null + parts=0 → abort", async () => {
    mockMediaStop.mockResolvedValue(null);
    mockUploadChunk.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useRecordingManager({ sessionUuid: "sess-1" }),
    );

    await act(async () => { await result.current.startRecording(10); });
    await act(async () => { await result.current.stopRecording(); });

    expect(mockAbort).toHaveBeenCalledWith("rec-123");
    expect(mockComplete).not.toHaveBeenCalled();
  });
});
