export interface MicInfo {
  deviceName: string;
  level: number;
}

export async function checkMicApi(): Promise<{ ok: boolean; info: MicInfo }> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const track = stream.getAudioTracks()[0];
    const deviceName = track.label || "마이크";
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true, info: { deviceName, level: 0 } };
  } catch {
    return { ok: false, info: { deviceName: "-", level: 0 } };
  }
}
