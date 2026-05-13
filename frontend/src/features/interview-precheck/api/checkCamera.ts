export interface CameraInfo {
  resolution: string;
  deviceName: string;
}

export async function checkCameraApi(): Promise<{ ok: boolean; info: CameraInfo; stream?: MediaStream }> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    const resolution =
      settings.width && settings.height ? `${settings.width}×${settings.height}` : "해상도 미확인";
    const deviceName = track.label || "웹캠";
    return { ok: true, info: { resolution, deviceName }, stream };
  } catch {
    return { ok: false, info: { resolution: "-", deviceName: "-" } };
  }
}
