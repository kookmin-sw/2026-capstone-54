/** 상태별 색상이 적용되는 알림 배너. info, success, warning, error 변형을 지원한다. */
import type { ReactNode } from "react";

interface AlertProps {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  className?: string;
}

const variantStyles = {
  info:    "bg-mefit-success-light border-mefit-success-border text-mefit-black",
  success: "bg-mefit-success-light border-mefit-success-border text-mefit-black",
  warning: "bg-mefit-warning-light border-mefit-warning-border text-mefit-warning",
  error:   "bg-mefit-danger-light border-mefit-danger-border text-mefit-danger",
};

export function Alert({ children, variant = "info", className = "" }: AlertProps) {
  return (
    <div
      className={`text-sm font-semibold py-[10px] px-3.5 rounded-lg border ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
}
