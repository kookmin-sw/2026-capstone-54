jest.mock("@/shared/api/client", () => ({
  BASE_URL: "https://api.test",
  getAccessToken: jest.fn(),
}));

import { getAccessToken } from "@/shared/api/client";
import { checkNetworkApi } from "../checkNetwork";

const mockGetToken = getAccessToken as jest.Mock;

interface FetchCall {
  url: string;
  init: RequestInit;
}

let fetchCalls: FetchCall[] = [];
let perfTime = 0;

beforeEach(() => {
  jest.clearAllMocks();
  fetchCalls = [];
  perfTime = 1000;

  mockGetToken.mockReturnValue("tok-1");

  Object.defineProperty(globalThis, "performance", {
    value: { now: () => perfTime },
    writable: true,
    configurable: true,
  });

  if (typeof (AbortSignal as { timeout?: (ms: number) => AbortSignal }).timeout !== "function") {
    (AbortSignal as { timeout: (ms: number) => AbortSignal }).timeout = () =>
      ({ aborted: false } as unknown as AbortSignal);
  }
});

function installFetch(impl: () => Promise<unknown>): void {
  (globalThis as unknown as { fetch: jest.Mock }).fetch = jest.fn(async (url: string, init: RequestInit) => {
    fetchCalls.push({ url, init });
    perfTime += 50;
    return impl();
  });
}

describe("checkNetworkApi — 정상 경로", () => {
  it("정상 응답 → ok=true + speedMbps + latencyMs + onProgress 호출", async () => {
    installFetch(async () => ({
      ok: true,
      blob: async () => ({ size: 5120 }),
    }));

    const onProgress = jest.fn();
    const result = await checkNetworkApi(onProgress);

    expect(result.ok).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.speedMbps).toBeGreaterThan(0);

    expect(onProgress).toHaveBeenCalledWith(10);
    expect(onProgress).toHaveBeenCalledWith(100);
  });

  it("Authorization Bearer 헤더 첨부 (token 있음)", async () => {
    installFetch(async () => ({ ok: true, blob: async () => ({ size: 100 }) }));

    await checkNetworkApi(jest.fn());

    const authHeaders = fetchCalls.map((c) => (c.init.headers as Record<string, string>).Authorization);
    expect(authHeaders[0]).toBe("Bearer tok-1");
  });

  it("token 없음 → Authorization 헤더 미설정", async () => {
    mockGetToken.mockReturnValue(null);
    installFetch(async () => ({ ok: true, blob: async () => ({ size: 100 }) }));

    await checkNetworkApi(jest.fn());

    const auth = (fetchCalls[0].init.headers as Record<string, string>).Authorization;
    expect(auth).toBeUndefined();
  });

  it("ping fetch 3 회 호출 (PING_ROUNDS) + speed test 1 회 = 총 4 회", async () => {
    installFetch(async () => ({ ok: true, blob: async () => ({ size: 100 }) }));

    await checkNetworkApi(jest.fn());

    expect(fetchCalls).toHaveLength(4);
  });

  it("latency 5 초 이상 (ping 실패) → ok=false (avgLatency >= 2000 조건)", async () => {
    (globalThis as unknown as { fetch: jest.Mock }).fetch = jest.fn(async () => {
      perfTime += 3000;
      throw new Error("network fail");
    });

    const result = await checkNetworkApi(jest.fn());
    expect(result.ok).toBe(false);
  });

  it("speedMbps 측정 실패해도 latency 측정 성공 → speedMbps fallback 적용", async () => {
    let callCount = 0;
    (globalThis as unknown as { fetch: jest.Mock }).fetch = jest.fn(async () => {
      perfTime += 30;
      callCount++;
      if (callCount <= 3) {
        return { ok: true };
      }
      throw new Error("speed test fail");
    });

    const result = await checkNetworkApi(jest.fn());

    expect(result.ok).toBe(true);
    expect(result.speedMbps).toBeGreaterThan(0);
  });
});

describe("checkNetworkApi — onProgress 단계", () => {
  it("진행률 단계: 10 → 50 (ping 3회) → 60 → 90 → 100", async () => {
    installFetch(async () => ({ ok: true, blob: async () => ({ size: 100 }) }));

    const progressValues: number[] = [];
    const onProgress = jest.fn((p: number) => progressValues.push(p));

    await checkNetworkApi(onProgress);

    expect(progressValues).toContain(10);
    expect(progressValues).toContain(60);
    expect(progressValues).toContain(90);
    expect(progressValues).toContain(100);
  });
});
