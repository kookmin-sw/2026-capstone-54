const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface SaveResumePayload {
  title: string;
  content: string;
}

export interface SaveResumeResponse {
  success: boolean;
  message: string;
  resumeId?: string;
}

export async function saveResumeApi(
  payload: SaveResumePayload
): Promise<SaveResumeResponse> {
  await delay(900);
  if (!payload.title.trim()) {
    return { success: false, message: "이력서 제목을 입력해 주세요." };
  }
  if (!payload.content.trim()) {
    return { success: false, message: "이력서 내용을 입력해 주세요." };
  }
  return {
    success: true,
    message: "이력서가 저장되었습니다.",
    resumeId: `resume-${Date.now()}`,
  };
}
