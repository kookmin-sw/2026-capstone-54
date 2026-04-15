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
  default: "bg-mefit-gray-100 text-mefit-gray-400",
  success: "bg-mefit-success-light text-mefit-success",
  warning: "bg-mefit-warning-light text-mefit-warning border-mefit-warning-border",
  error:   "bg-mefit-danger-light text-mefit-danger border-mefit-danger-border",
  info:    "bg-mefit-primary-light text-mefit-primary",
  primary: "bg-mefit-primary-light text-mefit-primary border-mefit-primary",
};

const sizeStyles = {
  sm: "text-2xs px-2.5 py-[3px]",
  md: "text-2xs px-3 py-[5px]",
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
