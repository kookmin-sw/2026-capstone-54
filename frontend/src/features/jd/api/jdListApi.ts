// Mock JD List API
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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOCK_LIST: JdListItem[] = [
  {
    id: "mock-jd-analyzing",
    company: "카카오",
    companyInitial: "카",
    companyColor: "linear-gradient(135deg,#60A5FA,#2563EB)",
    title: "프론트엔드 개발자 (React)",
    status: "analyzing",
    tags: [
      { label: "React", color: "default" },
      { label: "TypeScript", color: "blue" },
    ],
    registeredAt: "방금 전 등록",
    analyzed: false,
  },
  {
    id: "mock-jd-1",
    company: "네이버",
    companyInitial: "네",
    companyColor: "linear-gradient(135deg,#34D399,#059669)",
    title: "백엔드 엔지니어 — Spring Boot / MSA",
    status: "applied",
    tags: [
      { label: "Spring", color: "green" },
      { label: "Java", color: "blue" },
      { label: "MSA", color: "default" },
    ],
    registeredAt: "2일 전",
    analyzed: true,
  },
  {
    id: "mock-jd-3",
    company: "라인플러스",
    companyInitial: "라",
    companyColor: "linear-gradient(135deg,#F472B6,#DB2777)",
    title: "Android 앱 개발자 (Kotlin)",
    status: "planned",
    tags: [
      { label: "Android", color: "pink" },
      { label: "Kotlin", color: "default" },
    ],
    registeredAt: "4일 전",
    analyzed: true,
  },
  {
    id: "mock-jd-4",
    company: "토스",
    companyInitial: "토",
    companyColor: "linear-gradient(135deg,#FCD34D,#D97706)",
    title: "데이터 엔지니어 (Spark / Airflow)",
    status: "saved",
    tags: [
      { label: "Spark", color: "blue" },
      { label: "Python", color: "default" },
      { label: "Airflow", color: "green" },
    ],
    registeredAt: "1주 전",
    analyzed: true,
  },
  {
    id: "mock-jd-5",
    company: "쿠팡",
    companyInitial: "쿠",
    companyColor: "linear-gradient(135deg,#A78BFA,#6D28D9)",
    title: "DevOps / SRE 엔지니어",
    status: "applied",
    tags: [
      { label: "K8s", color: "default" },
      { label: "AWS", color: "blue" },
      { label: "Terraform", color: "green" },
    ],
    registeredAt: "2주 전",
    analyzed: true,
  },
];

export async function fetchJdListApi(): Promise<{ success: boolean; data: JdListItem[] }> {
  await delay(500);
  return { success: true, data: [...MOCK_LIST] };
}

export function calcStats(list: JdListItem[]): JdListStats {
  return {
    total: list.filter((j) => j.status !== "analyzing").length,
    planned: list.filter((j) => j.status === "planned").length,
    applied: list.filter((j) => j.status === "applied").length,
    saved: list.filter((j) => j.status === "saved").length,
  };
}
