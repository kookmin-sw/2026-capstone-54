/** 공통 버튼. variant로 스타일, size로 크기를 제어한다. */
import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonStyleProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">, ButtonStyleProps {
  children: ReactNode;
  href?: string;
  loading?: boolean;
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-all duration-200 text-center whitespace-nowrap";

  const variantStyles = {
    primary:   "bg-mefit-black text-white shadow-sm hover:enabled:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-mefit-primary-light text-mefit-primary border border-mefit-primary hover:enabled:bg-[#cceef6] disabled:opacity-50 disabled:cursor-not-allowed",
    outline:   "bg-transparent text-mefit-gray-500 border border-mefit-gray-200 hover:enabled:text-mefit-black hover:enabled:bg-mefit-gray-100 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost:     "bg-transparent text-mefit-gray-500 hover:enabled:text-mefit-black hover:enabled:bg-mefit-gray-100 disabled:opacity-50 disabled:cursor-not-allowed",
    link:      "bg-transparent text-mefit-primary underline underline-offset-2 hover:enabled:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  const sizeStyles = {
    sm: "text-sm px-4 py-[10px]",
    md: "text-base px-6 py-3.5",
    lg: "text-md px-8 py-[15px]",
  };

  const combined = `${base} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`;

  if (href) {
    return <a href={href} className={combined}>{children}</a>;
  }

  return (
    <button className={combined} disabled={disabled || loading} {...props}>
      {loading && (
        <span className="w-[18px] h-[18px] rounded-full border-2 border-white/35 border-t-white animate-spin-slow" />
      )}
      {children}
    </button>
  );
}
