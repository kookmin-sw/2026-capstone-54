import { checkMicApi } from "../checkMic";

beforeEach(() => {
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    value: { getUserMedia: jest.fn() },
    writable: true,
    configurable: true,
  });
});

describe("checkMicApi", () => {
  it("성공 → ok=true + 디바이스 라벨", async () => {
    const stopFn = jest.fn();
    const stream = {
      getAudioTracks: () => [{ label: "USB Microphone" }],
      getTracks: () => [{ stop: stopFn }],
    };
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(stream);

    const result = await checkMicApi();
    expect(result.ok).toBe(true);
    expect(result.info.deviceName).toBe("USB Microphone");
    expect(stopFn).toHaveBeenCalled();
  });

  it("라벨 없으면 기본 '마이크'", async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue({
      getAudioTracks: () => [{ label: "" }],
      getTracks: () => [{ stop: jest.fn() }],
    });

    const result = await checkMicApi();
    expect(result.info.deviceName).toBe("마이크");
  });

  it("getUserMedia 실패 → ok=false + info '-'", async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(new Error("denied"));

    const result = await checkMicApi();
    expect(result.ok).toBe(false);
    expect(result.info.deviceName).toBe("-");
  });
});
