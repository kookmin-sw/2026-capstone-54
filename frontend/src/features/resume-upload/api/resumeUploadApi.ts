const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface UploadResumePayload {
  title: string;
  fileName: string;
  fileSize: number;
}

export interface UploadResumeResponse {
  success: boolean;
  message: string;
  resumeId?: string;
}

export async function uploadResumeApi(
  payload: UploadResumePayload,
  onProgress: (pct: number) => void
): Promise<UploadResumeResponse> {
  if (!payload.title.trim()) {
    return { success: false, message: "이력서 제목을 입력해 주세요." };
  }

  await new Promise<void>((resolve) => {
    let pct = 0;
    const t = setInterval(() => {
      // Use crypto.getRandomValues for secure random number generation
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      const randomValue = (randomArray[0] / 0xFFFFFFFF) * 18;
      pct += randomValue;
      if (pct >= 100) {
        pct = 100;
        clearInterval(t);
        onProgress(100);
        resolve();
      } else {
        onProgress(Math.round(pct));
      }
    }, 200);
  });

  await delay(400);
  return {
    success: true,
    message: "이력서가 업로드되었습니다.",
    resumeId: `resume-${Date.now()}`,
  };
}
