import type { InputHTMLAttributes } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: string;
  required?: boolean;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  required,
  fullWidth = true,
  ...props
}: InputProps) {
  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <div className="flex items-center justify-between text-[13px] font-bold text-[#0A0A0A] mb-2">
          <span>
            {label} {required && <span className="text-[#0991B2] ml-0.5">*</span>}
          </span>
          {helperText && (
            <span className="text-[11px] text-[#6B7280] font-normal">{helperText}</span>
          )}
        </div>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-base pointer-events-none">
            {icon}
          </span>
        )}
        <input
          className={`w-full bg-white border border-[#E5E7EB] rounded-lg py-[13px] px-4 ${
            icon ? "pl-11" : ""
          } text-sm font-medium text-[#0A0A0A] outline-none transition-[border-color] appearance-none focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,0.1)] placeholder:text-[#D1D5DB] disabled:bg-[#F3F4F6] disabled:cursor-not-allowed ${
            error ? "border-[#DC2626]" : ""
          }`}
          {...props}
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[12px] font-semibold mt-1.5 text-[#DC2626]">
          ✗ {error}
        </div>
      )}
    </div>
  );
}
