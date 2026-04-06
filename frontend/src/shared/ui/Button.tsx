import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  href?: string;
  fullWidth?: boolean;
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
  const baseStyles = "inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-all duration-200 text-center whitespace-nowrap";
  
  const variantStyles = {
    primary: "bg-[#0A0A0A] text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:enabled:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-[#E6F7FA] text-[#0991B2] border border-[#0991B2] hover:enabled:bg-[#cceef6] disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "bg-transparent text-[#6B7280] border border-[#E5E7EB] hover:enabled:text-[#0A0A0A] hover:enabled:bg-[#F3F4F6] disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "bg-transparent text-[#6B7280] hover:enabled:text-[#0A0A0A] hover:enabled:bg-[#F3F4F6] disabled:opacity-50 disabled:cursor-not-allowed",
    link: "bg-transparent text-[#0991B2] underline underline-offset-2 hover:enabled:text-[#0891B2] disabled:opacity-50 disabled:cursor-not-allowed",
  };

  const sizeStyles = {
    sm: "text-[13px] px-4 py-[10px]",
    md: "text-[14px] px-6 py-3.5",
    lg: "text-[15px] px-8 py-[15px]",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;

  if (href) {
    return (
      <a href={href} className={combinedClassName}>
        {children}
      </a>
    );
  }

  return (
    <button className={combinedClassName} disabled={disabled || loading} {...props}>
      {loading && (
        <span className="w-[18px] h-[18px] rounded-full border-2 border-white/35 border-t-white animate-[ri-spin_0.7s_linear_infinite]" />
      )}
      {children}
    </button>
  );
}
