// Mock Onboarding API

export interface OnboardingPayload {
  desiredJob: string;
  jobTitles: string[];
  jobStatus: string;
}

interface OnboardingResponse {
  success: boolean;
  message: string;
}

export interface JobTitleOption {
  id: string;
  label: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 직군별 직업 리스트 mock 데이터
const JOB_TITLES_BY_CATEGORY: Record<string, JobTitleOption[]> = {
  it: [
    { id: "frontend", label: "프론트엔드 개발자" },
    { id: "backend", label: "백엔드 개발자" },
    { id: "fullstack", label: "풀스택 개발자" },
    { id: "mobile", label: "모바일 개발자" },
    { id: "devops", label: "DevOps 엔지니어" },
    { id: "data-engineer", label: "데이터 엔지니어" },
    { id: "ml-engineer", label: "ML 엔지니어" },
    { id: "security", label: "보안 엔지니어" },
    { id: "qa", label: "QA 엔지니어" },
    { id: "pm", label: "IT PM" },
  ],
  marketing: [
    { id: "digital-marketer", label: "디지털 마케터" },
    { id: "content-marketer", label: "콘텐츠 마케터" },
    { id: "brand-manager", label: "브랜드 매니저" },
    { id: "performance-marketer", label: "퍼포먼스 마케터" },
    { id: "growth-hacker", label: "그로스 해커" },
    { id: "seo-specialist", label: "SEO 전문가" },
  ],
  finance: [
    { id: "accountant", label: "회계사" },
    { id: "financial-analyst", label: "재무 분석가" },
    { id: "auditor", label: "감사" },
    { id: "tax-specialist", label: "세무사" },
    { id: "investment-banker", label: "투자은행가" },
    { id: "risk-manager", label: "리스크 매니저" },
  ],
  sales: [
    { id: "account-manager", label: "어카운트 매니저" },
    { id: "sales-manager", label: "영업 관리자" },
    { id: "biz-dev", label: "사업개발 매니저" },
    { id: "cs-manager", label: "CS 매니저" },
    { id: "retail-manager", label: "리테일 매니저" },
  ],
  hr: [
    { id: "recruiter", label: "리크루터" },
    { id: "hr-manager", label: "HR 매니저" },
    { id: "compensation-specialist", label: "보상/복리후생 담당자" },
    { id: "training-manager", label: "교육/연수 담당자" },
    { id: "hrbp", label: "HRBP" },
  ],
};

/** 선택된 직군에 해당하는 직업 리스트를 반환하는 mock API */
export async function fetchJobTitlesApi(
  categoryId: string
): Promise<JobTitleOption[]> {
  await delay(400);
  return JOB_TITLES_BY_CATEGORY[categoryId] ?? [];
}

export async function submitProfileApi(
  payload: OnboardingPayload
): Promise<OnboardingResponse> {
  await delay(1000);
  if (!payload.desiredJob) {
    return { success: false, message: "희망 직군을 선택해주세요." };
  }
  if (payload.jobTitles.length === 0) {
    return { success: false, message: "희망 직업을 1개 이상 선택해주세요." };
  }
  if (!payload.jobStatus) {
    return { success: false, message: "현재 직업 상태를 선택해주세요." };
  }
  return { success: true, message: "프로필이 저장되었습니다." };
}
