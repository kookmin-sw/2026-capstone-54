jest.mock("@/shared/api/client", () => ({
  BASE_URL: "https://api.test",
}));

import {
  InterviewSessionWsClient,
  WS_CLOSE_EVICTED,
  WS_CLOSE_SESSION_NOT_FOUND,
} from "../sessionWs";

interface MockWs {
  url: string;
  onopen: (() => void) | null;
  onmessage: ((e: { data: string }) => void) | null;
  onclose: ((e: { code: number }) => void) | null;
  onerror: (() => void) | null;
  send: jest.Mock;
  close: jest.Mock;
  readyState: number;
}

let lastWs: MockWs | null = null;

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  send = jest.fn();
  close = jest.fn();
  readyState = 1;

  constructor(url: string) {
    this.url = url;
    lastWs = this as unknown as MockWs;
  }
}

beforeEach(() => {
  lastWs = null;
  Object.defineProperty(globalThis, "WebSocket", {
    value: MockWebSocket,
    writable: true,
    configurable: true,
  });
});

describe("InterviewSessionWsClient — connect", () => {
  it("connect → WebSocket URL 빌드 (wss + ticket 인코딩)", () => {
    const client = new InterviewSessionWsClient({});
    client.connect("sess-1", "raw ticket/value");

    expect(lastWs?.url).toBe("wss://api.test/ws/interviews/sess-1/?ticket=raw%20ticket%2Fvalue");
  });

  it("onopen 핸들러 → handlers.onOpen 호출", () => {
    const onOpen = jest.fn();
    new InterviewSessionWsClient({ onOpen }).connect("s", "t");

    lastWs?.onopen?.();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("onmessage JSON 파싱 + handlers.onMessage 호출", () => {
    const onMessage = jest.fn();
    new InterviewSessionWsClient({ onMessage }).connect("s", "t");

    lastWs?.onmessage?.({ data: JSON.stringify({ type: "ping", n: 1 }) });
    expect(onMessage).toHaveBeenCalledWith({ type: "ping", n: 1 });
  });

  it("onmessage invalid JSON → 무시 (catch)", () => {
    const onMessage = jest.fn();
    new InterviewSessionWsClient({ onMessage }).connect("s", "t");

    expect(() => lastWs?.onmessage?.({ data: "not-json{" })).not.toThrow();
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("onclose → handlers.onClose(code) 호출", () => {
    const onClose = jest.fn();
    new InterviewSessionWsClient({ onClose }).connect("s", "t");

    lastWs?.onclose?.({ code: 1000 });
    expect(onClose).toHaveBeenCalledWith(1000);
  });

  it("onclose code=WS_CLOSE_EVICTED + stopped=false → onEvicted 호출", () => {
    const onEvicted = jest.fn();
    new InterviewSessionWsClient({ onEvicted }).connect("s", "t");

    lastWs?.onclose?.({ code: WS_CLOSE_EVICTED });
    expect(onEvicted).toHaveBeenCalledTimes(1);
  });

  it("disconnect 후 onclose=EVICTED → onEvicted 호출 안 됨 (stopped 가드)", () => {
    const onEvicted = jest.fn();
    const client = new InterviewSessionWsClient({ onEvicted });
    client.connect("s", "t");

    client.disconnect();
    lastWs?.onclose?.({ code: WS_CLOSE_EVICTED });
    expect(onEvicted).not.toHaveBeenCalled();
  });

  it("onclose 다른 code (예: SESSION_NOT_FOUND) → onEvicted 미호출", () => {
    const onEvicted = jest.fn();
    new InterviewSessionWsClient({ onEvicted }).connect("s", "t");

    lastWs?.onclose?.({ code: WS_CLOSE_SESSION_NOT_FOUND });
    expect(onEvicted).not.toHaveBeenCalled();
  });

  it("onerror → ws.close 호출 (재시도 차단)", () => {
    new InterviewSessionWsClient({}).connect("s", "t");
    lastWs?.onerror?.();
    expect(lastWs?.close).toHaveBeenCalled();
  });
});

describe("InterviewSessionWsClient — send / 헬퍼", () => {
  it("readyState=OPEN → send 호출 (JSON 직렬화)", () => {
    const client = new InterviewSessionWsClient({});
    client.connect("s", "t");
    if (lastWs) lastWs.readyState = 1;

    client.send({ type: "msg", n: 1 });

    expect(lastWs?.send).toHaveBeenCalledWith(JSON.stringify({ type: "msg", n: 1 }));
  });

  it("readyState !== OPEN → send 호출 안 됨", () => {
    const client = new InterviewSessionWsClient({});
    client.connect("s", "t");
    if (lastWs) lastWs.readyState = 3;

    client.send({ type: "msg" });
    expect(lastWs?.send).not.toHaveBeenCalled();
  });

  it("sendPause/sendResume/sendHeartbeat → 정확한 type 메시지 전송", () => {
    const client = new InterviewSessionWsClient({});
    client.connect("s", "t");
    if (lastWs) lastWs.readyState = 1;

    client.sendPause("network");
    const calls = lastWs?.send.mock.calls ?? [];
    expect(calls[calls.length - 1][0]).toBe(JSON.stringify({ type: "pause", reason: "network" }));

    client.sendResume();
    const calls2 = lastWs?.send.mock.calls ?? [];
    expect(calls2[calls2.length - 1][0]).toBe(JSON.stringify({ type: "resume" }));

    client.sendHeartbeat();
    const calls3 = lastWs?.send.mock.calls ?? [];
    const heartbeat = JSON.parse(calls3[calls3.length - 1][0] as string);
    expect(heartbeat.type).toBe("heartbeat");
    expect(typeof heartbeat.ts).toBe("number");
  });
});

describe("InterviewSessionWsClient — disconnect", () => {
  it("ws.close 호출 + this.ws=null + stopped=true", () => {
    const client = new InterviewSessionWsClient({});
    client.connect("s", "t");

    client.disconnect();
    expect(lastWs?.close).toHaveBeenCalled();
  });

  it("disconnect 후 send → no-op (ws=null)", () => {
    const client = new InterviewSessionWsClient({});
    client.connect("s", "t");
    const wsBefore = lastWs;
    client.disconnect();

    client.send({ type: "x" });
    expect(wsBefore?.send).not.toHaveBeenCalled();
  });
});
