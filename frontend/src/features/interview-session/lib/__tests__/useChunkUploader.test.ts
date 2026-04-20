import { renderHook, act } from "@testing-library/react";

jest.mock("@/shared/api/client", () => ({
  fetchWithAuth: (...args: unknown[]) => globalThis.fetch(...(args as [RequestInfo, RequestInit?])),
}));

import { useChunkUploader } from "../useChunkUploader";

const RECORDING_ID = "test-recording-uuid";

const makeBlob = (size = 1024) => new Blob([new ArrayBuffer(size)]);

describe("useChunkUploader", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("init 후 uploadChunk가 순번대로 backend endpoint를 호출한다", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ etag: "abc123" }),
    }) as jest.Mock;

    const { result } = renderHook(() => useChunkUploader());

    act(() => { result.current.init(RECORDING_ID); });

    let part: unknown;
    await act(async () => {
      part = await result.current.uploadChunk(makeBlob());
    });

    expect(part).toEqual({ partNumber: 1, etag: "abc123" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `/api/v1/interviews/recordings/${RECORDING_ID}/parts/1/`,
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("연속 uploadChunk 호출 시 partNumber가 순차 증가한다", async () => {
    globalThis.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ etag: "e1" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ etag: "e2" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ etag: "e3" }) }) as jest.Mock;

    const { result } = renderHook(() => useChunkUploader());
    act(() => { result.current.init(RECORDING_ID); });

    const parts = [];
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        parts.push(await result.current.uploadChunk(makeBlob()));
      });
    }

    expect(parts).toEqual([
      { partNumber: 1, etag: "e1" },
      { partNumber: 2, etag: "e2" },
      { partNumber: 3, etag: "e3" },
    ]);
  });

  it("init 전에 uploadChunk를 호출하면 null을 반환한다", async () => {
    const { result } = renderHook(() => useChunkUploader());

    let part: unknown;
    await act(async () => {
      part = await result.current.uploadChunk(makeBlob());
    });

    expect(part).toBeNull();
    expect(result.current.error).toBe("Recording not initialized.");
  });

  it("fetch 실패 시 재시도 후 null 반환", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network error")) as jest.Mock;

    const { result } = renderHook(() => useChunkUploader({ maxRetries: 1, retryBaseDelay: 10 }));
    act(() => { result.current.init(RECORDING_ID); });

    let part: unknown;
    await act(async () => {
      part = await result.current.uploadChunk(makeBlob());
    });

    expect(part).toBeNull();
    expect(result.current.error).toContain("Network error");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("reset 후 상태가 초기화된다", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ etag: "e1" }),
    }) as jest.Mock;

    const { result } = renderHook(() => useChunkUploader());
    act(() => { result.current.init(RECORDING_ID); });

    await act(async () => { await result.current.uploadChunk(makeBlob()); });
    expect(result.current.uploadedParts).toHaveLength(1);

    act(() => { result.current.reset(); });
    expect(result.current.uploadedParts).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });
});
