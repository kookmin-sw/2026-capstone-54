import { checkCameraApi } from "../checkCamera";

beforeEach(() => {
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    value: { getUserMedia: jest.fn() },
    writable: true,
    configurable: true,
  });
});

describe("checkCameraApi", () => {
  it("성공 + width/height 있음 → resolution '1280×720'", async () => {
    const stream = {
      getVideoTracks: () => [{ label: "FaceTime HD", getSettings: () => ({ width: 1280, height: 720 }) }],
    };
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(stream);

    const result = await checkCameraApi();
    expect(result.ok).toBe(true);
    expect(result.info.resolution).toBe("1280×720");
    expect(result.info.deviceName).toBe("FaceTime HD");
    expect(result.stream).toBe(stream);
  });

  it("width 또는 height 없음 → '해상도 미확인'", async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue({
      getVideoTracks: () => [{ label: "Webcam", getSettings: () => ({}) }],
    });

    const result = await checkCameraApi();
    expect(result.info.resolution).toBe("해상도 미확인");
  });

  it("라벨 없으면 '웹캠' fallback", async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue({
      getVideoTracks: () => [{ label: "", getSettings: () => ({ width: 640, height: 480 }) }],
    });

    const result = await checkCameraApi();
    expect(result.info.deviceName).toBe("웹캠");
  });

  it("getUserMedia 실패 → ok=false + info '-'", async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(new Error("blocked"));

    const result = await checkCameraApi();
    expect(result.ok).toBe(false);
    expect(result.info.resolution).toBe("-");
    expect(result.info.deviceName).toBe("-");
    expect(result.stream).toBeUndefined();
  });
});
