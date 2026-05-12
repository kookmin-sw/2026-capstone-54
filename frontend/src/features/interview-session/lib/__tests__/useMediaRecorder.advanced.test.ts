import { renderHook, act } from "@testing-library/react";
import { useMediaRecorder } from "../useMediaRecorder";

interface MockRecorderOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
}

interface MockRecorderInstance {
  state: string;
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
  options: MockRecorderOptions | undefined;
  start: (t?: number) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

const instances: MockRecorderInstance[] = [];
let constructorError: Error | null = null;

class MockMediaRecorder implements MockRecorderInstance {
  state: string = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  options: MockRecorderOptions | undefined;
  static isTypeSupported = jest.fn(() => true);
  constructor(_stream: MediaStream, options?: MockRecorderOptions) {
    void _stream;
    if (constructorError) throw constructorError;
    this.options = options;
    instances.push(this);
  }
  start(_t?: number) {
    void _t;
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
  }
  pause() {
    if (this.state === "recording") this.state = "paused";
  }
  resume() {
    if (this.state === "paused") this.state = "recording";
  }
}

interface MockedStream {
  stream: MediaStream;
  sourceStop: jest.Mock;
  cloneStop: jest.Mock;
}

function buildMockStream(): MockedStream {
  const sourceStop = jest.fn();
  const cloneStop = jest.fn();
  const stream = {
    getTracks: () => [
      { stop: sourceStop, kind: "video", enabled: true, readyState: "live" },
    ],
    clone: () => ({
      getTracks: () => [
        { stop: cloneStop, kind: "video", enabled: true, readyState: "live" },
      ],
      clone: () => stream,
    }),
  } as unknown as MediaStream;
  return { stream, sourceStop, cloneStop };
}

beforeEach(() => {
  instances.length = 0;
  constructorError = null;
  MockMediaRecorder.isTypeSupported.mockReset();
  MockMediaRecorder.isTypeSupported.mockReturnValue(true);
  Object.defineProperty(globalThis, "MediaRecorder", {
    value: MockMediaRecorder,
    writable: true,
  });
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    value: {
      getUserMedia: jest.fn().mockResolvedValue(buildMockStream().stream),
    },
    writable: true,
  });
});

describe("useMediaRecorder — 보강 (옵션 / cleanup / 에러)", () => {
  it("mimeType 옵션이 명시되면 isTypeSupported 호출 없이 그대로 전달", async () => {
    const onChunk = jest.fn();
    const { stream } = buildMockStream();
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: stream, mimeType: "video/mp4" }),
    );

    await act(async () => {
      await result.current.start();
    });

    expect(instances[0]?.options?.mimeType).toBe("video/mp4");
    expect(MockMediaRecorder.isTypeSupported).not.toHaveBeenCalled();
  });

  it("mimeType 미지정 시 isTypeSupported 로 자동 선택 (지원 안 되면 빈 문자열)", async () => {
    MockMediaRecorder.isTypeSupported.mockReturnValue(false);
    const onChunk = jest.fn();
    const { stream } = buildMockStream();
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: stream }),
    );

    await act(async () => {
      await result.current.start();
    });

    expect(MockMediaRecorder.isTypeSupported).toHaveBeenCalled();
    expect(instances[0]?.options?.mimeType).toBe("");
  });

  it("MediaRecorder 미지원 환경 → error 상태 + reject", async () => {
    Object.defineProperty(globalThis, "MediaRecorder", { value: undefined, writable: true });

    const onChunk = jest.fn();
    const { stream } = buildMockStream();
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: stream }),
    );

    let caught: Error | undefined;
    await act(async () => {
      try {
        await result.current.start();
      } catch (e) {
        caught = e as Error;
      }
    });

    expect(caught?.message).toMatch(/녹화를 지원하지 않/);
    expect(result.current.error).toMatch(/녹화를 지원하지 않/);
  });

  it("getUserMedia 실패 → error 상태 + reject (externalStream 미사용 경로)", async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
      new Error("permission denied"),
    );

    const onChunk = jest.fn();
    const { result } = renderHook(() => useMediaRecorder({ onChunk }));

    let caught: Error | undefined;
    await act(async () => {
      try {
        await result.current.start();
      } catch (e) {
        caught = e as Error;
      }
    });

    expect(caught?.message).toBe("permission denied");
    expect(result.current.error).toBe("permission denied");
  });

  it("MediaRecorder 생성자 throw → catch 분기 + sourceStream/clonedStream tracks stop", async () => {
    constructorError = new Error("constructor fail");
    const onChunk = jest.fn();
    const internal = buildMockStream();
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce(internal.stream);

    const { result } = renderHook(() => useMediaRecorder({ onChunk }));

    let caught: Error | undefined;
    await act(async () => {
      try {
        await result.current.start();
      } catch (e) {
        caught = e as Error;
      }
    });

    expect(caught?.message).toBe("constructor fail");
    expect(internal.sourceStop).toHaveBeenCalled();
    expect(internal.cloneStop).toHaveBeenCalled();
    expect(result.current.error).toBe("constructor fail");
    expect(result.current.stream).toBeNull();
  });
});

describe("useMediaRecorder — ondataavailable 분기", () => {
  it("recording + size>0 + 5MB 미만 → buffer 누적, onChunk 미호출", async () => {
    const onChunk = jest.fn();
    const { stream } = buildMockStream();
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: stream, timeslice: 999999 }),
    );

    await act(async () => {
      await result.current.start();
    });

    const rec = instances[0];
    act(() => {
      rec.ondataavailable?.({ data: new Blob([new ArrayBuffer(1_000_000)]) });
      rec.ondataavailable?.({ data: new Blob([new ArrayBuffer(2_000_000)]) });
    });

    expect(onChunk).not.toHaveBeenCalled();
  });

  it("recording + 누적 buffer 5MB 도달 → onChunk 호출 + buffer 비워짐", async () => {
    const onChunk = jest.fn();
    const { stream } = buildMockStream();
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: stream, timeslice: 999999 }),
    );

    await act(async () => {
      await result.current.start();
    });

    const rec = instances[0];
    act(() => {
      rec.ondataavailable?.({ data: new Blob([new ArrayBuffer(6 * 1024 * 1024)]) });
    });
    expect(onChunk).toHaveBeenCalledTimes(1);
    expect((onChunk.mock.calls[0][0] as Blob).size).toBeGreaterThanOrEqual(5 * 1024 * 1024);

    act(() => {
      rec.ondataavailable?.({ data: new Blob([new ArrayBuffer(100)]) });
    });
    expect(onChunk).toHaveBeenCalledTimes(1);
  });

  it("stop() 진행 중 inactive + size>0 ondataavailable → buffer + 마지막 청크 병합 resolve", async () => {
    const onChunk = jest.fn();
    const { stream } = buildMockStream();
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: stream, timeslice: 999999 }),
    );

    await act(async () => {
      await result.current.start();
    });

    const rec = instances[0];
    act(() => rec.ondataavailable?.({ data: new Blob([new ArrayBuffer(1000)]) }));

    let final: Blob | null | undefined;
    await act(async () => {
      const p = result.current.stop();
      rec.stop();
      rec.ondataavailable?.({ data: new Blob([new ArrayBuffer(500)]) });
      final = await p;
    });

    expect(final).toBeInstanceOf(Blob);
    expect(final!.size).toBe(1500);
  });

  it("stop() 진행 중 inactive + size=0 + buffer 보유 → buffer 만으로 resolve", async () => {
    const onChunk = jest.fn();
    const { stream } = buildMockStream();
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: stream, timeslice: 999999 }),
    );

    await act(async () => {
      await result.current.start();
    });

    const rec = instances[0];
    act(() => rec.ondataavailable?.({ data: new Blob([new ArrayBuffer(800)]) }));

    let final: Blob | null | undefined;
    await act(async () => {
      const p = result.current.stop();
      rec.stop();
      rec.ondataavailable?.({ data: new Blob([new ArrayBuffer(0)]) });
      final = await p;
    });

    expect(final).toBeInstanceOf(Blob);
    expect(final!.size).toBe(800);
  });

  it("stop() 진행 중 inactive + size=0 + buffer 비어있음 → resolve(null)", async () => {
    const onChunk = jest.fn();
    const { stream } = buildMockStream();
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: stream, timeslice: 999999 }),
    );

    await act(async () => {
      await result.current.start();
    });

    const rec = instances[0];

    let final: Blob | null | undefined;
    await act(async () => {
      const p = result.current.stop();
      rec.stop();
      rec.ondataavailable?.({ data: new Blob([new ArrayBuffer(0)]) });
      final = await p;
    });

    expect(final).toBeNull();
  });

  it("recorder.onstop 만 호출되고 ondataavailable 없을 때 → resolve(null)", async () => {
    const onChunk = jest.fn();
    const { stream } = buildMockStream();
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: stream }),
    );

    await act(async () => {
      await result.current.start();
    });

    const rec = instances[0];

    let final: Blob | null | undefined;
    await act(async () => {
      const p = result.current.stop();
      rec.stop();
      rec.onstop?.();
      final = await p;
    });

    expect(final).toBeNull();
  });
});

describe("useMediaRecorder — stop()/cleanup 분기", () => {
  it("start 전 stop() 호출 → resolve(null), isRecording=false 유지", async () => {
    const onChunk = jest.fn();
    const { stream } = buildMockStream();
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: stream }),
    );

    let res: Blob | null | undefined;
    await act(async () => {
      res = await result.current.stop();
    });

    expect(res).toBeNull();
    expect(result.current.isRecording).toBe(false);
  });

  it("externalStream 사용 시 stop() → 외부 stream tracks 는 stop 되지 않음 (guard)", async () => {
    const onChunk = jest.fn();
    const ext = buildMockStream();
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: ext.stream }),
    );

    await act(async () => {
      await result.current.start();
    });

    const rec = instances[0];
    await act(async () => {
      const p = result.current.stop();
      rec.stop();
      rec.onstop?.();
      await p;
    });

    expect(ext.sourceStop).not.toHaveBeenCalled();
    expect(ext.cloneStop).not.toHaveBeenCalled();
  });

  it("internal stream (getUserMedia) 사용 시 stop() → source + clone tracks 모두 stop", async () => {
    const onChunk = jest.fn();
    const internal = buildMockStream();
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce(internal.stream);

    const { result } = renderHook(() => useMediaRecorder({ onChunk }));

    await act(async () => {
      await result.current.start();
    });

    const rec = instances[0];
    await act(async () => {
      const p = result.current.stop();
      rec.stop();
      rec.onstop?.();
      await p;
    });

    expect(internal.sourceStop).toHaveBeenCalled();
    expect(internal.cloneStop).toHaveBeenCalled();
  });

  it("unmount 시 recording 중 → recorder.stop() + internal tracks stop", async () => {
    const onChunk = jest.fn();
    const internal = buildMockStream();
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce(internal.stream);

    const { result, unmount } = renderHook(() => useMediaRecorder({ onChunk }));

    await act(async () => {
      await result.current.start();
    });

    const rec = instances[0];
    expect(rec.state).toBe("recording");

    unmount();

    expect(rec.state).toBe("inactive");
    expect(internal.sourceStop).toHaveBeenCalled();
    expect(internal.cloneStop).toHaveBeenCalled();
  });
});
