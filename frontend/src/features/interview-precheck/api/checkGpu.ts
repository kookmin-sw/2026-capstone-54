export async function checkGpuApi(): Promise<{ ok: boolean; info: string }> {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return { ok: false, info: "WebGL 미지원" };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const info = ext
      ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string)
      : "GPU 가속 활성화";
    return { ok: true, info };
  } catch {
    return { ok: false, info: "확인 불가" };
  }
}
