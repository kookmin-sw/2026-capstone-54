/**
 * 회사/JD 아이콘 컴포넌트.
 * Building 아이콘을 공통으로 사용하고,
 * seed(id 또는 title)를 해시해서 항상 동일한 항목은 동일한 색상을 표시한다.
 */
import { Building } from "lucide-react";

export type CompanyIconSize = 14 | 16 | 18 | 20 | 22 | 24;

interface CompanyIconProps {
  /** 색상 결정에 사용할 고유 식별자 (jd id 등) */
  seed?: string | number;
  size?: CompanyIconSize;
}

const PALETTES: Array<{ color: string; bgColor: string }> = [
  { color: "#0991B2", bgColor: "#E6F7FA" }, // teal
  { color: "#059669", bgColor: "#ECFDF5" }, // green
  { color: "#8B5CF6", bgColor: "#F5F3FF" }, // violet
  { color: "#F59E0B", bgColor: "#FFFBEB" }, // amber
  { color: "#EC4899", bgColor: "#FDF2F8" }, // pink
  { color: "#3B82F6", bgColor: "#EFF6FF" }, // blue
  { color: "#EF4444", bgColor: "#FEF2F2" }, // red
  { color: "#14B8A6", bgColor: "#F0FDFA" }, // teal-500
];

function hashSeed(seed: string | number): number {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function CompanyIcon({ seed = 0, size = 16 }: CompanyIconProps) {
  const { color, bgColor } = PALETTES[hashSeed(seed) % PALETTES.length];

  return (
    <div
      className="w-full h-full flex items-center justify-center rounded-lg"
      style={{ background: bgColor }}
    >
      <Building size={size} style={{ color }} />
    </div>
  );
}
