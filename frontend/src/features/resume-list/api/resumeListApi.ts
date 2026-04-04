const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

const MOCK_RESUMES: ResumeItem[] = [
  {
    id: "r1",
    title: "백엔드 개발자 이력서 v2",
    type: "file",
    fileExt: "PDF",
    skills: ["Python", "Django", "PostgreSQL", "AWS"],
    extraSkillCount: 3,
    meta: "🏢 스타트업 3년",
    status: "active",
    date: "03.20",
  },
  {
    id: "r2",
    title: "신입 개발자 자기소개",
    type: "text",
    skills: ["React", "TypeScript", "Node.js"],
    extraSkillCount: 0,
    meta: "🎓 졸업예정 2025",
    status: "active",
    date: "03.15",
  },
  {
    id: "r3",
    title: "프론트엔드 포트폴리오",
    type: "file",
    fileExt: "DOCX",
    skills: ["Vue.js", "Figma"],
    extraSkillCount: 0,
    meta: "📂 업로드 완료",
    status: "parsing",
    date: "방금 전",
  },
];

const MOCK_SUMMARY: ResumeSummary = {
  total: 3,
  active: 2,
  parsing: 1,
  inactive: 0,
  fileCount: 2,
  textCount: 1,
  interviewCount: 12,
  avgScore: 83,
  recentQuestions: [
    "Django REST Framework에서 성능 최적화를 위해 사용한 방법은?",
    "AWS에서 비용을 줄이기 위해 어떤 아키텍처를 선택했나요?",
    "팀 내 코드 리뷰 문화를 어떻게 형성했나요?",
  ],
};

export async function fetchResumesApi(): Promise<{
  resumes: ResumeItem[];
  summary: ResumeSummary;
}> {
  await delay(400);
  return {
    resumes: MOCK_RESUMES.map((r) => ({ ...r })),
    summary: { ...MOCK_SUMMARY },
  };
}

export async function toggleResumeActiveApi(id: string): Promise<void> {
  await delay(300);
  const idx = MOCK_RESUMES.findIndex((r) => r.id === id);
  if (idx !== -1) {
    const r = MOCK_RESUMES[idx];
    r.status = r.status === "active" ? "inactive" : "active";
  }
}

export async function deleteResumeApi(id: string): Promise<void> {
  await delay(300);
  const idx = MOCK_RESUMES.findIndex((r) => r.id === id);
  if (idx !== -1) MOCK_RESUMES.splice(idx, 1);
}
