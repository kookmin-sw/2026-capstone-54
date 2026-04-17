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

  create: (url: string) =>
    apiRequest<CreatedUserJobDescription>(`${BASE}/`, {
      method: "POST",
      body: JSON.stringify({ url }),
      auth: true,
    }),
};
