const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface CameraInfo {
  resolution: string;
  deviceName: string;
}
export interface MicInfo {
  deviceName: string;
  level: number;
}

export async function checkCameraApi(): Promise<{ ok: boolean; info: CameraInfo }> {
  await delay(300);
  return { ok: true, info: { resolution: "1920×1080", deviceName: "내장 웹캠" } };
}

export async function checkMicApi(): Promise<{ ok: boolean; info: MicInfo }> {
  await delay(400);
  return { ok: true, info: { deviceName: "MacBook Air 마이크", level: 72 } };
}

export async function checkNetworkApi(
  onProgress: (pct: number) => void
): Promise<{ ok: boolean; speedMbps: number; latencyMs: number }> {
  return new Promise((resolve) => {
    let w = 0;
    const t = setInterval(() => {
      w += Math.random() * 7 + 2;
      if (w >= 90) {
        w = 90;
        clearInterval(t);
        onProgress(90);
        setTimeout(() => resolve({ ok: true, speedMbps: 90, latencyMs: 38 }), 300);
      } else {
        onProgress(w);
      }
    }, 90);
  });
}
