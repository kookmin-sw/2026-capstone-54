// Mock JD API

export type JdStatus = "planned" | "saved" | "applied";

export interface JdPayload {
  url: string;
  customTitle?: string;
  status: JdStatus;
  interviewActive: boolean;
}

export interface JdUrlAnalysis {
  company: string;
  title: string;
  domain: string;
}

export interface JdResponse {
  success: boolean;
  message: string;
  jdId?: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOCK_ANALYSIS: Record<string, JdUrlAnalysis> = {
  "saramin.co.kr": { company: "네이버", title: "백엔드 엔지니어 (Spring Boot)", domain: "saramin.co.kr" },
  "jobkorea.co.kr": { company: "카카오", title: "프론트엔드 개발자 (React)", domain: "jobkorea.co.kr" },
  "wanted.co.kr": { company: "토스", title: "풀스택 개발자", domain: "wanted.co.kr" },
  "linkedin.com": { company: "삼성SDS", title: "AI 엔지니어", domain: "linkedin.com" },
};

export async function analyzeUrlApi(url: string): Promise<{ success: boolean; data?: JdUrlAnalysis; message?: string }> {
  await delay(900);
  if (!url.startsWith("http")) {
    return { success: false, message: "올바른 URL을 입력해 주세요" };
  }
  const matched = Object.keys(MOCK_ANALYSIS).find((key) => url.includes(key));
  if (matched) {
    return { success: true, data: MOCK_ANALYSIS[matched] };
  }
  return {
    success: true,
    data: { company: "회사명 분석 중", title: "채용공고 제목 분석 중", domain: new URL(url).hostname },
  };
}

export async function createJdApi(payload: JdPayload): Promise<JdResponse> {
  await delay(1000);
  if (!payload.url) {
    return { success: false, message: "URL을 입력해 주세요." };
  }
  return {
    success: true,
    message: "채용공고가 등록되었습니다.",
    jdId: `jd-${Date.now()}`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function saveDraftApi(_payload: Partial<JdPayload>): Promise<JdResponse> {
  await delay(600);
  return {
    success: true,
    message: "임시저장되었습니다.",
    jdId: `draft-${Date.now()}`,
  };
}
