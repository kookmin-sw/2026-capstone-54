/** 인라인 상태 라벨. 작은 크기로 텍스트 옆에 붙여 상태를 표시한다. */
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "primary";
  size?: "sm" | "md";
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles = {
  default: "bg-[#F3F4F6] text-[#9CA3AF]",
  success: "bg-[#D1FAE5] text-[#047857]",
  warning: "bg-[rgba(245,158,11,0.08)] text-[#D97706] border-[rgba(245,158,11,0.2)]",
  error: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  info: "bg-[#E6F7FA] text-[#0991B2]",
  primary: "bg-[#E6F7FA] text-[#0991B2] border-[#0991B2]",
};

const sizeStyles = {
  sm: "text-[11px] px-2.5 py-[3px]",
  md: "text-[11px] px-3 py-[5px]",
};

export function Badge({ children, variant = "default", size = "md", className = "", style }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
