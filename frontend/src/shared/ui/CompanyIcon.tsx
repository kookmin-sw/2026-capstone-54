/**
 * 회사/JD 아이콘 컴포넌트.
 * platform·title 키워드로 직군 카테고리를 추론하고,
 * categoryIconStyle 의 CATEGORY_STYLE 과 동일한 아이콘·색상을 렌더링한다.
 */
import { CATEGORY_STYLE } from "./categoryIconStyle";

export type CompanyIconSize = 14 | 16 | 18 | 20 | 22 | 24;

interface CompanyIconProps {
  platform?: string;
  title?: string;
  /** 카테고리 id를 직접 지정할 경우 platform/title 추론보다 우선 */
  categoryId?: number;
  size?: CompanyIconSize;
}

/** platform·title 키워드 → 카테고리 id 추론 */
function inferCategoryId(platform: string, title: string): number {
  const src = `${platform} ${title}`.toLowerCase();

  // IT/개발 (1)
  if (
    src.includes("tech") || src.includes("software") || src.includes("개발") ||
    src.includes("engineer") || src.includes("it") || src.includes("dev") ||
    src.includes("backend") || src.includes("frontend") || src.includes("fullstack") ||
    src.includes("data") || src.includes("ai") || src.includes("ml") ||
    src.includes("naver") || src.includes("kakao") || src.includes("google") ||
    src.includes("meta") || src.includes("nexon") || src.includes("ncsoft")
  ) return 1;

  // 마케팅 (2)
  if (
    src.includes("market") || src.includes("마케팅") || src.includes("광고") ||
    src.includes("brand") || src.includes("브랜드") || src.includes("content") ||
    src.includes("콘텐츠") || src.includes("design") || src.includes("디자인")
  ) return 2;

  // 금융/회계 (3)
  if (
    src.includes("bank") || src.includes("은행") || src.includes("금융") ||
    src.includes("finance") || src.includes("pay") || src.includes("toss") ||
    src.includes("카드") || src.includes("결제") || src.includes("회계") ||
    src.includes("accounting")
  ) return 3;

  // 영업/서비스 (4)
  if (
    src.includes("sales") || src.includes("영업") || src.includes("service") ||
    src.includes("서비스") || src.includes("cs") || src.includes("고객") ||
    src.includes("delivery") || src.includes("배달") || src.includes("물류") ||
    src.includes("shop") || src.includes("쇼핑") || src.includes("commerce")
  ) return 4;

  // 인사/HR (5)
  if (
    src.includes("hr") || src.includes("인사") || src.includes("recruit") ||
    src.includes("채용") || src.includes("people") || src.includes("talent")
  ) return 5;

  return 0; // 기타
}

/**
 * 회사/JD 아이콘.
 * categoryId를 직접 넘기면 JobCategorySelector 와 완전히 동일한 아이콘·색상을 사용한다.
 */
export function CompanyIcon({ platform = "", title = "", categoryId, size = 16 }: CompanyIconProps) {
  const id = categoryId ?? inferCategoryId(platform, title);
  const { Icon, color, bgColor } = CATEGORY_STYLE[id] ?? CATEGORY_STYLE[0];

  return (
    <div className={`w-full h-full flex items-center justify-center rounded-lg ${bgColor}`}>
      <Icon size={size} className={color} />
    </div>
  );
}
