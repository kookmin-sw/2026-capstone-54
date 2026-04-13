import { create } from "zustand";
import { saveResumeApi, fetchResumeDetailApi, updateResumeApi } from "../api/resumeInputApi";

/* ── Templates ── */
export const TEMPLATES: Record<string, string> = {
  fe: `경력: 프론트엔드 개발자 2년 (스타트업)
기술: React 18, TypeScript 5, Next.js 14, TailwindCSS, Zustand
학력: 컴퓨터공학과 졸업 (2021)

주요 업무:
- 메인 서비스 UI 전면 리뉴얼
- Lighthouse 45→92점 성능 최적화
- 디자인 시스템 구축

자기소개:
사용자 경험을 최우선으로 생각하는 프론트엔드 개발자입니다.`,

  be: `경력: 백엔드 개발자 3년 (스타트업)
기술: Python, Django, FastAPI, PostgreSQL, Redis, Docker, AWS
학력: 컴퓨터공학과 졸업 (2020)

주요 업무:
- 월 500만 DAU REST API 설계 및 개발
- 결제 시스템 도입 (PG사 연동)
- CI/CD 파이프라인 구축`,

  fs: `경력: 풀스택 개발자 2년
기술: React, Node.js, TypeScript, PostgreSQL, AWS

주요 업무:
- SaaS 플랫폼 프론트엔드 & 백엔드 전담
- OAuth 2.0 소셜 로그인 구현
- WebSocket 실시간 알림 개발`,

  ds: `직무: UI/UX 디자이너 3년
도구: Figma, Adobe XD, Zeplin

주요 프로젝트:
- B2C 금융 앱 UI 리뉴얼 (DAU 30% 상승)
- 컴포넌트 기반 디자인 시스템 구축
- 사용성 테스트 리드`,

  pm: `직무: 프로덕트 매니저 2년
배경: 개발 경험 있음 (백엔드 1년)
도구: Notion, Jira, Amplitude

주요 성과:
- 핵심 기능 기획·출시 (MAU 200% 증가)
- 스프린트 도입으로 개발 속도 40% 향상`,

  nw: `학력: 컴퓨터공학과 4학년 재학 중 (졸업예정 2025.02)
기술: React, JavaScript, Python, Git

프로젝트:
- 팀 프로젝트: 맛집 추천 웹 서비스 (React + Node.js)
- 개인 프로젝트: TODO 앱 (Vanilla JS)

기타:
- 교내 개발 동아리 2년
- 정보처리기사 취득 예정`,
};

/* ── Keyword Map ── */
export const KEYWORD_MAP: Record<string, string> = {
  React: "React",
  TypeScript: "TypeScript",
  Python: "Python",
  Django: "Django",
  "Node.js": "Node.js",
  AWS: "AWS",
  "Next.js": "Next.js",
  PostgreSQL: "PostgreSQL",
  Vue: "Vue.js",
  Docker: "Docker",
  Figma: "Figma",
  Redis: "Redis",
  FastAPI: "FastAPI",
  Kotlin: "Kotlin",
  Swift: "Swift",
  Flutter: "Flutter",
  GraphQL: "GraphQL",
  MySQL: "MySQL",
  MongoDB: "MongoDB",
  Kubernetes: "K8s",
  "CI/CD": "CI/CD",
};

function extractTags(text: string): string[] {
  const found: string[] = [];
  for (const [key, label] of Object.entries(KEYWORD_MAP)) {
    if (text.includes(key) && !found.includes(label)) found.push(label);
  }
  return found;
}

function buildSummary(text: string, tags: string[]): string {
  const lines = text.split("\n").filter((l) => l.trim().length > 2);
  let s = "";
  if (tags.length > 0)
    s += `${tags.slice(0, 3).join(", ")} 등 ${tags.length}개 기술을 감지했어요.`;
  if (lines.length >= 3) s += ` 총 ${lines.length}개 항목을 파악했어요.`;
  return s || "내용을 더 입력하면 분석이 시작돼요...";
}

interface ResumeInputState {
  title: string;
  content: string;
  editingUuid: string | null;
  detectedTags: string[];
  previewSummary: string;
  showPreview: boolean;
  showCharWarn: boolean;
  isSubmitting: boolean;
  showSuccess: boolean;
  error: string | null;

  setTitle: (v: string) => void;
  setContent: (v: string) => void;
  applyTemplate: (key: string) => void;
  loadForEdit: (uuid: string) => Promise<void>;
  submit: () => Promise<void>;
  closeSuccess: () => void;
  reset: () => void;
}

let previewTimer: ReturnType<typeof setTimeout> | null = null;

export const useResumeInputStore = create<ResumeInputState>()((set, get) => ({
  title: "",
  content: "",
  editingUuid: null,
  detectedTags: [],
  previewSummary: "",
  showPreview: false,
  showCharWarn: false,
  isSubmitting: false,
  showSuccess: false,
  error: null,

  setTitle: (title) => set({ title }),

  setContent: (content) => {
    const len = content.length;
    set({
      content,
      showPreview: len > 20,
      showCharWarn: len > 0 && len < 50,
      detectedTags: [],
      previewSummary: "",
    });
    if (previewTimer) clearTimeout(previewTimer);
    if (len > 20) {
      previewTimer = setTimeout(() => {
        const tags = extractTags(content);
        set({ detectedTags: tags, previewSummary: buildSummary(content, tags) });
      }, 350);
    }
  },

  applyTemplate: (key) => get().setContent(TEMPLATES[key] ?? ""),

  loadForEdit: async (uuid) => {
    set({ error: null });
    try {
      const detail = await fetchResumeDetailApi(uuid);
      get().setContent(detail.content ?? "");
      set({ title: detail.title, editingUuid: uuid });
    } catch {
      set({ error: "이력서를 불러오지 못했습니다." });
    }
  },

  submit: async () => {
    const { title, content, editingUuid } = get();
    set({ isSubmitting: true, error: null });
    const res = editingUuid
      ? await updateResumeApi(editingUuid, { title, content })
      : await saveResumeApi({ title, content });
    if (!res.success) {
      set({ isSubmitting: false, error: res.message });
      return;
    }
    set({ isSubmitting: false, showSuccess: true });
  },

  closeSuccess: () => set({ showSuccess: false }),

  reset: () =>
    set({
      title: "",
      content: "",
      editingUuid: null,
      detectedTags: [],
      previewSummary: "",
      showPreview: false,
      showCharWarn: false,
      isSubmitting: false,
      showSuccess: false,
      error: null,
    }),
}));
