// Mock JD Detail API
import type { JdStatus } from "./jdApi";

export interface JdDetail {
  id: string;
  company: string;
  companyInitial: string;
  companyColor: string;
  source: string;
  title: string;
  customTitle?: string;
  location: string;
  experience: string;
  period: string;
  status: JdStatus;
  interviewActive: boolean;
  interviewCount: number;
  registeredAt: string;
  analyzed: boolean;
  originalUrl: string;
  summary: string;
  requirements: { text: string; level: "required" | "accent" }[];
  preferences: string[];
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOCK_JD_DB: Record<string, JdDetail> = {
  "mock-jd-1": {
    id: "mock-jd-1",
    company: "네이버",
    companyInitial: "네",
    companyColor: "linear-gradient(135deg,#34D399,#059669)",
    source: "saramin.co.kr",
    title: "백엔드 엔지니어 — Spring Boot / MSA",
    location: "성남 분당",
    experience: "경력 3년↑",
    period: "상시채용",
    status: "applied",
    interviewActive: true,
    interviewCount: 3,
    registeredAt: "2025. 12. 10",
    analyzed: true,
    originalUrl: "https://www.saramin.co.kr/zf_user/jobs/relay/view?idx=1",
    summary:
      "대규모 트래픽을 처리하는 네이버의 핵심 서비스 백엔드를 담당합니다. MSA 기반의 분산 시스템을 설계·운영하며, 안정적이고 확장 가능한 플랫폼을 구축하는 역할을 맡게 됩니다. 서비스 신뢰성 향상과 개발자 생산성 개선을 위한 내부 플랫폼 개발도 포함됩니다.",
    requirements: [
      { text: "Java 또는 Kotlin 기반 백엔드 개발 경험 3년 이상", level: "required" },
      { text: "Spring Boot, Spring MVC 기반 REST API 설계 및 구현 경험", level: "required" },
      { text: "MySQL, PostgreSQL 등 관계형 DB 설계 및 쿼리 최적화 경험", level: "accent" },
      { text: "MSA 아키텍처 이해 및 분산 시스템 개발 경험", level: "accent" },
      { text: "Git 기반 협업 및 코드 리뷰 경험", level: "accent" },
    ],
    preferences: [
      "Kafka, RabbitMQ 메시지 큐 운영 경험",
      "Redis 캐시 전략 설계 경험",
      "Kubernetes, Docker 컨테이너 환경 경험",
      "AWS / GCP 클라우드 서비스 활용 경험",
      "대규모 트래픽 서비스 운영 경험",
      "오픈소스 기여 경험",
    ],
  },
  "mock-jd-2": {
    id: "mock-jd-2",
    company: "카카오",
    companyInitial: "카",
    companyColor: "linear-gradient(135deg,#FCD34D,#D97706)",
    source: "jobkorea.co.kr",
    title: "프론트엔드 개발자 — React / TypeScript",
    location: "판교",
    experience: "경력 2년↑",
    period: "~2025.12.31",
    status: "planned",
    interviewActive: true,
    interviewCount: 0,
    registeredAt: "2025. 12. 08",
    analyzed: true,
    originalUrl: "https://www.jobkorea.co.kr/Recruit/GI_Read/1",
    summary:
      "카카오의 핵심 서비스 UI를 담당하는 프론트엔드 개발자를 채용합니다. React와 TypeScript를 기반으로 사용자 경험을 향상시키고, 성능 최적화 및 웹 접근성 개선을 리딩하게 됩니다.",
    requirements: [
      { text: "React, TypeScript 기반 프론트엔드 개발 경험 2년 이상", level: "required" },
      { text: "HTML/CSS 깊은 이해 및 반응형 웹 구현 경험", level: "required" },
      { text: "REST API 연동 및 상태 관리 라이브러리 사용 경험", level: "accent" },
      { text: "Git 기반 협업 경험", level: "accent" },
    ],
    preferences: [
      "Next.js, Vite 빌드 환경 경험",
      "웹 접근성(WCAG) 관련 지식",
      "성능 최적화 경험 (Lighthouse 등)",
      "디자인 시스템 구축 경험",
    ],
  },
};

export interface UpdateStatusResponse {
  success: boolean;
  message: string;
}

export async function fetchJdDetailApi(id: string): Promise<{ success: boolean; data?: JdDetail; message?: string }> {
  await delay(400);
  const jd = MOCK_JD_DB[id];
  if (!jd) return { success: false, message: "채용공고를 찾을 수 없습니다." };
  return { success: true, data: { ...jd } };
}

export async function updateJdStatusApi(id: string, status: JdStatus): Promise<UpdateStatusResponse> {
  await delay(300);
  if (!MOCK_JD_DB[id]) return { success: false, message: "채용공고를 찾을 수 없습니다." };
  MOCK_JD_DB[id].status = status;
  return { success: true, message: "상태가 업데이트되었습니다." };
}

export async function deleteJdApi(id: string): Promise<UpdateStatusResponse> {
  await delay(500);
  if (!MOCK_JD_DB[id]) return { success: false, message: "채용공고를 찾을 수 없습니다." };
  delete MOCK_JD_DB[id];
  return { success: true, message: "채용공고가 삭제되었습니다." };
}

export interface UpdateJdPayload {
  customTitle?: string;
  status: JdStatus;
  interviewActive: boolean;
}

export async function updateJdApi(id: string, payload: UpdateJdPayload): Promise<UpdateStatusResponse> {
  await delay(600);
  if (!MOCK_JD_DB[id]) return { success: false, message: "채용공고를 찾을 수 없습니다." };
  MOCK_JD_DB[id] = { ...MOCK_JD_DB[id], ...payload };
  return { success: true, message: "변경사항이 저장되었습니다." };
}
