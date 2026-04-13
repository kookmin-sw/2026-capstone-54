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

export interface ResumeDetail {
  uuid: string;
  type: "text" | "file" | "structured";
  title: string;
  isActive: boolean;
  analysisStatus: string;
  analysisStep: string;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
  content?: string;
  originalFilename?: string;
  fileSizeBytes?: number;
}

export async function fetchResumeDetailApi(uuid: string): Promise<ResumeDetail> {
  return apiRequest<ResumeDetail>(`/api/v1/resumes/${uuid}/`, { auth: true });
}

export async function updateResumeApi(
  uuid: string,
  payload: SaveResumePayload
): Promise<SaveResumeResponse> {
  try {
    await apiRequest<ResumeDetail>(`/api/v1/resumes/${uuid}/`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ title: payload.title, content: payload.content }),
    });
    return { success: true, message: "이력서가 수정되었습니다.", resumeId: uuid };
  } catch (err: unknown) {
    const e = err as { message?: string };
    return { success: false, message: e?.message ?? "이력서 수정에 실패했습니다." };
  }
}
