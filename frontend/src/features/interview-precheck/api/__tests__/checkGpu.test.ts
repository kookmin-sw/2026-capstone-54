import { checkGpuApi } from "../checkGpu";

describe("checkGpuApi", () => {
  it("WebGL 미지원 → ok=false + 'WebGL 미지원'", async () => {
    const createElementSpy = jest.spyOn(document, "createElement").mockImplementation(() => ({
      getContext: () => null,
    } as unknown as HTMLCanvasElement));

    const result = await checkGpuApi();
    expect(result.ok).toBe(false);
    expect(result.info).toBe("WebGL 미지원");

    createElementSpy.mockRestore();
  });

  it("WebGL 지원 + WEBGL_debug_renderer_info 지원 → renderer 문자열 반환", async () => {
    const gl = {
      getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 999 }),
      getParameter: (n: number) => (n === 999 ? "Apple M2 GPU" : null),
    };
    const createElementSpy = jest.spyOn(document, "createElement").mockImplementation(() => ({
      getContext: () => gl,
    } as unknown as HTMLCanvasElement));

    const result = await checkGpuApi();
    expect(result.ok).toBe(true);
    expect(result.info).toBe("Apple M2 GPU");

    createElementSpy.mockRestore();
  });

  it("WebGL 지원 + debug_renderer_info 미지원 → 'GPU 가속 활성화'", async () => {
    const gl = {
      getExtension: () => null,
      getParameter: () => null,
    };
    const createElementSpy = jest.spyOn(document, "createElement").mockImplementation(() => ({
      getContext: () => gl,
    } as unknown as HTMLCanvasElement));

    const result = await checkGpuApi();
    expect(result.ok).toBe(true);
    expect(result.info).toBe("GPU 가속 활성화");

    createElementSpy.mockRestore();
  });

  it("getContext throw → ok=false + '확인 불가'", async () => {
    const createElementSpy = jest.spyOn(document, "createElement").mockImplementation(() => ({
      getContext: () => {
        throw new Error("oops");
      },
    } as unknown as HTMLCanvasElement));

    const result = await checkGpuApi();
    expect(result.ok).toBe(false);
    expect(result.info).toBe("확인 불가");

    createElementSpy.mockRestore();
  });
});
