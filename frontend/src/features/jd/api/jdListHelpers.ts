/**
 * 회사 이름의 첫 글자 추출
 */
export function getCompanyInitial(company: string): string {
  return company.charAt(0);
}

const GRADIENT_COLORS = [
  "linear-gradient(135deg,#60A5FA,#2563EB)",
  "linear-gradient(135deg,#34D399,#059669)",
  "linear-gradient(135deg,#F472B6,#DB2777)",
  "linear-gradient(135deg,#FCD34D,#D97706)",
  "linear-gradient(135deg,#A78BFA,#6D28D9)",
  "linear-gradient(135deg,#FB923C,#EA580C)",
  "linear-gradient(135deg,#38BDF8,#0284C7)",
  "linear-gradient(135deg,#4ADE80,#16A34A)",
];

/**
 * 회사별 그라데이션 색상 생성 (해시 기반)
 */
export function getCompanyColor(company: string): string {
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length];
}

const GREEN_TAGS = ["spring", "python", "airflow"];
const BLUE_TAGS = ["java", "typescript", "spark", "aws"];
const PINK_TAGS = ["android", "ios"];

/**
 * 태그 색상 매핑
 */
export function getTagColor(tag: string): "default" | "green" | "blue" | "pink" {
  const lower = tag.toLowerCase();
  if (GREEN_TAGS.some((t) => lower.includes(t))) return "green";
  if (BLUE_TAGS.some((t) => lower.includes(t))) return "blue";
  if (PINK_TAGS.some((t) => lower.includes(t))) return "pink";
  return "default";
}

const TIME_UNITS = [
  { threshold: 60000, divisor: 60000, unit: "분" },
  { threshold: 3600000, divisor: 3600000, unit: "시간" },
  { threshold: 86400000 * 7, divisor: 86400000, unit: "일" },
  { threshold: 86400000 * 28, divisor: 86400000 * 7, unit: "주" },
  { threshold: Infinity, divisor: 86400000 * 28, unit: "개월" },
];

/**
 * 상대 시간 표시 (예: "2일 전", "1주 전")
 */
export function getRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();

  if (diffMs < 60000) return "방금 전 등록";

  for (const { threshold, divisor, unit } of TIME_UNITS) {
    if (diffMs < threshold) {
      return `${Math.floor(diffMs / divisor)}${unit} 전`;
    }
  }

  return "방금 전 등록";
}
