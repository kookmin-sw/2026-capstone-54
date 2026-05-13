jest.mock("../client", () => ({
  BASE_URL: "https://api.test",
  getAccessToken: jest.fn(),
  refreshAccessToken: jest.fn(),
}));

import { openSseStream } from "../sse";
import { getAccessToken, refreshAccessToken } from "../client";

const mockGetToken = getAccessToken as jest.Mock;
const mockRefresh = refreshAccessToken as jest.Mock;

function asciiEncode(str: string): Uint8Array {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
  return arr;
}

interface MockReader {
  read: jest.Mock;
  cancel: jest.Mock;
}

function makeReader(chunks: string[]): MockReader {
  let idx = 0;
  return {
    read: jest.fn(() => {
      if (idx < chunks.length) {
        const c = chunks[idx++];
        return Promise.resolve({ value: asciiEncode(c), done: false });
      }
      return Promise.resolve({ value: undefined, done: true });
    }),
    cancel: jest.fn(() => Promise.resolve()),
  };
}

interface MockResponse {
  ok: boolean;
  status: number;
  body: { getReader: () => MockReader; cancel?: () => Promise<void> };
}

function makeOkResponse(chunks: string[]): MockResponse {
  return {
    ok: true,
    status: 200,
    body: { getReader: () => makeReader(chunks) },
  };
}

function makeErrResponse(status: number): MockResponse {
  return {
    ok: false,
    status,
    body: {
      getReader: () => makeReader([]),
      cancel: () => Promise.resolve(),
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetToken.mockReturnValue("tok-1");
  mockRefresh.mockResolvedValue(true);
  (globalThis as unknown as { fetch: jest.Mock }).fetch = jest.fn();
});

describe("openSseStream — 기본 파싱", () => {
  it("data 라인 → JSON 파싱 후 onEvent('message', obj)", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(makeOkResponse(['data: {"a":1}\n\n']));

    const events: Array<[string, unknown]> = [];
    await new Promise<void>((resolve) => {
      openSseStream("/sse/foo", (ev, data) => events.push([ev, data]), {
        onDone: resolve,
      });
    });

    expect(events).toEqual([["message", { a: 1 }]]);
  });

  it("event 라인 + data 라인 → onEvent(<event>, parsed)", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      makeOkResponse(['event: status\ndata: {"x":2}\n\n']),
    );

    const events: Array<[string, unknown]> = [];
    await new Promise<void>((resolve) => {
      openSseStream("/sse/foo", (ev, data) => events.push([ev, data]), {
        onDone: resolve,
      });
    });

    expect(events).toEqual([["status", { x: 2 }]]);
  });

  it("data 가 invalid JSON 이면 원본 문자열로 fallback", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      makeOkResponse(["event: error\ndata: not-json\n\n"]),
    );

    const events: Array<[string, unknown]> = [];
    await new Promise<void>((resolve) => {
      openSseStream("/sse/foo", (ev, data) => events.push([ev, data]), {
        onDone: resolve,
      });
    });

    expect(events).toEqual([["error", "not-json"]]);
  });

  it("event 라인 직후 빈 라인 + data → 두번째 onEvent 는 'message' 로 리셋", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      makeOkResponse([
        'event: status\ndata: {"a":1}\n\n',
        'data: {"b":2}\n\n',
      ]),
    );

    const events: Array<[string, unknown]> = [];
    await new Promise<void>((resolve) => {
      openSseStream("/sse/foo", (ev, data) => events.push([ev, data]), {
        onDone: resolve,
      });
    });

    expect(events).toEqual([
      ["status", { a: 1 }],
      ["message", { b: 2 }],
    ]);
  });

  it("chunk 가 라인 중간에서 끊겨도 다음 chunk 와 합쳐 완전한 라인으로 파싱", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      makeOkResponse(['event: sta', 'tus\ndata: {"a":1', '}\n\n']),
    );

    const events: Array<[string, unknown]> = [];
    await new Promise<void>((resolve) => {
      openSseStream("/sse/foo", (ev, data) => events.push([ev, data]), {
        onDone: resolve,
      });
    });

    expect(events).toEqual([["status", { a: 1 }]]);
  });
});

describe("openSseStream — 인증/URL", () => {
  it("Authorization 헤더에 getAccessToken() 결과를 Bearer 로 첨부", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(makeOkResponse([]));

    await new Promise<void>((resolve) => {
      openSseStream("/sse/foo", () => {}, { onDone: resolve });
    });

    const [url, init] = (fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://api.test/sse/foo");
    expect(init.headers.Authorization).toBe("Bearer tok-1");
    expect(init.headers.Accept).toBe("text/event-stream");
    expect(init.credentials).toBe("include");
  });

  it("getAccessToken null → Authorization 헤더 미설정", async () => {
    mockGetToken.mockReturnValue(null);
    (fetch as jest.Mock).mockResolvedValueOnce(makeOkResponse([]));

    await new Promise<void>((resolve) => {
      openSseStream("/sse/foo", () => {}, { onDone: resolve });
    });

    const [, init] = (fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("401 응답 → refreshAccessToken 호출 + 새 토큰으로 재요청", async () => {
    mockGetToken.mockReturnValueOnce("tok-old").mockReturnValueOnce("tok-new");
    (fetch as jest.Mock)
      .mockResolvedValueOnce(makeErrResponse(401))
      .mockResolvedValueOnce(makeOkResponse([]));

    await new Promise<void>((resolve) => {
      openSseStream("/sse/foo", () => {}, { onDone: resolve });
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect((fetch as jest.Mock)).toHaveBeenCalledTimes(2);
    const [, init2] = (fetch as jest.Mock).mock.calls[1];
    expect(init2.headers.Authorization).toBe("Bearer tok-new");
  });

  it("401 + refresh 실패 → 재요청 없이 401 응답 그대로 → onError", async () => {
    mockRefresh.mockResolvedValueOnce(false);
    (fetch as jest.Mock).mockResolvedValueOnce(makeErrResponse(401));

    const error = await new Promise<Error>((resolve) => {
      openSseStream("/sse/foo", () => {}, {
        onError: resolve,
      });
    });

    expect(error.message).toMatch(/SSE 401/);
    expect((fetch as jest.Mock)).toHaveBeenCalledTimes(1);
  });
});

describe("openSseStream — EOF 처리", () => {
  it("EOF + shouldReconnect 미지정 → onDone 호출, fetch 1 회", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(makeOkResponse(['data: {"a":1}\n\n']));

    const onDone = jest.fn();
    await new Promise<void>((resolve) => {
      openSseStream("/sse/foo", () => {}, {
        onDone: () => {
          onDone();
          resolve();
        },
      });
    });

    expect(onDone).toHaveBeenCalledTimes(1);
    expect((fetch as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it("EOF + shouldReconnect=true → 500ms 후 재연결 (fetch 2 회)", async () => {
    jest.useFakeTimers();

    (fetch as jest.Mock)
      .mockResolvedValueOnce(makeOkResponse(['data: {"n":1}\n\n']))
      .mockResolvedValueOnce(makeOkResponse(['data: {"n":2}\n\n']));

    const events: Array<[string, unknown]> = [];
    let reconnectCount = 0;
    const donePromise = new Promise<void>((resolve) => {
      openSseStream(
        "/sse/foo",
        (ev, data) => events.push([ev, data]),
        {
          shouldReconnect: () => {
            reconnectCount++;
            return reconnectCount === 1;
          },
          onDone: resolve,
        },
      );
    });

    await jest.advanceTimersByTimeAsync(600);
    await donePromise;
    jest.useRealTimers();

    expect((fetch as jest.Mock)).toHaveBeenCalledTimes(2);
    expect(events.length).toBe(2);
  });
});

describe("openSseStream — 에러 / 백오프 / cancel", () => {
  it("fetch reject (네트워크 에러) + shouldReconnect=false → onError 호출", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("network fail"));

    const error = await new Promise<Error>((resolve) => {
      openSseStream("/sse/foo", () => {}, { onError: resolve });
    });

    expect(error.message).toBe("network fail");
  });

  it("응답 !ok (5xx) → onError 호출", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(makeErrResponse(500));

    const error = await new Promise<Error>((resolve) => {
      openSseStream("/sse/foo", () => {}, { onError: resolve });
    });

    expect(error.message).toMatch(/SSE 500/);
  });

  it("shouldReconnect=true + 1 회 에러 → 백오프 후 재연결 성공", async () => {
    jest.useFakeTimers();
    (fetch as jest.Mock)
      .mockRejectedValueOnce(new Error("net err"))
      .mockResolvedValueOnce(makeOkResponse(['data: {"ok":true}\n\n']));

    const events: unknown[][] = [];
    let connectionCount = 0;
    const donePromise = new Promise<void>((resolve) => {
      openSseStream(
        "/sse/foo",
        (ev, data) => events.push([ev, data]),
        {
          shouldReconnect: () => {
            connectionCount++;
            return connectionCount === 1;
          },
          onDone: resolve,
        },
      );
    });

    await jest.advanceTimersByTimeAsync(1000);
    await donePromise;
    jest.useRealTimers();

    expect((fetch as jest.Mock)).toHaveBeenCalledTimes(2);
    expect(events).toEqual([["message", { ok: true }]]);
  });

  it("maxReconnectAttempts 초과 시 onError + 추가 재시도 없음", async () => {
    jest.useFakeTimers();
    (fetch as jest.Mock)
      .mockRejectedValueOnce(new Error("e1"))
      .mockRejectedValueOnce(new Error("e2"))
      .mockRejectedValueOnce(new Error("e3"));

    const errorPromise = new Promise<Error>((resolve) => {
      openSseStream("/sse/foo", () => {}, {
        shouldReconnect: () => true,
        maxReconnectAttempts: 2,
        onError: resolve,
      });
    });

    await jest.advanceTimersByTimeAsync(10_000);
    const err = await errorPromise;
    jest.useRealTimers();

    expect(err.message).toBe("e3");
    expect((fetch as jest.Mock)).toHaveBeenCalledTimes(3);
  });

  it("cancel() 호출 → AbortController.abort 후 종료 (이후 fetch 호출 없음)", async () => {
    jest.useFakeTimers();
    let resolveFetch: ((v: MockResponse) => void) | null = null;
    (fetch as jest.Mock).mockImplementationOnce(
      () => new Promise<MockResponse>((res) => {
        resolveFetch = res;
      }),
    );

    const onError = jest.fn();
    const onDone = jest.fn();
    const cancel = openSseStream("/sse/foo", () => {}, {
      onError,
      onDone,
      shouldReconnect: () => true,
    });

    cancel();

    resolveFetch?.(makeOkResponse(['data: {"a":1}\n\n']));
    await jest.advanceTimersByTimeAsync(1000);
    jest.useRealTimers();

    expect((fetch as jest.Mock)).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("cancel 중 sleepWithAbort → 즉시 종료 (재연결 X)", async () => {
    jest.useFakeTimers();
    (fetch as jest.Mock).mockResolvedValue(makeOkResponse([]));

    let cancelFn: (() => void) | null = null;
    const onDone = jest.fn();
    const startPromise = new Promise<void>((resolve) => {
      cancelFn = openSseStream("/sse/foo", () => {}, {
        shouldReconnect: () => true,
        onDone: () => {
          onDone();
          resolve();
        },
      });
    });

    void startPromise;
    await jest.advanceTimersByTimeAsync(100);
    cancelFn?.();
    await jest.advanceTimersByTimeAsync(1000);
    jest.useRealTimers();

    expect((fetch as jest.Mock).mock.calls.length).toBeLessThanOrEqual(2);
  });
});
