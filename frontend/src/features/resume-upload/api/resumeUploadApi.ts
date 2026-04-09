import { BASE_URL, getAccessToken } from "@/shared/api/client";

export interface UploadResumePayload {
  title: string;
  file: File;
}

export interface UploadResumeResponse {
  success: boolean;
  message: string;
  resumeId?: string;
}

function parseApiError(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null) {
    const e = err as { message?: string; fieldErrors?: Record<string, string[]> };
    const fieldMsg = e.fieldErrors ? Object.values(e.fieldErrors).flat()[0] : undefined;
    return fieldMsg ?? e.message ?? fallback;
  }
  return fallback;
}

export async function uploadResumeApi(
  payload: UploadResumePayload,
  onProgress: (pct: number) => void
): Promise<UploadResumeResponse> {
  if (!payload.title.trim()) {
    return { success: false, message: "이력서 제목을 입력해 주세요." };
  }

  try {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("file", payload.file);

    const xhr = new XMLHttpRequest();

    return await new Promise<UploadResumeResponse>((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              message: "이력서가 업로드되었습니다.",
              resumeId: response.id || response.resumeId,
            });
          } catch {
            resolve({
              success: true,
              message: "이력서가 업로드되었습니다.",
            });
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(errorData);
          } catch {
            reject({ message: "이력서 업로드에 실패했습니다." });
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject({ message: "네트워크 오류가 발생했습니다." });
      });

      xhr.addEventListener("abort", () => {
        reject({ message: "업로드가 취소되었습니다." });
      });

      xhr.open("POST", `${BASE_URL}/api/v1/resumes/upload/`);
      
      const token = getAccessToken();
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  } catch (err: unknown) {
    return {
      success: false,
      message: parseApiError(err, "이력서 업로드에 실패했습니다."),
    };
  }
}
