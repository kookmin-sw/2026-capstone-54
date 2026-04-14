/**
 * 이력서 섹션 CRUD API 클라이언트.
 * 모든 endpoint 는 `/api/v1/resumes/{resume_uuid}/sections/...` 네임스페이스 아래에 있다.
 *
 * 응답 키는 backend CamelCaseJSONRenderer 에 의해 camelCase 로 변환된다.
 * 요청 키는 snake_case 로 보내고 backend 가 알아서 처리하지만, 안전을 위해
 * 일관성 있는 wrapper 함수로 페이로드를 명시적으로 전달한다.
 */

import { apiRequest } from "@/shared/api/client";
import type {
  ParsedSkillGroup,
  ResumeAwardRow,
  ResumeBasicInfoRow,
  ResumeCareerMetaRow,
  ResumeCertificationRow,
  ResumeEducationRow,
  ResumeExperienceRow,
  ResumeJobCategory,
  ResumeLanguageSpokenRow,
  ResumeProjectRow,
  ResumeSummaryRow,
} from "./types";

const sectionBase = (resumeUuid: string) =>
  `/api/v1/resumes/${resumeUuid}/sections`;

export const resumeSectionsApi = {
  // ── 1:1 ──────────────────────────────────────────────────────────────────

  putBasicInfo: (
    resumeUuid: string,
    payload: { name?: string; email?: string; phone?: string; location?: string },
  ) =>
    apiRequest<ResumeBasicInfoRow>(`${sectionBase(resumeUuid)}/basic-info/`, {
      method: "PUT",
      body: JSON.stringify(payload),
      auth: true,
    }),

  putSummary: (resumeUuid: string, text: string) =>
    apiRequest<ResumeSummaryRow>(`${sectionBase(resumeUuid)}/summary/`, {
      method: "PUT",
      body: JSON.stringify({ text }),
      auth: true,
    }),

  putCareerMeta: (
    resumeUuid: string,
    totalExperienceYears: number | null,
    totalExperienceMonths: number | null,
  ) =>
    apiRequest<ResumeCareerMetaRow>(`${sectionBase(resumeUuid)}/career-meta/`, {
      method: "PUT",
      body: JSON.stringify({
        total_experience_years: totalExperienceYears,
        total_experience_months: totalExperienceMonths,
      }),
      auth: true,
    }),

  putJobCategory: (resumeUuid: string, name: string) =>
    apiRequest<{ category: ResumeJobCategory | null }>(
      `${sectionBase(resumeUuid)}/job-category/`,
      {
        method: "PUT",
        body: JSON.stringify({ name }),
        auth: true,
      },
    ),

  // ── 1:N : Experiences ───────────────────────────────────────────────────

  listExperiences: (resumeUuid: string) =>
    apiRequest<ResumeExperienceRow[]>(
      `${sectionBase(resumeUuid)}/experiences/`,
      { auth: true },
    ),

  addExperience: (
    resumeUuid: string,
    payload: Omit<ResumeExperienceRow, "uuid" | "createdAt" | "updatedAt">,
  ) =>
    apiRequest<ResumeExperienceRow>(
      `${sectionBase(resumeUuid)}/experiences/`,
      {
        method: "POST",
        body: JSON.stringify(snakeKeys(payload)),
        auth: true,
      },
    ),

  updateExperience: (
    resumeUuid: string,
    uuid: string,
    payload: Partial<Omit<ResumeExperienceRow, "uuid" | "createdAt" | "updatedAt">>,
  ) =>
    apiRequest<ResumeExperienceRow>(
      `${sectionBase(resumeUuid)}/experiences/${uuid}/`,
      {
        method: "PUT",
        body: JSON.stringify(snakeKeys(payload)),
        auth: true,
      },
    ),

  deleteExperience: (resumeUuid: string, uuid: string) =>
    apiRequest<void>(`${sectionBase(resumeUuid)}/experiences/${uuid}/`, {
      method: "DELETE",
      auth: true,
    }),

  // ── 1:N : Educations ────────────────────────────────────────────────────

  listEducations: (resumeUuid: string) =>
    apiRequest<ResumeEducationRow[]>(
      `${sectionBase(resumeUuid)}/educations/`,
      { auth: true },
    ),

  addEducation: (resumeUuid: string, payload: Omit<ResumeEducationRow, "uuid" | "createdAt" | "updatedAt">) =>
    apiRequest<ResumeEducationRow>(`${sectionBase(resumeUuid)}/educations/`, {
      method: "POST",
      body: JSON.stringify(snakeKeys(payload)),
      auth: true,
    }),

  updateEducation: (
    resumeUuid: string,
    uuid: string,
    payload: Partial<Omit<ResumeEducationRow, "uuid" | "createdAt" | "updatedAt">>,
  ) =>
    apiRequest<ResumeEducationRow>(
      `${sectionBase(resumeUuid)}/educations/${uuid}/`,
      {
        method: "PUT",
        body: JSON.stringify(snakeKeys(payload)),
        auth: true,
      },
    ),

  deleteEducation: (resumeUuid: string, uuid: string) =>
    apiRequest<void>(`${sectionBase(resumeUuid)}/educations/${uuid}/`, {
      method: "DELETE",
      auth: true,
    }),

  // ── 1:N : Certifications ────────────────────────────────────────────────

  listCertifications: (resumeUuid: string) =>
    apiRequest<ResumeCertificationRow[]>(
      `${sectionBase(resumeUuid)}/certifications/`,
      { auth: true },
    ),

  addCertification: (
    resumeUuid: string,
    payload: Omit<ResumeCertificationRow, "uuid" | "createdAt" | "updatedAt">,
  ) =>
    apiRequest<ResumeCertificationRow>(
      `${sectionBase(resumeUuid)}/certifications/`,
      {
        method: "POST",
        body: JSON.stringify(snakeKeys(payload)),
        auth: true,
      },
    ),

  updateCertification: (
    resumeUuid: string,
    uuid: string,
    payload: Partial<Omit<ResumeCertificationRow, "uuid" | "createdAt" | "updatedAt">>,
  ) =>
    apiRequest<ResumeCertificationRow>(
      `${sectionBase(resumeUuid)}/certifications/${uuid}/`,
      {
        method: "PUT",
        body: JSON.stringify(snakeKeys(payload)),
        auth: true,
      },
    ),

  deleteCertification: (resumeUuid: string, uuid: string) =>
    apiRequest<void>(`${sectionBase(resumeUuid)}/certifications/${uuid}/`, {
      method: "DELETE",
      auth: true,
    }),

  // ── 1:N : Awards ────────────────────────────────────────────────────────

  listAwards: (resumeUuid: string) =>
    apiRequest<ResumeAwardRow[]>(
      `${sectionBase(resumeUuid)}/awards/`,
      { auth: true },
    ),

  addAward: (
    resumeUuid: string,
    payload: Omit<ResumeAwardRow, "uuid" | "createdAt" | "updatedAt">,
  ) =>
    apiRequest<ResumeAwardRow>(
      `${sectionBase(resumeUuid)}/awards/`,
      {
        method: "POST",
        body: JSON.stringify(snakeKeys(payload)),
        auth: true,
      },
    ),

  updateAward: (
    resumeUuid: string,
    uuid: string,
    payload: Partial<Omit<ResumeAwardRow, "uuid" | "createdAt" | "updatedAt">>,
  ) =>
    apiRequest<ResumeAwardRow>(
      `${sectionBase(resumeUuid)}/awards/${uuid}/`,
      {
        method: "PUT",
        body: JSON.stringify(snakeKeys(payload)),
        auth: true,
      },
    ),

  deleteAward: (resumeUuid: string, uuid: string) =>
    apiRequest<void>(`${sectionBase(resumeUuid)}/awards/${uuid}/`, {
      method: "DELETE",
      auth: true,
    }),

  // ── 1:N : Projects ──────────────────────────────────────────────────────

  listProjects: (resumeUuid: string) =>
    apiRequest<ResumeProjectRow[]>(
      `${sectionBase(resumeUuid)}/projects/`,
      { auth: true },
    ),

  addProject: (
    resumeUuid: string,
    payload: Omit<ResumeProjectRow, "uuid" | "createdAt" | "updatedAt">,
  ) =>
    apiRequest<ResumeProjectRow>(`${sectionBase(resumeUuid)}/projects/`, {
      method: "POST",
      body: JSON.stringify(snakeKeys(payload)),
      auth: true,
    }),

  updateProject: (
    resumeUuid: string,
    uuid: string,
    payload: Partial<Omit<ResumeProjectRow, "uuid" | "createdAt" | "updatedAt">>,
  ) =>
    apiRequest<ResumeProjectRow>(
      `${sectionBase(resumeUuid)}/projects/${uuid}/`,
      {
        method: "PUT",
        body: JSON.stringify(snakeKeys(payload)),
        auth: true,
      },
    ),

  deleteProject: (resumeUuid: string, uuid: string) =>
    apiRequest<void>(`${sectionBase(resumeUuid)}/projects/${uuid}/`, {
      method: "DELETE",
      auth: true,
    }),

  // ── 1:N : LanguagesSpoken ───────────────────────────────────────────────

  listLanguagesSpoken: (resumeUuid: string) =>
    apiRequest<ResumeLanguageSpokenRow[]>(
      `${sectionBase(resumeUuid)}/languages-spoken/`,
      { auth: true },
    ),

  addLanguageSpoken: (
    resumeUuid: string,
    payload: Omit<ResumeLanguageSpokenRow, "uuid" | "createdAt" | "updatedAt">,
  ) =>
    apiRequest<ResumeLanguageSpokenRow>(
      `${sectionBase(resumeUuid)}/languages-spoken/`,
      {
        method: "POST",
        body: JSON.stringify(snakeKeys(payload)),
        auth: true,
      },
    ),

  updateLanguageSpoken: (
    resumeUuid: string,
    uuid: string,
    payload: Partial<Omit<ResumeLanguageSpokenRow, "uuid" | "createdAt" | "updatedAt">>,
  ) =>
    apiRequest<ResumeLanguageSpokenRow>(
      `${sectionBase(resumeUuid)}/languages-spoken/${uuid}/`,
      {
        method: "PUT",
        body: JSON.stringify(snakeKeys(payload)),
        auth: true,
      },
    ),

  deleteLanguageSpoken: (resumeUuid: string, uuid: string) =>
    apiRequest<void>(`${sectionBase(resumeUuid)}/languages-spoken/${uuid}/`, {
      method: "DELETE",
      auth: true,
    }),

  // ── N:M : skills / industry domains / keywords ─────────────────────────

  putSkills: (resumeUuid: string, skills: ParsedSkillGroup) =>
    apiRequest<{ ok: boolean }>(`${sectionBase(resumeUuid)}/skills/`, {
      method: "PUT",
      body: JSON.stringify({ skills }),
      auth: true,
    }),

  putIndustryDomains: (resumeUuid: string, industryDomains: string[]) =>
    apiRequest<{ ok: boolean }>(
      `${sectionBase(resumeUuid)}/industry-domains/`,
      {
        method: "PUT",
        body: JSON.stringify({ industry_domains: industryDomains }),
        auth: true,
      },
    ),

  putKeywords: (resumeUuid: string, keywords: string[]) =>
    apiRequest<{ ok: boolean }>(`${sectionBase(resumeUuid)}/keywords/`, {
      method: "PUT",
      body: JSON.stringify({ keywords }),
      auth: true,
    }),
};

/** camelCase 키를 snake_case 로 얕게 변환. (응답 측 CamelCaseJSONRenderer 와 짝 맞춤) */
function snakeKeys<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const newKey = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    out[newKey] = v;
  }
  return out;
}
