/** 상태별 색상이 적용되는 알림 배너. info, success, warning, error 변형을 지원한다. */
import type { ReactNode } from "react";

interface AlertProps {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  className?: string;
}

const variantStyles = {
  info: "bg-[#ECFDF5] border-[#A7F3D0] text-[#0A0A0A]",
  success: "bg-[#ECFDF5] border-[#A7F3D0] text-[#0A0A0A]",
  warning: "bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.2)] text-[#D97706]",
  error: "bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]",
};

export function Alert({ children, variant = "info", className = "" }: AlertProps) {
  return (
    <div
      className={`text-[13px] font-semibold py-[10px] px-3.5 rounded-lg border ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
}
