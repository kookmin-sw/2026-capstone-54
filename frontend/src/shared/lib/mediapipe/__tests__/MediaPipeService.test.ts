const mockForVisionTasks = jest.fn();
const mockCreateFromOptions = jest.fn();

jest.mock("@mediapipe/tasks-vision", () => ({
  FilesetResolver: {
    forVisionTasks: (...args: unknown[]) => mockForVisionTasks(...args),
  },
  FaceLandmarker: {
    createFromOptions: (...args: unknown[]) => mockCreateFromOptions(...args),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("MediaPipeService — initializeMediaPipe", () => {
  it("최초 호출 → FilesetResolver + FaceLandmarker 둘 다 호출 + 인스턴스 반환", async () => {
    const fakeResolver = { id: "resolver" };
    const fakeLandmarker = { id: "landmarker" };
    mockForVisionTasks.mockResolvedValue(fakeResolver);
    mockCreateFromOptions.mockResolvedValue(fakeLandmarker);

    const { initializeMediaPipe } = await import("../MediaPipeService");
    const result = await initializeMediaPipe();

    expect(mockForVisionTasks).toHaveBeenCalledWith(
      expect.stringContaining("@mediapipe/tasks-vision"),
    );
    expect(mockCreateFromOptions).toHaveBeenCalledWith(
      fakeResolver,
      expect.objectContaining({
        baseOptions: expect.objectContaining({ delegate: "GPU" }),
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      }),
    );
    expect(result).toBe(fakeLandmarker);
  });

  it("이미 초기화된 인스턴스 있음 → cached 인스턴스 반환 (재호출 안 함)", async () => {
    const fakeLandmarker = { id: "landmarker" };
    mockForVisionTasks.mockResolvedValue({});
    mockCreateFromOptions.mockResolvedValue(fakeLandmarker);

    const { initializeMediaPipe } = await import("../MediaPipeService");
    const first = await initializeMediaPipe();
    const second = await initializeMediaPipe();

    expect(first).toBe(second);
    expect(mockForVisionTasks).toHaveBeenCalledTimes(1);
    expect(mockCreateFromOptions).toHaveBeenCalledTimes(1);
  });

  it("modelAssetPath 가 mediapipe-models CDN 으로 설정됨", async () => {
    mockForVisionTasks.mockResolvedValue({});
    mockCreateFromOptions.mockResolvedValue({});

    const { initializeMediaPipe } = await import("../MediaPipeService");
    await initializeMediaPipe();

    const opts = mockCreateFromOptions.mock.calls[0][1] as { baseOptions: { modelAssetPath: string } };
    expect(opts.baseOptions.modelAssetPath).toContain("face_landmarker");
    expect(opts.baseOptions.modelAssetPath).toContain("mediapipe-models");
  });
});

describe("MediaPipeService — getFaceLandmarker", () => {
  it("초기화 전 → null", async () => {
    const { getFaceLandmarker } = await import("../MediaPipeService");
    expect(getFaceLandmarker()).toBeNull();
  });

  it("초기화 후 → 동일 인스턴스 반환", async () => {
    const fakeLandmarker = { id: "L1" };
    mockForVisionTasks.mockResolvedValue({});
    mockCreateFromOptions.mockResolvedValue(fakeLandmarker);

    const mod = await import("../MediaPipeService");
    await mod.initializeMediaPipe();

    expect(mod.getFaceLandmarker()).toBe(fakeLandmarker);
  });
});
