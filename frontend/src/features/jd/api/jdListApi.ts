import { apiRequest } from "@/shared/api/client";
import type { JdStatus } from "./jdApi";

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

/**
 * 백엔드 API 응답 타입
 */
interface JdListApiResponse {
  id: number;
  company_name: string;
  job_title: string;
  status: JdListStatus;
  tags?: string[];
  created_at: string;
  is_analyzed: boolean;
}

/**
 * 회사 이름의 첫 글자 추출
 */
function getCompanyInitial(company: string): string {
  return company.charAt(0);
}

/**
 * 회사별 그라데이션 색상 생성 (해시 기반)
 */
function getCompanyColor(company: string): string {
  const colors = [
    "linear-gradient(135deg,#60A5FA,#2563EB)",
    "linear-gradient(135deg,#34D399,#059669)",
    "linear-gradient(135deg,#F472B6,#DB2777)",
    "linear-gradient(135deg,#FCD34D,#D97706)",
    "linear-gradient(135deg,#A78BFA,#6D28D9)",
    "linear-gradient(135deg,#FB923C,#EA580C)",
    "linear-gradient(135deg,#38BDF8,#0284C7)",
    "linear-gradient(135deg,#4ADE80,#16A34A)",
  ];
  
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * 태그 색상 매핑
 */
function getTagColor(tag: string): "default" | "green" | "blue" | "pink" {
  const lowerTag = tag.toLowerCase();
  if (lowerTag.includes("spring") || lowerTag.includes("python") || lowerTag.includes("airflow")) {
    return "green";
  }
  if (lowerTag.includes("java") || lowerTag.includes("typescript") || lowerTag.includes("spark") || lowerTag.includes("aws")) {
    return "blue";
  }
  if (lowerTag.includes("android") || lowerTag.includes("ios")) {
    return "pink";
  }
  return "default";
}

/**
 * 상대 시간 표시 (예: "2일 전", "1주 전")
 */
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const timeUnits = [
    { threshold: 60000, divisor: 60000, unit: "분" },
    { threshold: 3600000, divisor: 3600000, unit: "시간" },
    { threshold: 86400000 * 7, divisor: 86400000, unit: "일" },
    { threshold: 86400000 * 28, divisor: 86400000 * 7, unit: "주" },
    { threshold: Infinity, divisor: 86400000 * 28, unit: "개월" },
  ];

  if (diffMs < 60000) return "방금 전 등록";

  for (const { threshold, divisor, unit } of timeUnits) {
    if (diffMs < threshold) {
      const value = Math.floor(diffMs / divisor);
      return `${value}${unit} 전`;
    }
  }

  return "방금 전 등록";
}

/**
 * API 응답을 프론트엔드 형식으로 변환
 */
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

/**
 * 채용공고 목록 조회 API
 */
export async function fetchJdListApi(): Promise<{ success: boolean; data: JdListItem[] }> {
  try {
    const response = await apiRequest<JdListApiResponse[]>("/api/v1/job-descriptions/", {
      auth: true,
    });
    
    const transformedData = response.map(transformJdListItem);
    return { success: true, data: transformedData };
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
