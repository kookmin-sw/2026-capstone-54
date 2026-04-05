import { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'default' | 'dark' | 'bordered';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

export function Card({ 
  variant = 'default', 
  children, 
  className = '',
  ...props 
}: CardProps) {
  const variants = {
    default: 'bg-[#F9FAFB] border border-[#E5E7EB]',
    dark: 'bg-[var(--fg)] text-white',
    bordered: 'bg-white border border-[#E5E7EB]'
  };
  
  return (
    <div 
      className={`rounded-lg p-6 shadow-[var(--sc)] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
