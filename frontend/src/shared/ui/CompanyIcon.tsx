/**
 * 회사/JD 아이콘 컴포넌트.
 * platform·title 키워드로 직군 카테고리를 추론하고,
 * categoryIconStyle 의 CATEGORY_STYLE 과 동일한 아이콘·색상을 렌더링한다.
 */
import { CATEGORY_STYLE } from "./categoryIconStyle";
import { inferCategoryId } from "./inferCategoryId";

export type CompanyIconSize = 14 | 16 | 18 | 20 | 22 | 24;

interface CompanyIconProps {
  platform?: string;
  title?: string;
  /** 카테고리 id를 직접 지정할 경우 platform/title 추론보다 우선 */
  categoryId?: number;
  size?: CompanyIconSize;
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
