import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  className = "",
  fullWidth = false,
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-md transition-all duration-200 text-center";
  
  const variantStyles = {
    primary: "bg-[#0A0A0A] text-white hover:opacity-85",
    secondary: "bg-white text-[#0A0A0A] hover:bg-[#F9FAFB] border-[1.5px] border-[#0A0A0A]",
    outline: "bg-transparent text-[#D1D5DB] border-[1.5px] border-[#374151] hover:border-[#6B7280] hover:text-white",
  };

  const sizeStyles = {
    sm: "text-[13px] px-4 py-2",
    md: "text-[14px] px-5 py-2.5",  // navbar: 14px, 20px 10px
    lg: "text-[15px] px-8 py-[15px]",  // hero: 15px, 32px 15px (원본)
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
    <button onClick={onClick} className={combinedClassName}>
      {children}
    </button>
  );
}
