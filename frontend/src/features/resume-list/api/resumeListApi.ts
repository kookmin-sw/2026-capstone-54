import { apiRequest } from "@/shared/api/client";

export type ResumeStatus = "active" | "inactive" | "parsing";
export type ResumeType = "file" | "text";

export interface ResumeItem {
  id: string;
  title: string;
  type: ResumeType;
  fileExt?: "PDF" | "DOCX";
  skills: string[];
  extraSkillCount: number;
  meta: string;
  status: ResumeStatus;
  date: string;
}

export interface ResumeSummary {
  total: number;
  active: number;
  parsing: number;
  inactive: number;
  fileCount: number;
  textCount: number;
  interviewCount: number;
  avgScore: number;
  recentQuestions: string[];
}

/* ── 백엔드 응답 타입 ── */
interface ResumeApiItem {
  uuid: string;
  type: "file" | "text";
  title: string;
  isActive: boolean;
  analysisStatus: "pending" | "processing" | "completed" | "failed";
  analysisStep: string;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ResumeListApiResponse {
  count: number;
  totalPagesCount: number;
  nextPage: number | null;
  previousPage: number | null;
  results: ResumeApiItem[];
}

function toResumeStatus(item: ResumeApiItem): ResumeStatus {
  if (item.analysisStatus === "pending" || item.analysisStatus === "processing") return "parsing";
  if (!item.isActive) return "inactive";
  return "active";
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function transformResume(item: ResumeApiItem): ResumeItem {
  return {
    id: item.uuid,
    title: item.title,
    type: item.type,
    skills: [],
    extraSkillCount: 0,
    meta: "",
    status: toResumeStatus(item),
    date: formatDate(item.createdAt),
  };
}

function buildSummary(items: ResumeApiItem[]): ResumeSummary {
  const transformed = items.map(transformResume);
  return {
    total: items.length,
    active: transformed.filter((r) => r.status === "active").length,
    parsing: transformed.filter((r) => r.status === "parsing").length,
    inactive: transformed.filter((r) => r.status === "inactive").length,
    fileCount: items.filter((r) => r.type === "file").length,
    textCount: items.filter((r) => r.type === "text").length,
    interviewCount: 0,
    avgScore: 0,
    recentQuestions: [],
  };
}

export async function fetchResumesApi(): Promise<{
  resumes: ResumeItem[];
  summary: ResumeSummary;
}> {
  const response = await apiRequest<ResumeListApiResponse>("/api/v1/resumes/", { auth: true });
  const items = response.results ?? [];
  return {
    resumes: items.map(transformResume),
    summary: buildSummary(items),
  };
}

export async function deleteResumeApi(id: string): Promise<void> {
  await apiRequest(`/api/v1/resumes/${id}/`, {
    method: "DELETE",
    auth: true,
  });
}
