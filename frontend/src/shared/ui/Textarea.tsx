import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  showCharCount,
  fullWidth = true,
  maxLength,
  value,
  className = "",
  ...props
}: TextareaProps) {
  const charCount = typeof value === "string" ? value.length : 0;

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <div className="flex items-center justify-between text-[13px] font-bold text-[#0A0A0A] mb-2">
          <span>{label}</span>
          {helperText && (
            <span className="text-[11px] text-[#6B7280] font-normal">{helperText}</span>
          )}
        </div>
      )}
      <div className="relative">
        <textarea
          className={`w-full bg-white border border-[#E5E7EB] rounded-lg py-[13px] px-4 text-sm font-medium text-[#0A0A0A] outline-none transition-[border-color] resize-y focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,0.1)] placeholder:text-[#D1D5DB] ${
            error ? "border-[#DC2626]" : ""
          } ${className}`}
          maxLength={maxLength}
          value={value}
          {...props}
        />
        {showCharCount && maxLength && (
          <span className="absolute bottom-3 right-[14px] text-[11px] font-semibold text-[#9CA3AF] bg-white/90 rounded-full px-[9px] py-0.5 pointer-events-none">
            {charCount.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        )}
      </div>
      {error && (
        <div className="text-[12px] text-[#DC2626] font-semibold mt-1.5">✗ {error}</div>
      )}
    </div>
  );
}
