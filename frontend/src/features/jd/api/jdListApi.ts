import { apiRequest } from "@/shared/api/client";
import type { JdStatus } from "./jdApi";
import {
  getCompanyInitial,
  getCompanyColor,
  getTagColor,
  getRelativeTime,
} from "./jdListHelpers";

export type JdListStatus = JdStatus | "analyzing";

export interface JdTag {
  label: string;
  color: "default" | "green" | "blue" | "pink";
}

export interface JdListItem {
  id: string;
  company: string;
  companyInitial: string;
  companyColor: string;
  title: string;
  status: JdListStatus;
  tags: JdTag[];
  registeredAt: string;
  analyzed: boolean;
}

export interface JdListStats {
  total: number;
  planned: number;
  applied: number;
  saved: number;
}

/** 백엔드 API 응답 타입 */
interface JdListApiResponse {
  id: number;
  company_name: string;
  job_title: string;
  status: JdListStatus;
  tags?: string[];
  created_at: string;
  is_analyzed: boolean;
}

function transformJdListItem(item: JdListApiResponse): JdListItem {
  return {
    id: String(item.id),
    company: item.company_name,
    companyInitial: getCompanyInitial(item.company_name),
    companyColor: getCompanyColor(item.company_name),
    title: item.job_title,
    status: item.status,
    tags: (item.tags || []).map((tag) => ({
      label: tag,
      color: getTagColor(tag),
    })),
    registeredAt: getRelativeTime(item.created_at),
    analyzed: item.is_analyzed,
  };
}

/** 채용공고 목록 조회 API */
export async function fetchJdListApi(): Promise<{ success: boolean; data: JdListItem[] }> {
  try {
    const response = await apiRequest<JdListApiResponse[]>("/api/v1/job-descriptions/", {
      auth: true,
    });

    const data = Array.isArray(response) ? response.map(transformJdListItem) : [];
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch JD list:", error);
    return { success: false, data: [] };
  }
}

export function calcStats(list: JdListItem[]): JdListStats {
  return {
    total: list.filter((j) => j.status !== "analyzing").length,
    planned: list.filter((j) => j.status === "planned").length,
    applied: list.filter((j) => j.status === "applied").length,
    saved: list.filter((j) => j.status === "saved").length,
  };
}
