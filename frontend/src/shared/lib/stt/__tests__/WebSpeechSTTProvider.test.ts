import { WebSpeechSTTProvider } from "../WebSpeechSTTProvider";
import type { STTResult } from "../types";

interface MockResultEntry {
  transcript: string;
  isFinal: boolean;
}

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  startCount = 0;
  stopCount = 0;

  start(): void {
    this.startCount++;
  }
  stop(): void {
    this.stopCount++;
  }
  addEventListener(): void {}
  removeEventListener(): void {}

  emitResult(entries: MockResultEntry[]): void {
    const results = entries.map((e) => ({
      isFinal: e.isFinal,
      0: { transcript: e.transcript, confidence: 1 },
      length: 1,
    }));
    (results as unknown as { length: number }).length = entries.length;
    this.onresult?.({ resultIndex: 0, results });
  }

  emitError(error: string): void {
    this.onerror?.({ error });
  }

  emitEnd(): void {
    this.onend?.();
  }
}

let lastInstance: MockSpeechRecognition | null = null;

function installSpeechRecognition(): void {
  (window as unknown as Record<string, unknown>).SpeechRecognition = function () {
    lastInstance = new MockSpeechRecognition();
    return lastInstance;
  };
}

function uninstallSpeechRecognition(): void {
  delete (window as { SpeechRecognition?: unknown }).SpeechRecognition;
  delete (window as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
}

beforeEach(() => {
  uninstallSpeechRecognition();
  lastInstance = null;
});

afterEach(() => {
  uninstallSpeechRecognition();
  lastInstance = null;
});

describe("WebSpeechSTTProvider — 미지원 환경", () => {
  it("SpeechRecognition 가 window 에 없음 → console.error + recognition=null", () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const p = new WebSpeechSTTProvider();
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("Web Speech API"));

    expect(() => p.start("ko-KR")).not.toThrow();
    expect(() => p.stop()).not.toThrow();

    errSpy.mockRestore();
  });
});

describe("WebSpeechSTTProvider — 정상 동작", () => {
  beforeEach(() => {
    installSpeechRecognition();
  });

  it("constructor → continuous=true, interimResults=true 설정", () => {
    new WebSpeechSTTProvider();

    expect(lastInstance).not.toBeNull();
    expect(lastInstance!.continuous).toBe(true);
    expect(lastInstance!.interimResults).toBe(true);
  });

  it("start(lang) → recognition.lang 설정 + recognition.start() 호출 + startTime 갱신", () => {
    const before = Date.now();
    const p = new WebSpeechSTTProvider();

    p.start("en-US");

    expect(lastInstance!.lang).toBe("en-US");
    expect(lastInstance!.startCount).toBe(1);
    expect(p.getStartTime()).toBeGreaterThanOrEqual(before);
  });

  it("recognition.start 가 throw 해도 swallow (already started)", () => {
    const p = new WebSpeechSTTProvider();
    lastInstance!.start = () => {
      throw new Error("already started");
    };

    expect(() => p.start("ko-KR")).not.toThrow();
  });

  it("stop() → isIntentionalStop=true + recognition.stop()", () => {
    const p = new WebSpeechSTTProvider();
    p.start("ko-KR");
    p.stop();
    expect(lastInstance!.stopCount).toBe(1);
  });

  it("onresult: final transcript → resultCallback({ text, isFinal:true, timestampMs })", () => {
    const p = new WebSpeechSTTProvider();
    const cb = jest.fn();
    p.onResult(cb);
    p.start("ko-KR");

    lastInstance!.emitResult([{ transcript: "최종 결과", isFinal: true }]);

    expect(cb).toHaveBeenCalledTimes(1);
    const result = cb.mock.calls[0][0] as STTResult;
    expect(result.text).toBe("최종 결과");
    expect(result.isFinal).toBe(true);
    expect(result.timestampMs).toBeGreaterThanOrEqual(0);
  });

  it("onresult: interim transcript → resultCallback({ isFinal:false })", () => {
    const p = new WebSpeechSTTProvider();
    const cb = jest.fn();
    p.onResult(cb);
    p.start("ko-KR");

    lastInstance!.emitResult([{ transcript: "임시 결과", isFinal: false }]);

    expect(cb).toHaveBeenCalledTimes(1);
    expect((cb.mock.calls[0][0] as STTResult).isFinal).toBe(false);
  });

  it("onresult: final + interim 동시 존재 → 2 회 호출 (final 먼저, interim 다음)", () => {
    const p = new WebSpeechSTTProvider();
    const cb = jest.fn();
    p.onResult(cb);
    p.start("ko-KR");

    lastInstance!.emitResult([
      { transcript: "확정", isFinal: true },
      { transcript: "임시", isFinal: false },
    ]);

    expect(cb).toHaveBeenCalledTimes(2);
    expect((cb.mock.calls[0][0] as STTResult).isFinal).toBe(true);
    expect((cb.mock.calls[1][0] as STTResult).isFinal).toBe(false);
  });

  it("onresult: resultCallback 미설정 → 호출 안전 (no throw)", () => {
    const p = new WebSpeechSTTProvider();
    p.start("ko-KR");

    expect(() =>
      lastInstance!.emitResult([{ transcript: "x", isFinal: true }]),
    ).not.toThrow();
  });

  it("onerror: 'no-speech' → errorCallback 미호출 (정상 종료 케이스 무시)", () => {
    const p = new WebSpeechSTTProvider();
    const errCb = jest.fn();
    p.onError(errCb);

    lastInstance!.emitError("no-speech");

    expect(errCb).not.toHaveBeenCalled();
  });

  it("onerror: 'no-speech' 외 에러 → errorCallback 호출", () => {
    const p = new WebSpeechSTTProvider();
    const errCb = jest.fn();
    p.onError(errCb);

    lastInstance!.emitError("network");

    expect(errCb).toHaveBeenCalledWith("network");
  });

  it("onend: isIntentionalStop=false (stop 호출 안 함) → recognition.start() 자동 재시작", () => {
    const p = new WebSpeechSTTProvider();
    p.start("ko-KR");
    expect(lastInstance!.startCount).toBe(1);

    lastInstance!.emitEnd();
    expect(lastInstance!.startCount).toBe(2);
  });

  it("onend: stop() 후 isIntentionalStop=true → 재시작 안 함", () => {
    const p = new WebSpeechSTTProvider();
    p.start("ko-KR");
    expect(lastInstance!.startCount).toBe(1);

    p.stop();
    lastInstance!.emitEnd();
    expect(lastInstance!.startCount).toBe(1);
  });

  it("switchLanguage: stop → 400ms 후 새 lang 으로 start", () => {
    jest.useFakeTimers();
    const p = new WebSpeechSTTProvider();
    p.start("ko-KR");

    p.switchLanguage("en-US");
    expect(lastInstance!.stopCount).toBe(1);
    expect(lastInstance!.startCount).toBe(1);

    jest.advanceTimersByTime(400);

    expect(lastInstance!.startCount).toBe(2);
    expect(lastInstance!.lang).toBe("en-US");
    jest.useRealTimers();
  });
});

describe("WebSpeechSTTProvider — webkit prefix fallback", () => {
  it("webkitSpeechRecognition 만 있을 때 → 정상 인스턴스화", () => {
    let webkitInstance: MockSpeechRecognition | null = null;
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = function () {
      webkitInstance = new MockSpeechRecognition();
      return webkitInstance;
    };

    const p = new WebSpeechSTTProvider();
    p.start("ko-KR");

    expect(webkitInstance).not.toBeNull();
    expect(webkitInstance!.startCount).toBe(1);
  });
});
