import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-[13px] font-bold text-[var(--fg)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 text-[14px] bg-white border border-[#E5E7EB] rounded-lg outline-none transition-colors focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(9,145,178,0.1)] disabled:bg-[#F3F4F6] disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error && (
          <span className="text-[12px] text-[#DC2626]">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
