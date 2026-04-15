/** label과 error 메시지를 포함하는 텍스트 입력 필드. */
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
        <div className="flex items-center justify-between text-sm font-bold text-mefit-black mb-2">
          <span>
            {label} {required && <span className="text-mefit-primary ml-0.5">*</span>}
          </span>
          {helperText && (
            <span className="text-2xs text-mefit-gray-500 font-normal">{helperText}</span>
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
          className={[
            "w-full bg-white border border-mefit-gray-200 rounded-lg py-[13px] px-4",
            icon ? "pl-11" : "",
            "text-lg font-medium text-mefit-black outline-none transition-[border-color] appearance-none",
            "focus:border-mefit-primary focus:shadow-ring-primary",
            "placeholder:text-mefit-gray-300",
            "disabled:bg-mefit-gray-100 disabled:cursor-not-allowed",
            error ? "border-mefit-danger" : "",
          ].join(" ")}
          {...props}
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs font-semibold mt-1.5 text-mefit-danger">
          ✗ {error}
        </div>
      )}
    </div>
  );
}
