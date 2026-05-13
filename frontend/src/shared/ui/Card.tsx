/** 흰색 배경에 테두리와 그림자가 적용된 컨테이너 카드. */
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "",
  sm:   "p-[20px_16px]",
  md:   "p-[28px_24px]",
  lg:   "p-[36px_32px]",
};

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div className={`bg-mefit-gray-50 border border-mefit-gray-200 rounded-lg shadow-card ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}
