/**
 * 직군 카테고리 id → lucide 아이콘 + 색상 매핑.
 * JobCategorySelector 와 CompanyIcon 이 동일한 스타일을 공유한다.
 *
 *   1 → IT/개발    (Code2,      #059669 green)
 *   2 → 마케팅     (Megaphone,  #EC4899 pink)
 *   3 → 금융/회계  (DollarSign, #F59E0B amber)
 *   4 → 영업/서비스(Handshake,  #0991B2 teal)
 *   5 → 인사/HR    (Users,      #8B5CF6 violet)
 *   0 → 기타       (Building2,  #9CA3AF gray)
 */
import {
  Code2,
  Megaphone,
  DollarSign,
  Handshake,
  Users,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CategoryStyle {
  Icon: LucideIcon;
  /** tailwind text-[...] 클래스 */
  color: string;
  /** tailwind bg-[...] 클래스 */
  bgColor: string;
}

export const CATEGORY_STYLE: Record<number, CategoryStyle> = {
  1: { Icon: Code2,      color: "text-[#059669]", bgColor: "bg-[#ECFDF5]" }, // IT/개발
  2: { Icon: Megaphone,  color: "text-[#EC4899]", bgColor: "bg-[#FDF2F8]" }, // 마케팅
  3: { Icon: DollarSign, color: "text-[#F59E0B]", bgColor: "bg-[#FFFBEB]" }, // 금융/회계
  4: { Icon: Handshake,  color: "text-[#0991B2]", bgColor: "bg-[#E6F7FA]" }, // 영업/서비스
  5: { Icon: Users,      color: "text-[#8B5CF6]", bgColor: "bg-[#F5F3FF]" }, // 인사/HR
  0: { Icon: Building2,  color: "text-[#9CA3AF]", bgColor: "bg-[#F3F4F6]" }, // 기타
};
