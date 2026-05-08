import type { LucideIcon } from "lucide-react";
import {
  ChartColumnIncreasing,
  Eye,
  FileText,
  Flame,
  Repeat,
  Target,
  Video,
  Zap,
} from "lucide-react";

export const team = {
  name: "54팀",
  course: "국민대학교 캡스톤 2026",
  github: "https://github.com/kmu-aws-capstone-team-4",
  classroomRepo: "https://github.com/kookmin-sw/2026-capstone-54",
  demo: "https://mefit.kr",
  api: "https://api.mefit.kr",
  members: [
    {
      name: "김신건",
      role: "PM",
      description:
        "프로젝트 매니저 · 전체 아키텍처\nAI / Infra / Backend 전반",
    },
    {
      name: "김석준",
      role: "Backend",
      description:
        "Django\n얼굴 분석 파이프라인\n채용공고 수집 파이프라인",
    },
    {
      name: "김유진",
      role: "Backend",
      description:
        "Django\n면접 질문 생성 과정\n면접 분석 리포트 파이프라인",
    },
    {
      name: "이주현",
      role: "Frontend",
      description: "React · TypeScript 기반\nUI 구성",
    },
  ],
};

export const heroBadge = {
  text: "모두가 미핏으로 면접 준비 중",
};

export const heroHeadline = {
  line1: "아직 핏이",
  line2Accent: "맞지 않아도",
  line3: "괜찮아.",
  subtitle: "未fit, meFit.\n이력서 기반 AI 면접부터 시선 분석까지.\n면접에 맞는 나로.",
};

export const heroRotatingKeywords: string[] = [
  "이력서 기반 맞춤 질문",
  "꼬리질문 + 전체 프로세스",
  "친근 · 일반 · 압박 면접관",
  "표정 · 발화 자동 분석",
  "영역별 점수 + 강점/개선점",
  "매일 10·30 티켓 자동 충전",
];

export const overviewBlocks = [
  {
    label: "해결할 문제",
    accent: "red",
    items: [
      "면접을 준비할 때, 혼자서 예상 질문이 궁금하다.",
      "ChatGPT 만으로는 말투나 비언어적 분석\n(표정 · 목소리톤) 을 확인할 수 없다.",
      "학교 / 유료 모의면접은 인원 · 예약 제한이 크고\n비용 부담도 크다.",
    ],
  },
  {
    label: "사용자 경험",
    accent: "accent",
    items: [
      "사용자 맞춤 면접 질문으로\n답변을 충분히 연습할 수 있다.",
      "영상 분석 + 음성 분석으로\n실제 면접과 비슷한 환경을 시뮬레이션한다.",
      "정량 점수와 6개 카테고리 피드백으로\n약점을 즉시 파악한다.",
    ],
  },
  {
    label: "타겟 사용자",
    accent: "amber",
    items: [
      "이력서 · 채용공고가 준비된\n취업 / 이직 준비자.",
      "예상 면접 질문이 궁금한\n모든 면접 준비자.",
      "지방 · 소규모 학교, 직무 전환자처럼\n오프라인 모의면접 접근이 어려운 구직자.",
    ],
  },
];

export interface FeatureItem {
  Icon: LucideIcon;
  title: string;
  desc: string;
  badge?: string;
  featured?: boolean;
}

export const features: FeatureItem[] = [
  {
    Icon: Video,
    title: "AI 화상 면접",
    desc: "1. 꼬리질문형 / 전체 프로세스형 \n 2. 친근/일반/압박 3단계 면접관 \n 3. 연습/실전 모드.",
    badge: "Pro 전체 프로세스",
    featured: true,
  },
  {
    Icon: FileText,
    title: "이력서 분석",
    desc: "PDF·DOCX  이력서 업로드 -> LLM 분석까지 자동으로 진행",
  },
  {
    Icon: Eye,
    title: "표정 · 발화 분석",
    desc: "표정 변화와 발화 데이터 추출\n 자신감 있는 태도를 준비할 수 있습니다.",
  },
  {
    Icon: ChartColumnIncreasing,
    title: "AI 리뷰 리포트",
    desc: "총평 / 영역별 점수 \n 질문별 피드백 / 강점 및 개선점을 제공합니다.",
  },
  {
    Icon: Flame,
    title: "스트릭 & 보상",
    desc: "면접 진행 시 최대 5티켓 보상 \n 매일 10/30티켓 자동 충전 + 연속 일수 기록.",
  },
];

export const howToSteps = [
  {
    num: "01",
    title: "면접 설정",
    desc: "이력서 + 채용공고 선택, 꼬리질문/전체 프로세스 + 친근/일반/압박 면접관 선택",
    label: "1 설정",
  },
  {
    num: "02",
    title: "사전 환경 점검",
    desc: "카메라·마이크·네트워크 자동 점검 → \n 모든 단계 통과 후 면접 시작 가능",
    label: "2 점검",
  },
  {
    num: "03",
    title: "면접 진행 & 분석",
    desc: "AI 면접 → 영역별 점수 리포트 생성",
    label: "3 결과",
  },
];

export const howToTags = [
  "꼬리질문형 (5티켓)",
  "전체 프로세스 (8티켓·Pro)",
  "친근 / 일반 / 압박 면접관",
  "연습 / 실전 (5~30초 랜덤 시작)",
];

export interface WhyReason {
  Icon: LucideIcon;
  title: string;
  desc: string;
  featured?: boolean;
}

export const whyReasons: WhyReason[] = [
  {
    Icon: Target,
    title: "이력서 & 채용공고 기반 맞춤 질문",
    desc: "이력서와 채용공고를 입력하면 AI가 직무·경력에 맞는 맞춤형 질문을 생성합니다. \n일반 예상 질문이 아닌, 나에게 딱 맞는 질문으로 면접을 준비할 수 있습니다.",
    featured: true,
  },
  {
    Icon: Repeat,
    title: "꼬리질문 AI",
    desc: "답변 내용에 따라 AI가 실시간으로 꼬리질문을 생성합니다. 친근/일반/압박 3단계 면접관으로 실전 긴장감을 경험합니다.",
  },
  {
    Icon: Eye,
    title: "표정 · 발화 분석",
    desc: "면접 녹화에서 표정 변화와 발화 데이터를 추출해 자신감 있는 태도와 전달력을 만들도록 구체적 피드백을 제공합니다.",
  },
  {
    Icon: ChartColumnIncreasing,
    title: "영역별 점수 리포트",
    desc: "총평 점수 + 영역별 카테고리 점수 + 질문별 피드백 + 강점/개선점을 한 번에 제공합니다. 약점을 명확히 파악해 효과적으로 개선할 수 있습니다.",
  },
  {
    Icon: Flame,
    title: "스트릭 + 티켓 보상",
    desc: "매일 10(Free)/30(Pro) 티켓 자동 충전 + 면접 완료 시 최대 15티켓 보상. 꾸준할수록 더 많이 연습할 수 있는 시스템입니다.",
  },
  {
    Icon: Zap,
    title: "24/7 언제든 면접",
    desc: "면접관 일정에 맞출 필요 없이 내가 원하는 시간에, 원하는 장소에서 면접 연습을 시작할 수 있습니다. 지방 거주자나 바쁜 직장인도 부담 없이 면접 준비가 가능합니다.",
  },
];

export const userFlow = [
  { step: "01", title: "이력서 등록", desc: "PDF/DOCX 업로드 또는 직접 입력 → LLM 자동 분석" },
  { step: "02", title: "채용공고 등록", desc: "URL 입력 → Playwright 스크래핑 + GPT 추출" },
  { step: "03", title: "면접 진행", desc: "AI 면접관과 1:1 가상 면접 (FOLLOWUP / FULL_PROCESS)" },
  { step: "04", title: "결과 확인", desc: "6개 카테고리 점수 + 음성 분석 + 모범 답안" },
];

export const activityDiagrams = [
  {
    title: "인증 / 회원가입 / 온보딩",
    image: "diagrams/activity-01-auth.png",
    desc: "Landing → 회원가입 → 이메일 인증 → 직무·경력 입력 → 홈 진입",
  },
  {
    title: "이력서 등록 → 분석",
    image: "diagrams/activity-02-resume.png",
    desc: "PDF/DOCX 업로드 또는 직접 입력. 확정 시 analysis-resume 워커가 텍스트 추출 + 임베딩 + LLM 파싱을 병렬 수행.",
  },
  {
    title: "채용공고 수집",
    image: "diagrams/activity-03-job-description.png",
    desc: "URL 입력 시 Scraping Worker(Playwright + GPT)가 자동 추출. SSE로 실시간 진행 상황 표시.",
  },
  {
    title: "가상 면접 진행",
    image: "diagrams/activity-04-interview.png",
    desc: "Precheck → 모드/난이도 선택 → WebSocket Q&A → MediaRecorder + S3 멀티파트 업로드 → AWS Lambda 영상 처리 (face-analyzer 포함)",
  },
  {
    title: "분석 리포트 생성",
    image: "diagrams/activity-05-analysis-report.png",
    desc: "interview-analysis-report 워커가 LLM 종합 분석. voice-analyzer Lambda 병렬 호출 + 6개 카테고리 채점.",
  },
];

export const infraDiagrams = [
  {
    title: "AWS 영상 처리 파이프라인",
    image: "diagrams/aws_infrastructure.png",
    desc: "S3 → SNS → SQS Fan-out → Lambda 5종(converter/frame/audio/face/voice). DLQ로 격리 + step-complete 큐 통합.",
  },
  {
    title: "k3s 클러스터 배포",
    image: "diagrams/k8s_infrastructure.png",
    desc: "EC2 위 k3s on Traefik. backend / voice-api / 4개 워커 + Redis + Flower를 단일 Namespace로 운영.",
  },
  {
    title: "통합 인프라",
    image: "diagrams/full_infrastructure.png",
    desc: "사용자 → CloudFlare Worker → k3s → AWS RDS / S3 / Lambda 까지 데이터 흐름 한 장 요약.",
  },
];

export interface ArchCategory {
  title: string;
  items: string[];
}

export const architecture: ArchCategory[] = [
  {
    title: "Backend Core",
    items: [
      "Django 6 + DRF 3.16 (Python 3.12+)",
      "Celery default / analysis / scraping 큐 분리",
      "AWS SQS를 구동하는 Celery Worker",
      "Channels: WebSocket(면접) + SSE(분석 상태 실시간 업데이트)",
      "LangChain + OpenAI GPT-4o 기반 AI 로직",
    ],
  },
  {
    title: "Frontend",
    items: [
      "React 19 + Vite + Bun + TypeScript",
      "Zustand · React Router 7 · Tailwind 4",
      "면접 세션을 useReducer 상태 머신으로 관리",
      "Feature-Sliced Design 아키텍처",
    ],
  },
  {
    title: "Microservices",
    items: [
      "scraping (Playwright + GPT)",
      "analysis-resume (Embedding + LLM)",
      "analysis-stt (Whisper · 발화 STT)",
      "interview-analysis-report (LLM + Hypothesis)",
      "voice-api (FastAPI + edge-tts)",
      "face-analyzer (MediaPipe + Lambda)",
      "LiteLLM Gateway (OpenAI/Bedrock 통합)",
    ],
  },
  {
    title: "Infrastructure & Observability",
    items: [
      "k3s on EC2 + Traefik Ingress",
      "AWS RDS PostgreSQL · S3 다중 버킷",
      "AWS SNS → SQS Fan-out → Lambda 5종",
      "Grafana + Prometheus 메트릭/대시보드",
      "Loki 로그 집계 + 알림",
      "GitHub Actions + deploy.sh 무중단 배포",
    ],
  },
];

export const techStack = [
  { group: "언어", items: ["Python 3.12+", "TypeScript", "Bash", "YAML"] },
  {
    group: "백엔드",
    items: ["Django 6", "DRF", "Celery", "Channels", "FastAPI", "LangChain", "Pydantic"],
  },
  {
    group: "프론트엔드",
    items: ["React 19", "Vite", "Bun", "Zustand", "Tailwind 4", "MediaRecorder"],
  },
  {
    group: "AI / LLM",
    items: [
      "OpenAI GPT-4o",
      "GPT-4o Vision",
      "Embedding",
      "LiteLLM Gateway",
      "AWS Bedrock",
      "MediaPipe",
      "Whisper STT",
    ],
  },
  {
    group: "데이터",
    items: ["PostgreSQL (RDS)", "Redis", "AWS S3", "SQLAlchemy"],
  },
  {
    group: "인프라",
    items: [
      "AWS EC2",
      "k3s",
      "Traefik",
      "AWS Lambda",
      "AWS SNS/SQS",
      "Docker",
      "GitHub Actions",
    ],
  },
  {
    group: "관측 / 모니터링",
    items: ["Grafana", "Prometheus", "Loki", "Flower (Celery)", "TokenUsage 추적"],
  },
  {
    group: "테스트 / 품질",
    items: ["pytest", "Hypothesis", "Jest", "Testing Library", "ruff", "mypy", "pre-commit"],
  },
];

export const navLinks = [
  { label: "서비스 소개", href: "#hero" },
  { label: "핵심 기능", href: "#features" },
  { label: "이용 방법", href: "#how-to" },
  { label: "팀 소개", href: "#team" },
];

export const footerLegal = [
  { label: "Classroom Repo", href: "https://github.com/kookmin-sw/2026-capstone-54" },
  { label: "Team GitHub", href: "https://github.com/kmu-aws-capstone-team-4" },
];
