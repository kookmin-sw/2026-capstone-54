import { apiRequest, BASE_URL, getAccessToken } from "@/shared/api/client";
import type {
  PaginatedResponse,
  ParsedData,
  ResumeDetail,
  ResumeListItem,
} from "./types";

const BASE = "/api/v1/resumes";

export const resumeApi = {
  list: (page = 1) =>
    apiRequest<PaginatedResponse<ResumeListItem>>(`${BASE}/?page=${page}`, { auth: true }),

  retrieve: (uuid: string) =>
    apiRequest<ResumeDetail>(`${BASE}/${uuid}/`, { auth: true }),

  createText: (title: string, content: string) =>
    apiRequest<ResumeListItem>(`${BASE}/`, {
      method: "POST",
      body: JSON.stringify({ type: "text", title, content }),
      auth: true,
    }),

  /** 구조화 폼으로 직접 작성한 이력서 생성. parsed_data 전체를 한 번에 전송. */
  createStructured: (title: string, parsedData: Partial<ParsedData>) =>
    apiRequest<ResumeListItem>(`${BASE}/`, {
      method: "POST",
      body: JSON.stringify({ type: "structured", title, parsed_data: parsedData }),
      auth: true,
    }),

  /** 사용자가 '최종 저장' 을 누르면 호출. 재임베딩 트리거 + is_dirty 해제. */
  finalize: (uuid: string) =>
    apiRequest<ResumeDetail>(`${BASE}/${uuid}/finalize/`, {
      method: "POST",
      auth: true,
    }),

  /** 파일 업로드. XHR로 진행률을 전달한다. */
  createFile: (
    title: string,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<ResumeListItem> => {
    return new Promise((resolve, reject) => {
      const token = getAccessToken();
      const form = new FormData();
      form.append("type", "file");
      form.append("title", title);
      form.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}${BASE}/`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error("invalid response")); }
        } else {
          reject(new Error(`upload failed: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error("network error"));
      xhr.send(form);
    });
  },

  updateText: (uuid: string, patch: { title?: string; content?: string }) =>
    apiRequest<ResumeDetail>(`${BASE}/${uuid}/`, {
      method: "PATCH",
      body: JSON.stringify(patch),
      auth: true,
    }),

  /** 파일 교체. 파일과 (선택)title 을 multipart로 전송. */
  updateFile: (
    uuid: string,
    patch: { title?: string; file?: File },
    onProgress?: (pct: number) => void,
  ): Promise<ResumeDetail> => {
    return new Promise((resolve, reject) => {
      const token = getAccessToken();
      const form = new FormData();
      if (patch.title !== undefined) form.append("title", patch.title);
      if (patch.file) form.append("file", patch.file);

      const xhr = new XMLHttpRequest();
      xhr.open("PATCH", `${BASE_URL}${BASE}/${uuid}/`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error("invalid response")); }
        } else {
          reject(new Error(`update failed: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error("network error"));
      xhr.send(form);
    });
  },

  remove: (uuid: string) =>
    apiRequest<void>(`${BASE}/${uuid}/`, { method: "DELETE", auth: true }),

  activate: (uuid: string) =>
    apiRequest<ResumeListItem>(`${BASE}/${uuid}/activate/`, { method: "POST", auth: true }),

  deactivate: (uuid: string) =>
    apiRequest<ResumeListItem>(`${BASE}/${uuid}/deactivate/`, { method: "POST", auth: true }),
};
