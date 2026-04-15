import { apiRequest } from "@/shared/api/client";
import type { ResumeTemplateDetail, ResumeTemplateListItem } from "./types";

const BASE = "/api/v1/resumes/templates";

export const resumeTemplatesApi = {
  list: (opts?: { job?: string; category?: string }) => {
    const params = new URLSearchParams();
    if (opts?.job) params.set("job", opts.job);
    if (opts?.category) params.set("category", opts.category);
    const qs = params.toString();
    return apiRequest<ResumeTemplateListItem[]>(`${BASE}/${qs ? `?${qs}` : ""}`, { auth: true });
  },
  retrieve: (uuid: string) =>
    apiRequest<ResumeTemplateDetail>(`${BASE}/${uuid}/`, { auth: true }),
};
