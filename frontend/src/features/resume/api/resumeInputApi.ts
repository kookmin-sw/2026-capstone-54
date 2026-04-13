import { apiRequest } from "@/shared/api/client";

export interface SaveResumePayload {
  title: string;
  content: string;
}

export interface SaveResumeResponse {
  success: boolean;
  message: string;
  resumeId?: string;
}

interface CreateResumeApiResponse {
  uuid: string;
  type: string;
  title: string;
  isActive: boolean;
  analysisStatus: string;
  analysisStep: string;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function saveResumeApi(
  payload: SaveResumePayload
): Promise<SaveResumeResponse> {
  if (!payload.title.trim()) {
    return { success: false, message: "이력서 제목을 입력해 주세요." };
  }
  if (!payload.content.trim()) {
    return { success: false, message: "이력서 내용을 입력해 주세요." };
  }

  try {
    const response = await apiRequest<CreateResumeApiResponse>("/api/v1/resumes/", {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        type: "text",
        title: payload.title,
        content: payload.content,
      }),
    });
    return {
      success: true,
      message: "이력서가 저장되었습니다.",
      resumeId: response.uuid,
    };
  } catch (err: unknown) {
    const e = err as { message?: string };
    return {
      success: false,
      message: e?.message ?? "이력서 저장에 실패했습니다.",
    };
  }
}
