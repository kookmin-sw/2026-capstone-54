import {
  apiRequest,
  BASE_URL,
  getAccessToken,
} from "@/shared/api/client";
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

  /** 구조화 폼으로 직접 작성한 이력서 생성.
   *
   * backend 는 drf-writable-nested 기반 nested payload 를 기대한다:
   * `{type, title, basic_info, summary: {text}, career_meta, experiences, …}`.
   * 프론트의 flat `ParsedData` 를 해당 구조로 직렬화한다.
   */
  createStructured: (title: string, parsedData: Partial<ParsedData>) =>
    apiRequest<ResumeListItem>(`${BASE}/`, {
      method: "POST",
      body: JSON.stringify(buildStructuredCreatePayload(title, parsedData)),
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
      xhr.withCredentials = true;
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
          reject(parseXhrError(xhr, "upload failed"));
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
      xhr.withCredentials = true;
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
          reject(parseXhrError(xhr, "update failed"));
        }
      };
      xhr.onerror = () => reject(new Error("network error"));
      xhr.send(form);
    });
  },

  remove: (uuid: string) =>
    apiRequest<void>(`${BASE}/${uuid}/`, { method: "DELETE", auth: true }),
};


/** XHR 에러 응답에서 fieldErrors → message → fallback 순으로 메시지를 추출한다. */
function parseXhrError(xhr: XMLHttpRequest, fallback: string): Error {
  try {
    const body = JSON.parse(xhr.responseText) as {
      message?: string;
      fieldErrors?: Record<string, string[]>;
    };
    const fieldMsg = body.fieldErrors
      ? ([] as string[]).concat(...Object.values(body.fieldErrors))[0]
      : undefined;
    const msg = fieldMsg ?? body.message ?? `${fallback}: ${xhr.status}`;
    return new Error(msg);
  } catch {
    return new Error(`${fallback}: ${xhr.status}`);
  }
}

/** 프론트 flat `ParsedData` 를 backend structured-nested payload 로 변환. */
function buildStructuredCreatePayload(
  title: string,
  parsed: Partial<ParsedData>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { type: "structured", title };

  if (parsed.basicInfo && Object.values(parsed.basicInfo).some(Boolean)) {
    payload.basic_info = {
      name: parsed.basicInfo.name ?? "",
      email: parsed.basicInfo.email ?? "",
      phone: parsed.basicInfo.phone ?? "",
      location: parsed.basicInfo.location ?? "",
    };
  }

  if (parsed.summary) {
    payload.summary = { text: parsed.summary };
  }

  if (parsed.totalExperienceYears != null || parsed.totalExperienceMonths != null) {
    payload.career_meta = {
      total_experience_years: parsed.totalExperienceYears,
      total_experience_months: parsed.totalExperienceMonths,
    };
  }

  if (parsed.experiences?.length) {
    payload.experiences = parsed.experiences.map((e, idx) => ({
      company: e.company ?? "",
      role: e.role ?? "",
      period: e.period ?? "",
      responsibilities: e.responsibilities ?? [],
      highlights: e.highlights ?? [],
      display_order: idx,
    }));
  }

  if (parsed.educations?.length) {
    payload.educations = parsed.educations.map((e, idx) => ({
      school: e.school ?? "",
      degree: e.degree ?? "",
      major: e.major ?? "",
      period: e.period ?? "",
      display_order: idx,
    }));
  }

  if (parsed.certifications?.length) {
    payload.certifications = parsed.certifications.map((c, idx) => ({
      name: c.name ?? "",
      issuer: c.issuer ?? "",
      date: c.date ?? "",
      display_order: idx,
    }));
  }

  if (parsed.awards?.length) {
    payload.awards = parsed.awards.map((a, idx) => ({
      name: a.name ?? "",
      year: a.year ?? "",
      organization: a.organization ?? "",
      description: a.description ?? "",
      display_order: idx,
    }));
  }

  if (parsed.projects?.length) {
    payload.projects = parsed.projects.map((p, idx) => ({
      name: p.name ?? "",
      role: p.role ?? "",
      period: p.period ?? "",
      description: p.description ?? "",
      display_order: idx,
      tech_stack: p.techStack ?? [],
    }));
  }

  if (parsed.languagesSpoken?.length) {
    payload.languages_spoken = parsed.languagesSpoken.map((l, idx) => ({
      language: l.language ?? "",
      level: l.level ?? "",
      display_order: idx,
    }));
  }

  if (parsed.skills) {
    payload.skills = {
      technical: parsed.skills.technical ?? [],
      soft: parsed.skills.soft ?? [],
      tools: parsed.skills.tools ?? [],
      languages: parsed.skills.languages ?? [],
    };
  }

  if (parsed.industryDomains?.length) {
    payload.industry_domains = parsed.industryDomains;
  }

  if (parsed.keywords?.length) {
    payload.keywords = parsed.keywords;
  }

  // 이름 기반 FK lookup-or-create (chip 선택 된 라벨)
  if (parsed.jobCategory) {
    payload.resume_job_category_name = parsed.jobCategory;
  }

  return payload;
}
