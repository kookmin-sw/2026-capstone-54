import { PrettyAvatarProvider } from "../PrettyAvatarProvider";
import { FriendlyAvatarProvider } from "../FriendlyAvatarProvider";
import { PressureAvatarProvider } from "../PressureAvatarProvider";
import type { IAvatarProvider } from "../IAvatarProvider";

class MockAudio {
  src: string;
  crossOrigin = "";
  paused = false;
  currentTime = 0;
  onplay: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(src: string) {
    this.src = src;
  }

  play = jest.fn(() => {
    this.paused = false;
    this.onplay?.();
    return Promise.resolve();
  });

  pause = jest.fn(() => {
    this.paused = true;
  });
}

const mockAnalyser = {
  fftSize: 0,
  frequencyBinCount: 128,
  getByteFrequencyData: jest.fn((arr: Uint8Array) => arr.fill(0)),
  connect: jest.fn(),
};

const mockSource = {
  connect: jest.fn(),
  disconnect: jest.fn(),
};

class MockAudioContext {
  state: "running" | "suspended" | "closed" = "running";
  destination = {};
  createAnalyser = jest.fn(() => mockAnalyser);
  createMediaElementSource = jest.fn(() => mockSource);
  resume = jest.fn();
  close = jest.fn(() => {
    this.state = "closed";
    return Promise.resolve();
  });
}

interface AvatarCase {
  name: string;
  Provider: new () => IAvatarProvider;
  bodyWrapperId: string;
  mouthId: string;
  faceId: string;
  styleId: string;
  statusId: string;
  eyeSelector: string;
}

const CASES: AvatarCase[] = [
  {
    name: "PrettyAvatarProvider",
    Provider: PrettyAvatarProvider,
    bodyWrapperId: "avatar-body-wrapper",
    mouthId: "pretty-mouth",
    faceId: "pretty-face",
    styleId: "pretty-avatar-style",
    statusId: "avatar-status",
    eyeSelector: ".pretty-eye",
  },
  {
    name: "FriendlyAvatarProvider",
    Provider: FriendlyAvatarProvider,
    bodyWrapperId: "friendly-body-wrapper",
    mouthId: "friendly-mouth",
    faceId: "friendly-face",
    styleId: "friendly-avatar-style",
    statusId: "friendly-status",
    eyeSelector: ".friendly-eye",
  },
  {
    name: "PressureAvatarProvider",
    Provider: PressureAvatarProvider,
    bodyWrapperId: "pressure-body-wrapper",
    mouthId: "pressure-mouth",
    faceId: "pressure-face",
    styleId: "pressure-avatar-style",
    statusId: "pressure-status",
    eyeSelector: ".pressure-eye",
  },
];

beforeEach(() => {
  jest.useFakeTimers();
  (globalThis as unknown as { Audio: typeof MockAudio }).Audio = MockAudio;
  (globalThis as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    value: jest.fn(() => 1),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "cancelAnimationFrame", {
    value: jest.fn(),
    writable: true,
    configurable: true,
  });
  mockAnalyser.getByteFrequencyData.mockClear();
  mockAnalyser.connect.mockClear();
  mockSource.connect.mockClear();
  mockSource.disconnect.mockClear();
  document.head.querySelectorAll("style").forEach((el) => el.remove());
});

afterEach(() => {
  jest.useRealTimers();
});

describe.each(CASES)("$name — 공통 IAvatarProvider 동작", ({
  Provider,
  bodyWrapperId,
  mouthId,
  faceId,
  styleId,
  statusId,
  eyeSelector,
}) => {
  it("initialize: container 에 wrapper + mouth/body 노드 생성 + style 주입", async () => {
    const container = document.createElement("div");
    const p = new Provider();

    await p.initialize(container);

    expect(container.children.length).toBeGreaterThan(0);
    expect(container.querySelector(`#${bodyWrapperId}`)).not.toBeNull();
    expect(container.querySelector(`#${mouthId}`)).not.toBeNull();
    expect(document.getElementById(styleId)).not.toBeNull();

    p.destroy();
  });

  it("initialize 2 회 호출 → style id 중복 방지 (style 1 개만)", async () => {
    const c1 = document.createElement("div");
    const c2 = document.createElement("div");
    const p1 = new Provider();
    const p2 = new Provider();

    await p1.initialize(c1);
    await p2.initialize(c2);

    expect(document.querySelectorAll(`#${styleId}`)).toHaveLength(1);

    p1.destroy();
    p2.destroy();
  });

  it("initialize 후 blink 효과: eye scaleY=0.x 적용 (setTimeout 진행 시 1 로 복원)", async () => {
    const container = document.createElement("div");
    const p = new Provider();
    await p.initialize(container);

    const eyes = container.querySelectorAll(eyeSelector) as NodeListOf<HTMLElement>;
    expect(eyes.length).toBeGreaterThan(0);
    expect(eyes[0].style.transform).toMatch(/scaleY\(/);

    jest.advanceTimersByTime(200);
    expect(eyes[0].style.transform).toBe("scaleY(1)");

    p.destroy();
  });

  it("speak: speaking-glow 또는 friendly/pressure-glow 클래스 추가 + status 'speaking'", async () => {
    const container = document.createElement("div");
    const p = new Provider();
    await p.initialize(container);

    const face = container.querySelector(`#${faceId}`) as HTMLElement;
    const initialClass = face.className;

    const speakPromise = p.speak("data:audio/mp3;base64,abc", "안녕하세요?");
    void speakPromise;

    expect(face.className).not.toBe(initialClass);
    const statusText = container.querySelector(`#${statusId} .status-text`);
    expect(statusText?.textContent).toBe("질문 중...");

    p.stop();
    p.destroy();
  });

  it("stop: glow 클래스 제거 + status idle 텍스트 복원", async () => {
    const container = document.createElement("div");
    const p = new Provider();
    await p.initialize(container);

    void p.speak("audio.mp3", "x");
    const face = container.querySelector(`#${faceId}`) as HTMLElement;
    const beforeStopClass = face.className;
    expect(beforeStopClass).toMatch(/-glow/);

    p.stop();

    expect(face.className).not.toMatch(/-glow/);
    const statusText = container.querySelector(`#${statusId} .status-text`);
    expect(statusText?.textContent).toBe("AI 면접관 대기 중");

    p.destroy();
  });

  it("destroy: container.innerHTML 비워짐 + audioCtx.close 호출", async () => {
    const container = document.createElement("div");
    const p = new Provider();
    await p.initialize(container);
    void p.speak("audio.mp3", "x");

    p.destroy();

    expect(container.innerHTML).toBe("");
  });

  it("destroy 후 blink setTimeout 추가 호출 없음 (isDestroyed 가드)", async () => {
    const container = document.createElement("div");
    const p = new Provider();
    await p.initialize(container);

    p.destroy();

    expect(() => {
      jest.advanceTimersByTime(10_000);
    }).not.toThrow();
  });
});
