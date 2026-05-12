const mockApiRequest = jest.fn();

jest.mock("../client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  BASE_URL: "https://api.test",
}));

import { RealtimeClient, type WsNotificationMessage } from "../realtimeApi";

interface MockWs {
  url: string;
  onopen: (() => void) | null;
  onmessage: ((e: { data: string }) => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
  close: jest.Mock;
}

let lastWs: MockWs | null = null;

class MockWebSocket {
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  close = jest.fn();

  constructor(url: string) {
    this.url = url;
    lastWs = this as unknown as MockWs;
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  lastWs = null;
  Object.defineProperty(globalThis, "WebSocket", {
    value: MockWebSocket,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("RealtimeClient.connect", () => {
  it("ticket fetch 성공 → wss URL 로 WebSocket 생성", async () => {
    mockApiRequest.mockResolvedValue({ ticket: "tk-123" });
    const client = new RealtimeClient({ onMessage: jest.fn() });

    await client.connect();
    expect(lastWs?.url).toBe("wss://api.test/ws/notifications/?ticket=tk-123");
  });

  it("ticket fetch 실패 (null) → WebSocket 생성 안 함", async () => {
    mockApiRequest.mockRejectedValue(new Error("fail"));
    const onMessage = jest.fn();
    const client = new RealtimeClient({ onMessage });

    await client.connect();
    expect(lastWs).toBeNull();
  });

  it("onmessage 유효 JSON → handlers.onMessage 호출", async () => {
    mockApiRequest.mockResolvedValue({ ticket: "tk" });
    const onMessage = jest.fn();
    await new RealtimeClient({ onMessage }).connect();

    const msg: WsNotificationMessage = {
      id: 1,
      message: "x",
      category: "system",
      createdAt: "",
      notifiableType: null,
      notifiableId: null,
    };
    lastWs?.onmessage?.({ data: JSON.stringify(msg) });
    expect(onMessage).toHaveBeenCalledWith(msg);
  });

  it("onmessage invalid JSON → 무시 (catch)", async () => {
    mockApiRequest.mockResolvedValue({ ticket: "tk" });
    const onMessage = jest.fn();
    await new RealtimeClient({ onMessage }).connect();

    expect(() => lastWs?.onmessage?.({ data: "not-json{" })).not.toThrow();
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("onclose → handlers.onClose 호출 + 재연결 timer 설정 (stopped=false 시)", async () => {
    mockApiRequest.mockResolvedValue({ ticket: "tk" });
    const onClose = jest.fn();
    const client = new RealtimeClient({ onMessage: jest.fn(), onClose });
    await client.connect();

    lastWs?.onclose?.();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("onclose 후 5s 경과 → 자동 재연결 시도 (retryCount=1)", async () => {
    mockApiRequest.mockResolvedValue({ ticket: "tk" });
    const client = new RealtimeClient({ onMessage: jest.fn() });
    await client.connect();

    lastWs?.onclose?.();
    await jest.advanceTimersByTimeAsync(5000);

    expect(mockApiRequest).toHaveBeenCalledTimes(2);
  });

  it("MAX_RETRIES (3) 초과 시 추가 재연결 안 함", async () => {
    mockApiRequest.mockResolvedValue({ ticket: "tk" });
    const client = new RealtimeClient({ onMessage: jest.fn() });
    await client.connect();

    for (let i = 0; i < 5; i++) {
      lastWs?.onclose?.();
      await jest.advanceTimersByTimeAsync(60_000);
    }

    expect(mockApiRequest.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it("onerror → ws.close 호출 (재시도 차단)", async () => {
    mockApiRequest.mockResolvedValue({ ticket: "tk" });
    await new RealtimeClient({ onMessage: jest.fn() }).connect();

    lastWs?.onerror?.();
    expect(lastWs?.close).toHaveBeenCalled();
  });
});

describe("RealtimeClient.disconnect", () => {
  it("stopped=true + ws.close + 재연결 timer 클리어", async () => {
    mockApiRequest.mockResolvedValue({ ticket: "tk" });
    const client = new RealtimeClient({ onMessage: jest.fn() });
    await client.connect();

    client.disconnect();
    expect(lastWs?.close).toHaveBeenCalled();

    lastWs?.onclose?.();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(mockApiRequest).toHaveBeenCalledTimes(1);
  });
});
