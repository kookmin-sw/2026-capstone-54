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
  "AI 화상 면접",
  "이력서 기반 질문",
  "시선 추적 분석",
  "꼬리질문 AI",
  "영역별 점수 리포트",
  "스트릭 습관 형성",
];

export const HERO_ROTATING_KEYWORDS_LONGEST = HERO_ROTATING_KEYWORDS.reduce(
  (a, b) => (a.length >= b.length ? a : b),
);

export const FEATURES: FeatureItem[] = [
  {
    Icon: Video,
    title: "AI 화상 면접",
    desc: "실시간 화상으로 AI 면접관과 대화. 꼬리질문 방식과 전체 프로세스 방식 중 선택하세요.",
    badge: "Pro 핵심 기능",
  },
  {
    Icon: FileText,
    title: "이력서 분석",
    desc: "PDF·DOCX 업로드 즉시 AI가 분석해 맞춤 면접 질문을 생성합니다.",
  },
  {
    Icon: Eye,
    title: "시선 추적 분석",
    desc: "면접 중 시선 이탈 횟수와 집중도를 분석해 자신감 있는 태도를 만들어드립니다.",
  },
  {
    Icon: ChartColumnIncreasing,
    title: "AI 리뷰 리포트",
    desc: "발음·전달력, 논리적 구성, 태도·자신감, 전문 용어 4개 영역 점수를 상세 분석합니다.",
  },
  {
    Icon: Flame,
    title: "스트릭 & 통계",
    desc: "연속 면접 일수와 연간 활동 기록으로 꾸준한 습관을 만들고 성장을 시각화하세요.",
  },
];

export const HOW_TO_STEPS: HowToStep[] = [
  {
    num: "01",
    title: "면접 설정",
    desc: "이력서 선택, 면접 유형·시간·모드 설정",
    label: "1 설정",
  },
  {
    num: "02",
    title: "사전 환경 점검",
    desc: "카메라·마이크·네트워크 자동 점검",
    label: "2 점검",
  },
  {
    num: "03",
    title: "면접 진행 & 결과 확인",
    desc: "AI 면접 후 즉시 영역별 점수 리포트 제공",
    label: "3 면접",
  },
];

export const HOW_TO_TAGS: string[] = [
  "꼬리질문 방식",
  "전체 프로세스 방식",
  "연습 / 실전 모드",
  "15분 ~ 60분",
];

export const REVIEW_REPORTS: ReviewReportItem[] = [
  {
    num: "01",
    badge: "발음 / 전달력",
    title: "말하는 방식까지 분석",
    desc: "답변 명확성, 발음, 속도, 전달력을 점수화해 구체적인 개선 방향을 제시합니다.",
    score: 88,
    scoreLabel: "전달력 점수",
  },
  {
    num: "02",
    title: "영역별 점수 리포트",
    desc: "발음·전달력 / 논리적 구성 / 태도·자신감 / 전문 용어 활용 4개 영역을 세밀하게 평가합니다.",
    score: 92,
    scoreLabel: "종합 점수",
  },
  {
    num: "03",
    title: "꼬리질문 AI 대화",
    desc: "답변에 따라 실시간으로 꼬리질문을 생성. 실제 면접관처럼 자연스러운 대화 흐름을 만듭니다.",
    score: 95,
    scoreLabel: "대화 자연스러움",
  },
];

export const PRICING_FREE_ITEMS: PricingItem[] = [
  { ok: true, text: "월 5회 면접" },
  { ok: true, text: "기본 AI 리뷰 리포트" },
  { ok: true, text: "스트릭 기능" },
  { ok: true, text: "이력서 등록 (최대 2개)" },
  { ok: false, text: "시선 추적 분석" },
  { ok: false, text: "상세 AI 리뷰 리포트" },
];

export const PRICING_PRO_ITEMS: PricingItem[] = [
  { ok: true, text: "무제한 면접" },
  { ok: true, text: "상세 AI 리뷰 리포트" },
  { ok: true, text: "시선 추적 분석" },
  { ok: true, text: "스트릭 보상 2배" },
  { ok: true, text: "이력서 무제한 등록" },
  { ok: true, text: "채용공고 연동" },
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
    desc: "이력서를 업로드하면 AI가 직무와 경력에 맞는 맞춤형 질문을 생성합니다. 일반적인 예상 질문이 아닌, 나에게 딱 맞는 질문으로 준비하세요.",
    featured: true,
  },
  {
    Icon: Repeat,
    title: "꼬리질문 AI",
    desc: "답변 내용에 따라 AI가 실시간으로 꼬리질문을 생성해 실제 면접과 똑같은 긴장감을 경험할 수 있습니다.",
  },
  {
    Icon: Eye,
    title: "시선 추적 분석",
    desc: "면접 중 시선 이탈 횟수를 측정해 자신감 있는 면접 태도를 만들 수 있도록 구체적인 피드백을 제공합니다.",
  },
  {
    Icon: ChartColumnIncreasing,
    title: "영역별 점수 리포트",
    desc: "발음·전달력, 논리적 구성, 태도·자신감, 전문 용어 활용 총 4개 영역을 수치로 확인하고 개선하세요.",
  },
  {
    Icon: Flame,
    title: "스트릭으로 습관 형성",
    desc: "연속 면접 일수와 연간 활동 기록으로 꾸준한 면접 연습 습관을 만들고 성장 과정을 시각화하세요.",
  },
  {
    Icon: Zap,
    title: "24/7 언제든 면접",
    desc: "면접관 일정에 맞출 필요 없이 내가 원하는 시간에, 원하는 장소에서 면접 연습을 시작하세요.",
  },
  {
    Icon: Building2,
    title: "채용공고 연동",
    desc: "지원하는 채용공고를 등록하면 해당 직무에 최적화된 면접 질문으로 연습할 수 있습니다.",
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
