import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ChartColumnIncreasing,
  Eye,
  FileText,
  Flame,
  Repeat,
  Target,
  Video,
  Zap,
} from "lucide-react";

export interface HeroStat {
  value: string;
  label: string;
  numeric?: number;
  suffix?: string;
}

export interface FeatureItem {
  Icon: LucideIcon;
  title: string;
  desc: string;
  badge?: string;
  demoVideoUrl?: string | null;
}

export interface HowToStep {
  num: string;
  title: string;
  desc: string;
  label: string;
}

export interface ReviewReportItem {
  num: string;
  title: string;
  desc: string;
  badge?: string;
  score?: number;
  scoreLabel?: string;
}

export interface PricingItem {
  ok: boolean;
  text: string;
}

export interface WhyReason {
  Icon: LucideIcon;
  title: string;
  desc: string;
  featured?: boolean;
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  avatar: string;
}

export interface FooterColumns {
  service: string[];
  company: string[];
  legal: string[];
}

export const HERO_BADGE = {
  dotColor: "#059669",
  text: "수천 명이 meFit으로 면접 준비 중",
};

export const HERO_STATS: HeroStat[] = [
  { value: "10K+", label: "면접 연습", numeric: 10, suffix: "K+" },
  { value: "98%", label: "만족도", numeric: 98, suffix: "%" },
  { value: "4.9", label: "평점" },
  { value: "24/7", label: "이용 가능" },
];

export const HERO_ROTATING_KEYWORDS: string[] = [
  "이력서 기반 맞춤 질문",
  "꼬리질문 + 전체 프로세스",
  "친근 · 일반 · 압박 면접관",
  "표정 · 발화 자동 분석",
  "영역별 점수 + 강점/개선점",
  "매일 10·30 티켓 자동 충전",
];

export const HERO_ROTATING_KEYWORDS_LONGEST = HERO_ROTATING_KEYWORDS.reduce(
  (a, b) => (a.length >= b.length ? a : b),
);

export const FEATURES: FeatureItem[] = [
  {
    Icon: Video,
    title: "AI 화상 면접",
    desc: "꼬리질문형 5티켓 · 전체 프로세스 8티켓. 친근/일반/압박 3단계 면접관 + 연습/실전 모드.",
    badge: "Pro 전체 프로세스",
    demoVideoUrl: null,
  },
  {
    Icon: FileText,
    title: "이력서 분석",
    desc: "PDF·DOCX 업로드 즉시 텍스트 추출 → 임베딩 → 직무 매칭 질문을 자동 생성합니다.",
  },
  {
    Icon: Eye,
    title: "표정 · 발화 분석",
    desc: "면접 영상에서 표정 변화와 발화 데이터를 추출해 자신감 있는 태도를 만들어드립니다.",
  },
  {
    Icon: ChartColumnIncreasing,
    title: "AI 리뷰 리포트",
    desc: "총평 + 영역별 점수 + 질문별 피드백 + 강점/개선점을 2티켓에 받아보세요.",
  },
  {
    Icon: Flame,
    title: "스트릭 & 보상",
    desc: "면접 1회당 최대 5티켓 보상 (하루 5회). 매일 10/30티켓 자동 충전 + 연속 일수 기록.",
  },
];

export const HOW_TO_STEPS: HowToStep[] = [
  { num: "01", title: "면접 설정", desc: "이력서 + 채용공고 선택, 꼬리질문/전체 프로세스 + 친근/일반/압박 면접관 선택", label: "1 설정" },
  { num: "02", title: "사전 환경 점검", desc: "카메라·마이크·네트워크 자동 점검", label: "2 점검" },
  { num: "03", title: "면접 진행 & 분석", desc: "AI 면접 → 표정·발화 분석 → 영역별 점수 리포트 자동 생성", label: "3 결과" },
];

export const HOW_TO_TAGS: string[] = [
  "꼬리질문형 (5티켓)",
  "전체 프로세스 (8티켓·Pro)",
  "친근 / 일반 / 압박 면접관",
  "연습 / 실전 (5~30초 랜덤 시작)",
];

export const REVIEW_REPORTS: ReviewReportItem[] = [
  {
    num: "01",
    badge: "표정 · 발화",
    title: "말하는 방식까지 분석",
    desc: "녹화 영상에서 표정 변화와 발화 데이터를 추출해 답변 명확성·속도·전달력을 점수화하고 개선점을 제시합니다.",
    score: 88,
    scoreLabel: "전달력 점수",
  },
  {
    num: "02",
    badge: "영역별 점수",
    title: "총평 + 카테고리 점수",
    desc: "총평 점수 + 영역별 카테고리 점수 + 질문별 피드백 + 강점·개선점을 단 2티켓에. (Pro: 녹화 영상 재생 가능)",
    score: 92,
    scoreLabel: "종합 점수",
  },
  {
    num: "03",
    badge: "꼬리질문 AI",
    title: "실전 같은 대화 흐름",
    desc: "답변 내용에 따라 실시간 꼬리질문 생성. 친근/일반/압박 3단계 면접관이 실제 같은 긴장감을 만듭니다.",
    score: 95,
    scoreLabel: "대화 자연스러움",
  },
];

export const PRICING_FREE_ITEMS: PricingItem[] = [
  { ok: true, text: "매일 10티켓 자동 충전" },
  { ok: true, text: "꼬리질문형 면접 + 연습 모드" },
  { ok: true, text: "AI 분석 리포트 (2티켓/회)" },
  { ok: true, text: "이력서 3개 · 채용공고 5개" },
  { ok: false, text: "전체 프로세스 면접 + 실전 모드" },
  { ok: false, text: "녹화 영상 재생 + 무제한 히스토리" },
];

export const PRICING_PRO_ITEMS: PricingItem[] = [
  { ok: true, text: "매일 30티켓 자동 충전" },
  { ok: true, text: "꼬리질문 + 전체 프로세스 면접" },
  { ok: true, text: "연습 + 실전 모드 (5~30초 랜덤 시작)" },
  { ok: true, text: "녹화 영상 재생 + 무제한 히스토리" },
  { ok: true, text: "이력서 · 채용공고 무제한 등록" },
  { ok: true, text: "면접 완료 보상 최대 15티켓/일" },
];

export interface PricingPlanPrice {
  amount: number;
  period: string;
  note: string;
  badge?: string;
}

export const PRICING_PRO_PLANS: Record<"monthly" | "yearly", PricingPlanPrice> = {
  monthly: {
    amount: 19900,
    period: "월",
    note: "월 구독",
  },
  yearly: {
    amount: 16583,
    period: "월",
    note: "연 199,000원 결제",
    badge: "2개월 무료",
  },
};

export const WHY_REASONS: WhyReason[] = [
  {
    Icon: Target,
    title: "이력서 기반 맞춤 질문",
    desc: "이력서를 업로드하면 AI가 직무와 경력에 맞는 맞춤형 질문을 생성합니다. 일반 예상 질문이 아닌, 나에게 딱 맞는 질문으로 준비하세요.",
    featured: true,
  },
  {
    Icon: Repeat,
    title: "꼬리질문 AI",
    desc: "답변 내용에 따라 AI가 실시간으로 꼬리질문을 생성합니다. 친근/일반/압박 3단계 면접관으로 실전 긴장감 경험.",
  },
  {
    Icon: Eye,
    title: "표정 · 발화 분석",
    desc: "면접 녹화에서 표정 변화와 발화 데이터를 추출해 자신감 있는 태도와 전달력을 만들도록 구체적 피드백을 제공합니다.",
  },
  {
    Icon: ChartColumnIncreasing,
    title: "영역별 점수 리포트",
    desc: "총평 점수 + 영역별 카테고리 점수 + 질문별 피드백 + 강점/개선점을 한 번에. 단 2티켓.",
  },
  {
    Icon: Flame,
    title: "스트릭 + 티켓 보상",
    desc: "매일 10(Free)/30(Pro) 티켓 자동 충전 + 면접 완료 시 최대 15티켓 보상. 꾸준히 할수록 더 많이 연습.",
  },
  {
    Icon: Zap,
    title: "24/7 언제든 면접",
    desc: "면접관 일정에 맞출 필요 없이 내가 원하는 시간에, 원하는 장소에서 면접 연습을 시작하세요.",
  },
  {
    Icon: Building2,
    title: "채용공고 연동",
    desc: "지원하는 채용공고를 등록하면 해당 직무에 최적화된 질문이 생성됩니다. Free 5개 / Pro 무제한.",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "김서연",
    role: "프론트엔드 개발자 취준생",
    quote:
      "면접에서 항상 긴장했는데, meFit으로 연습하니까 실전에서 훨씬 자연스럽게 답변할 수 있었어요. 꼬리질문 기능이 진짜 실제 면접 같아요.",
    avatar: "👩‍💻",
  },
  {
    name: "박준혁",
    role: "백엔드 개발자 · 이직 준비",
    quote:
      "시선 추적 분석 덕분에 면접 중 시선이 자꾸 내려가는 습관을 고칠 수 있었습니다. 리포트가 정말 상세해서 좋았어요.",
    avatar: "👨‍💼",
  },
  {
    name: "이하은",
    role: "디자이너 · 신입",
    quote:
      "이력서 기반으로 질문이 나오니까 훨씬 실전적이에요. 3일 만에 면접 합격 연락 받았습니다!",
    avatar: "👩‍🎨",
  },
  {
    name: "정민수",
    role: "PM · 경력 3년차",
    quote:
      "스트릭 기능 덕분에 매일 꾸준히 연습하게 됐어요. AI 피드백이 생각보다 정확해서 놀랐습니다.",
    avatar: "🧑‍💻",
  },
  {
    name: "최지원",
    role: "마케터 · 경력 2년차",
    quote:
      "전달력 점수가 직관적이라 어떤 부분을 개선해야 할지 명확해졌어요. 답변 구조가 한결 깔끔해졌습니다.",
    avatar: "🧑‍💼",
  },
  {
    name: "강도윤",
    role: "신입 데이터 분석가",
    quote:
      "이력서를 올리자마자 직무에 맞는 질문이 쏟아지는 게 신기했어요. 지원하는 회사마다 맞춤 면접이 가능합니다.",
    avatar: "👨‍🔬",
  },
  {
    name: "윤서아",
    role: "기획자 · 경력 5년차",
    quote:
      "출퇴근 길에 짧게 한 라운드씩 돌렸는데, 한 달 만에 발음·전달력 점수가 30점 올랐어요. 시간 대비 효율 최고.",
    avatar: "👩‍🏫",
  },
  {
    name: "한태성",
    role: "iOS 개발자 · 경력 4년차",
    quote:
      "꼬리질문이 진짜 면접관처럼 파고들어요. 답변 준비가 얕은 부분을 정확히 짚어줘서 보완 포인트가 명확해졌습니다.",
    avatar: "👨‍💻",
  },
];

export const FOOTER_LINKS: FooterColumns = {
  service: ["면접 시작", "이력서 관리", "채용공고 연동", "스트릭", "요금제"],
  company: ["소개", "채용", "블로그", "문의"],
  legal: ["개인정보처리방침", "이용약관", "쿠키 정책", "데이터 수집 동의"],
};
