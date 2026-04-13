import { apiRequest } from "@/shared/api/client";
import type {
  ResumeCountStats,
  ResumeRecentActivityStats,
  ResumeTopSkillsStats,
  ResumeTypeStats,
} from "./types";

const BASE = "/api/v1/resumes/stats";

export const resumeStatsApi = {
  count: () => apiRequest<ResumeCountStats>(`${BASE}/count/`, { auth: true }),
  type: () => apiRequest<ResumeTypeStats>(`${BASE}/type/`, { auth: true }),
  topSkills: (limit = 5) =>
    apiRequest<ResumeTopSkillsStats>(`${BASE}/top-skills/?limit=${limit}`, { auth: true }),
  recentActivity: (days = 7) =>
    apiRequest<ResumeRecentActivityStats>(`${BASE}/recent-activity/?days=${days}`, { auth: true }),
};
