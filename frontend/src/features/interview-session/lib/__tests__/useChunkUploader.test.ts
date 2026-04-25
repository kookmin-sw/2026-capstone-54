import { renderHook, act } from "@testing-library/react";

jest.mock("../../api/recordingApi", () => ({
  recordingApi: {
    presignPart: jest.fn(),
  },
}));

import { recordingApi } from "../../api/recordingApi";
import { useChunkUploader } from "../useChunkUploader";

const mockPresignPart = recordingApi.presignPart as jest.Mock;
const RECORDING_ID = "test-recording-uuid";
const makeBlob = (size = 1024) => new Blob([new ArrayBuffer(size)]);

const mockFetchOk = (etag = "abc123") => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ ETag: `"${etag}"` }),
  }) as jest.Mock;
};

describe("useChunkUploader", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockPresignPart.mockReset();
  });

  it("init → uploadChunk calls presignPart then PUT to S3", async () => {
    mockPresignPart.mockResolvedValue({ presignedUrl: "https://s3.example.com/part1", partNumber: 1 });
    mockFetchOk("abc123");

    const { result } = renderHook(() => useChunkUploader());
    act(() => { result.current.init(RECORDING_ID); });

    let part: unknown;
    await act(async () => {
      part = await result.current.uploadChunk(makeBlob());
    });

    expect(part).toEqual({ partNumber: 1, etag: "abc123" });
    expect(mockPresignPart).toHaveBeenCalledWith(RECORDING_ID, 1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://s3.example.com/part1",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("sequential uploadChunk increments partNumber", async () => {
    mockPresignPart
      .mockResolvedValueOnce({ presignedUrl: "https://s3.example.com/p1", partNumber: 1 })
      .mockResolvedValueOnce({ presignedUrl: "https://s3.example.com/p2", partNumber: 2 })
      .mockResolvedValueOnce({ presignedUrl: "https://s3.example.com/p3", partNumber: 3 });
    mockFetchOk("e1");

    const { result } = renderHook(() => useChunkUploader());
    act(() => { result.current.init(RECORDING_ID); });

    for (let i = 0; i < 3; i++) {
      await act(async () => { await result.current.uploadChunk(makeBlob()); });
    }

    expect(mockPresignPart).toHaveBeenCalledTimes(3);
    expect(mockPresignPart).toHaveBeenNthCalledWith(1, RECORDING_ID, 1);
    expect(mockPresignPart).toHaveBeenNthCalledWith(2, RECORDING_ID, 2);
    expect(mockPresignPart).toHaveBeenNthCalledWith(3, RECORDING_ID, 3);
  });

  it("init not called → uploadChunk returns null with error", async () => {
    const { result } = renderHook(() => useChunkUploader());

    let part: unknown;
    await act(async () => {
      part = await result.current.uploadChunk(makeBlob());
    });

    expect(part).toBeNull();
    expect(result.current.error).toBe("Recording not initialized.");
  });

  it("S3 PUT failure retries then returns null", async () => {
    mockPresignPart.mockResolvedValue({ presignedUrl: "https://s3.example.com/p1", partNumber: 1 });
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network error")) as jest.Mock;

    const { result } = renderHook(() => useChunkUploader({ maxRetries: 1, retryBaseDelay: 10 }));
    act(() => { result.current.init(RECORDING_ID); });

    let part: unknown;
    await act(async () => {
      part = await result.current.uploadChunk(makeBlob());
    });

    expect(part).toBeNull();
    expect(result.current.error).toContain("Network error");
  });

  it("reset clears state", async () => {
    mockPresignPart.mockResolvedValue({ presignedUrl: "https://s3.example.com/p1", partNumber: 1 });
    mockFetchOk("e1");

    const { result } = renderHook(() => useChunkUploader());
    act(() => { result.current.init(RECORDING_ID); });

    await act(async () => { await result.current.uploadChunk(makeBlob()); });
    expect(result.current.uploadedParts).toHaveLength(1);

    act(() => { result.current.reset(); });
    expect(result.current.uploadedParts).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });
});
