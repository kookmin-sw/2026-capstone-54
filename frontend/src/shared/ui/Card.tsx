/** 흰색 배경에 테두리와 그림자가 적용된 컨테이너 카드. */
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "",
  sm: "p-[20px_16px]",
  md: "p-[28px_24px]",
  lg: "p-[36px_32px]",
};

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div
      className={`bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
