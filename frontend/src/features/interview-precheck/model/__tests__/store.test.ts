const mockCheckCamera = jest.fn();
const mockCheckMic = jest.fn();
const mockCheckGpu = jest.fn();
const mockCheckNetwork = jest.fn();

jest.mock("../../api", () => ({
  checkCameraApi: (...a: unknown[]) => mockCheckCamera(...a),
  checkMicApi: (...a: unknown[]) => mockCheckMic(...a),
  checkGpuApi: (...a: unknown[]) => mockCheckGpu(...a),
  checkNetworkApi: (...a: unknown[]) => mockCheckNetwork(...a),
}));

import { usePrecheckStore } from "../store";

const mockGain = {
  gain: { value: 0 },
  connect: jest.fn(),
};

class MockAudioContext {
  state = "running";
  destination = {};
  close = jest.fn(async () => {});
  createGain = jest.fn(() => mockGain);
  createAnalyser = jest.fn(() => ({
    fftSize: 0,
    frequencyBinCount: 32,
    getByteFrequencyData: jest.fn((arr: Uint8Array) => arr.fill(0)),
    connect: jest.fn(),
  }));
  createMediaStreamSource = jest.fn(() => ({ connect: jest.fn(), disconnect: jest.fn() }));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  (globalThis as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    value: { getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] }) },
    writable: true,
    configurable: true,
  });

  usePrecheckStore.getState().reset();
});

afterEach(() => {
  usePrecheckStore.getState().reset();
  jest.useRealTimers();
});

describe("usePrecheckStore — 초기 상태", () => {
  it("초기: 모든 status 'idle', cameraInfo/micInfo=null", () => {
    const s = usePrecheckStore.getState();
    expect(s.cameraStatus).toBe("idle");
    expect(s.micStatus).toBe("idle");
    expect(s.networkStatus).toBe("idle");
    expect(s.gpuStatus).toBe("idle");
    expect(s.cameraInfo).toBeNull();
    expect(s.micInfo).toBeNull();
    expect(s.allPassed).toBe(false);
  });
});

describe("usePrecheckStore — startChecks", () => {
  it("startChecks 호출 → 4개 status 'checking' 으로 초기화", async () => {
    mockCheckCamera.mockResolvedValue({ ok: true, info: { resolution: "1280×720", deviceName: "x" }, stream: { getTracks: () => [{ stop: jest.fn() }] } });
    mockCheckMic.mockResolvedValue({ ok: true, info: { deviceName: "Mic", level: 0 } });
    mockCheckGpu.mockResolvedValue({ ok: true, info: "Apple M2" });
    mockCheckNetwork.mockImplementation(async (onProgress: (p: number) => void) => {
      onProgress(100);
      return { ok: true, speedMbps: 50, latencyMs: 30 };
    });

    usePrecheckStore.getState().startChecks();
    expect(usePrecheckStore.getState().cameraStatus).toBe("checking");
    expect(usePrecheckStore.getState().micStatus).toBe("checking");
    expect(usePrecheckStore.getState().networkStatus).toBe("checking");
    expect(usePrecheckStore.getState().gpuStatus).toBe("checking");

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(usePrecheckStore.getState().cameraStatus).toBe("ok");
    expect(usePrecheckStore.getState().micStatus).toBe("ok");
    expect(usePrecheckStore.getState().gpuStatus).toBe("ok");
    expect(usePrecheckStore.getState().networkStatus).toBe("ok");
  });

  it("camera 실패 → cameraStatus='fail' + cameraStream=null", async () => {
    mockCheckCamera.mockResolvedValue({ ok: false, info: { resolution: "-", deviceName: "-" } });
    mockCheckMic.mockResolvedValue({ ok: false, info: { deviceName: "-", level: 0 } });
    mockCheckGpu.mockResolvedValue({ ok: false, info: "WebGL 미지원" });
    mockCheckNetwork.mockResolvedValue({ ok: false, speedMbps: 0, latencyMs: 9999 });

    usePrecheckStore.getState().startChecks();
    await Promise.resolve();
    await Promise.resolve();

    expect(usePrecheckStore.getState().cameraStatus).toBe("fail");
    expect(usePrecheckStore.getState().cameraStream).toBeNull();
  });

  it("network 진행률 콜백 → networkProgress 갱신", async () => {
    let progressCb: ((p: number) => void) | null = null;
    mockCheckCamera.mockResolvedValue({ ok: true, info: {}, stream: { getTracks: () => [{ stop: jest.fn() }] } });
    mockCheckMic.mockResolvedValue({ ok: true, info: {} });
    mockCheckGpu.mockResolvedValue({ ok: true, info: "" });
    mockCheckNetwork.mockImplementation((onProgress: (p: number) => void) => {
      progressCb = onProgress;
      return new Promise(() => {});
    });

    usePrecheckStore.getState().startChecks();
    await Promise.resolve();

    progressCb!(45);
    expect(usePrecheckStore.getState().networkProgress).toBe(45);
  });

  it("allPassed: camera/mic/network 모두 ok → poll 후 true 설정", async () => {
    mockCheckCamera.mockResolvedValue({ ok: true, info: {}, stream: { getTracks: () => [{ stop: jest.fn() }] } });
    mockCheckMic.mockResolvedValue({ ok: true, info: {} });
    mockCheckGpu.mockResolvedValue({ ok: false, info: "" });
    mockCheckNetwork.mockResolvedValue({ ok: true, speedMbps: 100, latencyMs: 10 });

    usePrecheckStore.getState().startChecks();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    jest.advanceTimersByTime(200);
    expect(usePrecheckStore.getState().allPassed).toBe(true);
  });

  it("network 만 실패 → allPassed=false 유지 (network 는 critical)", async () => {
    mockCheckCamera.mockResolvedValue({ ok: true, info: {}, stream: { getTracks: () => [{ stop: jest.fn() }] } });
    mockCheckMic.mockResolvedValue({ ok: true, info: {} });
    mockCheckGpu.mockResolvedValue({ ok: true, info: "" });
    mockCheckNetwork.mockResolvedValue({ ok: false, speedMbps: 0, latencyMs: 9999 });

    usePrecheckStore.getState().startChecks();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    jest.advanceTimersByTime(200);
    expect(usePrecheckStore.getState().allPassed).toBe(false);
  });
});

describe("usePrecheckStore — reset / stopMicTimer", () => {
  it("reset → 모든 status 'idle' + 데이터 초기화", () => {
    usePrecheckStore.setState({
      cameraStatus: "ok",
      micStatus: "ok",
      cameraInfo: { resolution: "x", deviceName: "x" },
      networkSpeed: "1 Mbps",
      networkLatency: "10ms",
      allPassed: true,
    });

    usePrecheckStore.getState().reset();
    const s = usePrecheckStore.getState();
    expect(s.cameraStatus).toBe("idle");
    expect(s.micStatus).toBe("idle");
    expect(s.cameraInfo).toBeNull();
    expect(s.networkSpeed).toBe("측정 중...");
    expect(s.allPassed).toBe(false);
  });

  it("stopMicTimer → cameraStream null + 리소스 정리 (no throw)", () => {
    expect(() => usePrecheckStore.getState().stopMicTimer()).not.toThrow();
    expect(usePrecheckStore.getState().cameraStream).toBeNull();
  });
});
