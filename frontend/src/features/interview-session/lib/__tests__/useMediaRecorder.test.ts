import { renderHook, act } from "@testing-library/react";
import { useMediaRecorder } from "../useMediaRecorder";

const mockPauseFn = jest.fn();
const mockResumeFn = jest.fn();

class MockMediaRecorder {
  state: string = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  private timeslice = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  static isTypeSupported = jest.fn(() => true);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_stream: MediaStream, _options?: { mimeType?: string }) {
    /* noop */
  }

  start(timeslice?: number) {
    this.state = "recording";
    this.timeslice = timeslice ?? 0;
    if (this.timeslice > 0) {
      this.intervalId = setInterval(() => {
        this.ondataavailable?.({ data: new Blob([new ArrayBuffer(100)]) });
      }, this.timeslice);
    }
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob([new ArrayBuffer(50)]) });
    this.onstop?.();
  }

  pause() {
    mockPauseFn();
    if (this.state === "recording") {
      this.state = "paused";
      if (this.intervalId) clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resume() {
    mockResumeFn();
    if (this.state === "paused") {
      this.state = "recording";
      if (this.timeslice > 0) {
        this.intervalId = setInterval(() => {
          this.ondataavailable?.({ data: new Blob([new ArrayBuffer(100)]) });
        }, this.timeslice);
      }
    }
  }

  addEventListener() { /* noop */ }
  removeEventListener() { /* noop */ }
}

const mockTrack = { stop: jest.fn(), kind: "video" as const, enabled: true, readyState: "live" as const };
const mockStream = {
  getTracks: () => [mockTrack],
  clone: () => ({ getTracks: () => [{ ...mockTrack, stop: jest.fn() }], clone: () => mockStream }),
} as unknown as MediaStream;

beforeAll(() => {
  Object.defineProperty(globalThis, "MediaRecorder", { value: MockMediaRecorder, writable: true });
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    value: { getUserMedia: jest.fn().mockResolvedValue(mockStream) },
    writable: true,
  });
});

describe("useMediaRecorder", () => {
  const onChunk = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("externalStream으로 start 시 MediaRecorder가 시작된다", async () => {
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: mockStream, timeslice: 100 }),
    );

    await act(async () => { await result.current.start(); });

    expect(result.current.isRecording).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("start → stop 시 isRecording=false로 전환된다", async () => {
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: mockStream, timeslice: 50000 }),
    );

    await act(async () => { await result.current.start(); });
    expect(result.current.isRecording).toBe(true);

    await act(async () => { await result.current.stop(); });
    expect(result.current.isRecording).toBe(false);
  });

  it("이미 recording 중이면 start()가 skip된다", async () => {
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: mockStream }),
    );

    await act(async () => { await result.current.start(); });
    expect(result.current.isRecording).toBe(true);

    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    await act(async () => { await result.current.start(); });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("skipped"));
    warnSpy.mockRestore();
  });

  it("stop → start → stop 순서가 정상 작동한다 (ref 기반)", async () => {
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: mockStream }),
    );

    await act(async () => { await result.current.start(); });
    await act(async () => { await result.current.stop(); });
    expect(result.current.isRecording).toBe(false);

    await act(async () => { await result.current.start(); });
    expect(result.current.isRecording).toBe(true);

    await act(async () => { await result.current.stop(); });
    expect(result.current.isRecording).toBe(false);
  });

  it("시작 실패 시 throw한다", async () => {
    Object.defineProperty(globalThis, "MediaRecorder", { value: undefined, writable: true });

    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: mockStream }),
    );

    await expect(
      act(async () => { await result.current.start(); }),
    ).rejects.toThrow();

    Object.defineProperty(globalThis, "MediaRecorder", { value: MockMediaRecorder, writable: true });
  });

  it("pause(): recording 상태에서 MediaRecorder.pause() 호출", async () => {
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: mockStream, timeslice: 50000 }),
    );

    await act(async () => { await result.current.start(); });
    expect(result.current.isRecording).toBe(true);

    act(() => { result.current.pause(); });
    expect(mockPauseFn).toHaveBeenCalledTimes(1);
  });

  it("resume(): paused 상태에서 MediaRecorder.resume() 호출", async () => {
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: mockStream, timeslice: 50000 }),
    );

    await act(async () => { await result.current.start(); });
    act(() => { result.current.pause(); });

    act(() => { result.current.resume(); });
    expect(mockResumeFn).toHaveBeenCalledTimes(1);
  });

  it("pause(): recorder 가 없을 때 no-op (start 전 호출)", () => {
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: mockStream }),
    );

    act(() => { result.current.pause(); });
    expect(mockPauseFn).not.toHaveBeenCalled();
  });

  it("resume(): recording 상태 (paused 아님) 에서 no-op", async () => {
    const { result } = renderHook(() =>
      useMediaRecorder({ onChunk, externalStream: mockStream, timeslice: 50000 }),
    );

    await act(async () => { await result.current.start(); });

    act(() => { result.current.resume(); });
    expect(mockResumeFn).not.toHaveBeenCalled();
  });
});
