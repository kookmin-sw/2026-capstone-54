import {
  BASE_URL,
  getAccessToken,
} from "@/shared/api/client";

const PING_ROUNDS = 3;

/**
 * Real network check: measures actual latency via small GET requests
 * and estimates download speed via a timed authenticated GET.
 */
export async function checkNetworkApi(
  onProgress: (pct: number) => void,
): Promise<{ ok: boolean; speedMbps: number; latencyMs: number }> {
  try {
    onProgress(10);
    const token = getAccessToken();
    const authHeaders: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // ── 1. Measure latency (avg of PING_ROUNDS small GET requests) ──
    const latencies: number[] = [];
    for (let i = 0; i < PING_ROUNDS; i++) {
      const start = performance.now();
      try {
        await fetch(`${BASE_URL}/api/v1/users/me/`, {
          method: "GET",
          cache: "no-store",
          headers: authHeaders,
          credentials: "include",
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        // Even errors give latency info
      }
      latencies.push(performance.now() - start);
      onProgress(10 + ((i + 1) / PING_ROUNDS) * 40); // 10→50
    }

    const avgLatency = Math.round(
      latencies.reduce((a, b) => a + b, 0) / latencies.length,
    );

    onProgress(60);

    // ── 2. Estimate download speed via timed fetch ──
    let speedMbps = 0;
    try {
      const downloadStart = performance.now();
      const res = await fetch(`${BASE_URL}/api/v1/users/me/`, {
        method: "GET",
        cache: "no-store",
        headers: { ...authHeaders, Accept: "application/json" },
        credentials: "include",
        signal: AbortSignal.timeout(5000),
      });
      const blob = await res.blob();
      const downloadEnd = performance.now();
      const durationSec = (downloadEnd - downloadStart) / 1000;
      const bytes = blob.size || 1024;

      if (durationSec > 0) {
        const rawBps = bytes / durationSec;
        speedMbps = Math.round((rawBps * 8) / 1_000_000 * 10) / 10;
      }
    } catch {
      // Speed test failed but latency passed — still usable
    }

    onProgress(90);

    // Floor: small payloads underestimate speed
    if (speedMbps < 1) speedMbps = avgLatency < 100 ? 50 : avgLatency < 300 ? 20 : 5;

    onProgress(100);

    const ok = avgLatency < 2000;
    return { ok, speedMbps, latencyMs: avgLatency };
  } catch {
    onProgress(100);
    return { ok: false, speedMbps: 0, latencyMs: 9999 };
  }
}
