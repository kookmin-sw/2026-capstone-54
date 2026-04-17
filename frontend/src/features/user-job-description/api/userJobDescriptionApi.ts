/** 사용자 채용공고 API 클라이언트.
 *
 * backend 엔드포인트:
 *   GET    /api/v1/user-job-descriptions/          → 목록
 *   POST   /api/v1/user-job-descriptions/          → 수집 시작 (url 입력)
 *   GET    /api/v1/user-job-descriptions/{uuid}/   → 상세
 *
 * 응답 키는 CamelCaseJSONRenderer 를 통과해 camelCase 로 전달된다.
 */

import { apiRequest } from "@/shared/api/client";
import type { PaginatedResponse } from "@/shared/api";
import type { CreatedUserJobDescription, UserJobDescription } from "./types";

const BASE = "/api/v1/user-job-descriptions";

export const userJobDescriptionApi = {
  list: () =>
    apiRequest<PaginatedResponse<UserJobDescription>>(`${BASE}/`, { auth: true })
      .then((res) => res.results),

  retrieve: (uuid: string) =>
    apiRequest<UserJobDescription>(`${BASE}/${uuid}/`, { auth: true }),

  create: (params: { url: string; title?: string; applicationStatus?: string }) =>
    apiRequest<CreatedUserJobDescription>(`${BASE}/`, {
      method: "POST",
      body: JSON.stringify({
        url: params.url,
        title: params.title || "",
        application_status: params.applicationStatus || "planned",
      }),
      auth: true,
    }),

  update: (uuid: string, params: { title?: string; applicationStatus?: string }) =>
    apiRequest<UserJobDescription>(`${BASE}/${uuid}/`, {
      method: "PATCH",
      body: JSON.stringify({
        ...(params.title !== undefined && { title: params.title }),
        ...(params.applicationStatus !== undefined && { application_status: params.applicationStatus }),
      }),
      auth: true,
    }),

  remove: (uuid: string) =>
    apiRequest<void>(`${BASE}/${uuid}/`, { method: "DELETE", auth: true }),
};
