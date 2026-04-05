import { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant = 'primary' | 'success' | 'neutral' | 'warning';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ 
  variant = 'primary', 
  children, 
  className = '',
  ...props 
}: BadgeProps) {
  const variants = {
    primary: 'bg-[#E6F7FA] text-[var(--accent)] border-[rgba(9,145,178,0.15)]',
    success: 'bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]',
    neutral: 'bg-[#F9FAFB] text-[var(--muted)] border-[#E5E7EB]',
    warning: 'bg-[#FFF7ED] text-[#D97706] border-[#FED7AA]'
  };
  
  return (
    <span 
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
