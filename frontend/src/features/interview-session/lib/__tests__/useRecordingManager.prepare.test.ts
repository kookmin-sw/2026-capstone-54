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
const mockAbort = recordingApi.abort as jest.Mock;
const mockComplete = recordingApi.complete as jest.Mock;

const mockMediaStart = jest.fn();
const mockMediaStop = jest.fn();
const mockMediaPause = jest.fn();
const mockMediaResume = jest.fn();
const mockUploaderInit = jest.fn();
const mockUploadChunk = jest.fn();
const mockUploaderReset = jest.fn();

const mediaState: { error: string | null; isRecording: boolean } = {
  error: null,
  isRecording: false,
};
const chunkState: { error: string | null } = { error: null };

jest.mock("../useMediaRecorder", () => ({
  useMediaRecorder: () => ({
    start: mockMediaStart,
    stop: mockMediaStop,
    pause: mockMediaPause,
    resume: mockMediaResume,
    stream: null,
    isRecording: mediaState.isRecording,
    error: mediaState.error,
  }),
}));

jest.mock("../useChunkUploader", () => ({
  useChunkUploader: () => ({
    uploadedParts: [],
    isUploading: false,
    uploadedBytes: 0,
    error: chunkState.error,
    init: mockUploaderInit,
    uploadChunk: mockUploadChunk,
    reset: mockUploaderReset,
  }),
}));

import { useRecordingManager } from "../useRecordingManager";

const INIT_RESPONSE = {
  recordingId: "rec-9",
  uploadId: "u",
  s3Key: "k",
};

describe("useRecordingManager — prepareRecording 분기", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mediaState.error = null;
    mediaState.isRecording = false;
    chunkState.error = null;
    mockInitiate.mockResolvedValue(INIT_RESPONSE);
    mockAbort.mockResolvedValue(undefined);
    mockComplete.mockResolvedValue({ recordingId: "rec-9", status: "completed" });
    mockMediaStart.mockResolvedValue(undefined);
    mockMediaStop.mockResolvedValue(null);
    mockUploadChunk.mockResolvedValue(null);
  });

  it("enabled=false → prepareRecording 호출해도 initiate 미발생", async () => {
    const { result } = renderHook(() =>
      useRecordingManager({ sessionUuid: "s", enabled: false }),
    );

    await act(async () => {
      await result.current.prepareRecording(7);
    });

    expect(mockInitiate).not.toHaveBeenCalled();
  });

  it("같은 turnId 로 prepare 2 회 → initiate 1 회 (guard)", async () => {
    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    await act(async () => {
      await result.current.prepareRecording(7);
      await result.current.prepareRecording(7);
    });

    expect(mockInitiate).toHaveBeenCalledTimes(1);
    expect(mockUploaderInit).toHaveBeenCalledWith(INIT_RESPONSE.recordingId);
  });

  it("prepare → 같은 turnId 로 startRecording → initiate 1 회만 (재사용)", async () => {
    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    await act(async () => {
      await result.current.prepareRecording(7);
      await result.current.startRecording(7);
    });

    expect(mockInitiate).toHaveBeenCalledTimes(1);
    expect(mockMediaStart).toHaveBeenCalledTimes(1);
  });

  it("prepare → 다른 turnId 로 startRecording → initiate 2 회 (재초기화)", async () => {
    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    await act(async () => {
      await result.current.prepareRecording(7);
    });
    await act(async () => {
      await result.current.startRecording(8);
    });

    expect(mockInitiate).toHaveBeenCalledTimes(2);
    expect(mockInitiate.mock.calls[0]).toEqual(["s", 7, "video"]);
    expect(mockInitiate.mock.calls[1]).toEqual(["s", 8, "video"]);
  });

  it("prepareRecording: initiate 실패 → warn + refs reset (다음 시도 가능)", async () => {
    mockInitiate.mockRejectedValueOnce(new Error("server down"));
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    await act(async () => {
      await result.current.prepareRecording(7);
    });
    expect(warnSpy).toHaveBeenCalled();

    await act(async () => {
      await result.current.startRecording(7);
    });
    expect(mockInitiate).toHaveBeenCalledTimes(2);

    warnSpy.mockRestore();
  });

  it("prepareRecording 진행 중 같은 turnId 재호출 → 동일 promise 대기 (initiate 1 회)", async () => {
    let resolveInit: ((v: typeof INIT_RESPONSE) => void) | null = null;
    mockInitiate.mockImplementationOnce(
      () => new Promise((res) => {
        resolveInit = res;
      }),
    );

    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    let p1: Promise<void>;
    let p2: Promise<void>;
    act(() => {
      p1 = result.current.prepareRecording(7);
      p2 = result.current.prepareRecording(7);
    });

    await act(async () => {
      resolveInit?.(INIT_RESPONSE);
      await Promise.all([p1, p2]);
    });

    expect(mockInitiate).toHaveBeenCalledTimes(1);
  });
});

describe("useRecordingManager — startRecording / 에러 처리", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mediaState.error = null;
    mediaState.isRecording = false;
    chunkState.error = null;
    mockInitiate.mockResolvedValue(INIT_RESPONSE);
    mockAbort.mockResolvedValue(undefined);
    mockComplete.mockResolvedValue({ recordingId: "rec-9", status: "completed" });
    mockMediaStart.mockResolvedValue(undefined);
    mockMediaStop.mockResolvedValue(null);
    mockUploadChunk.mockResolvedValue(null);
  });

  it("startRecording: mediaRecorder.start 실패 → abort 호출 + recordingEnabled=false + error 노출", async () => {
    mockMediaStart.mockRejectedValueOnce(new Error("permission denied"));

    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    await act(async () => {
      await result.current.startRecording(7);
    });

    expect(mockAbort).toHaveBeenCalledWith(INIT_RESPONSE.recordingId);
    expect(result.current.recordingEnabled).toBe(false);
    expect(result.current.error).toBe("permission denied");
  });

  it("startRecording: initiate 실패 → error 노출 (recordingEnabled 유지)", async () => {
    mockInitiate.mockRejectedValueOnce(new Error("init fail"));

    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    await act(async () => {
      await result.current.startRecording(7);
    });

    expect(result.current.error).toBe("init fail");
    expect(mockMediaStart).not.toHaveBeenCalled();
  });

  it("stopRecording: recordingIdRef 가 없으면 noop (mediaRecorder.stop 미호출)", async () => {
    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    await act(async () => {
      await result.current.stopRecording();
    });

    expect(mockMediaStop).not.toHaveBeenCalled();
    expect(mockComplete).not.toHaveBeenCalled();
    expect(mockAbort).not.toHaveBeenCalled();
  });

  it("abortRecording: 시작 전 호출 → resetRefs 만 호출 (abort API 호출 안 됨)", async () => {
    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    await act(async () => {
      await result.current.abortRecording();
    });

    expect(mockAbort).not.toHaveBeenCalled();
    expect(mockUploaderReset).toHaveBeenCalled();
  });

  it("abortRecording: start 이후 호출 → abort API + mediaRecorder.stop", async () => {
    mediaState.isRecording = true;
    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    await act(async () => {
      await result.current.startRecording(7);
    });
    await act(async () => {
      await result.current.abortRecording();
    });

    expect(mockAbort).toHaveBeenCalledWith(INIT_RESPONSE.recordingId);
    expect(mockMediaStop).toHaveBeenCalled();
  });

  it("stopRecording: parts 가 0 개면 abort 로 fallback (complete 호출 안 됨)", async () => {
    mockMediaStop.mockResolvedValue(null);
    mockUploadChunk.mockResolvedValue(null);

    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    await act(async () => {
      await result.current.startRecording(7);
    });
    await act(async () => {
      await result.current.stopRecording();
    });

    expect(mockAbort).toHaveBeenCalledWith(INIT_RESPONSE.recordingId);
    expect(mockComplete).not.toHaveBeenCalled();
    expect(result.current.error).toBe("업로드된 청크가 없습니다.");
  });

  it("stopRecording: complete 실패 → error 노출 + refs reset", async () => {
    const finalBlob = new Blob([new ArrayBuffer(2048)]);
    mockMediaStop.mockResolvedValue(finalBlob);
    mockUploadChunk.mockResolvedValue({ partNumber: 1, etag: "e" });
    mockComplete.mockRejectedValueOnce(new Error("complete failed"));

    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    await act(async () => {
      await result.current.startRecording(7);
    });
    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.error).toBe("complete failed");
  });
});

describe("useRecordingManager — combinedError 우선순위 / enabled 동기화", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mediaState.error = null;
    mediaState.isRecording = false;
    chunkState.error = null;
    mockInitiate.mockResolvedValue(INIT_RESPONSE);
  });

  it("managerError 없으면 chunkUploader.error 가 우선 노출", () => {
    chunkState.error = "chunk-issue";
    mediaState.error = "media-issue";

    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    expect(result.current.error).toBe("chunk-issue");
  });

  it("managerError 없고 chunkUploader.error 도 null → mediaRecorder.error 노출", () => {
    mediaState.error = "media-issue";

    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    expect(result.current.error).toBe("media-issue");
  });

  it("mediaRecorder.error 발생 시 recordingEnabled=false 로 자동 비활성화", () => {
    mediaState.error = "fatal";

    const { result } = renderHook(() => useRecordingManager({ sessionUuid: "s" }));

    expect(result.current.recordingEnabled).toBe(false);
  });

  it("enabled prop 변경 시 recordingEnabled 갱신 (useEffect 동기화)", async () => {
    const { result, rerender } = renderHook(
      ({ en }: { en: boolean }) =>
        useRecordingManager({ sessionUuid: "s", enabled: en }),
      { initialProps: { en: true } },
    );
    expect(result.current.recordingEnabled).toBe(true);

    rerender({ en: false });
    expect(result.current.recordingEnabled).toBe(false);

    await act(async () => {
      await result.current.startRecording(7);
    });
    expect(mockInitiate).not.toHaveBeenCalled();
  });
});
