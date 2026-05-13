/** label과 error 메시지를 포함하는 여러 줄 텍스트 입력 필드. */
import type { TextareaHTMLAttributes } from "react";

interface TextareaLabelProps {
  label?: string;
  error?: string;
  helperText?: string;
}

interface TextareaDisplayProps {
  showCharCount?: boolean;
  fullWidth?: boolean;
}

interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">,
          TextareaLabelProps,
          TextareaDisplayProps {
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
        <div className="flex items-center justify-between text-sm font-bold text-mefit-black mb-2">
          <span>{label}</span>
          {helperText && (
            <span className="text-2xs text-mefit-gray-500 font-normal">{helperText}</span>
          )}
        </div>
      )}
      <div className="relative">
        <textarea
          className={[
            "w-full bg-white border border-mefit-gray-200 rounded-lg py-[13px] px-4",
            "text-base font-medium text-mefit-black outline-none transition-[border-color] resize-y",
            "focus:border-mefit-primary focus:shadow-ring-primary",
            "placeholder:text-mefit-gray-300",
            error ? "border-mefit-danger" : "",
            className,
          ].join(" ")}
          maxLength={maxLength}
          value={value}
          {...props}
        />
        {showCharCount && maxLength && (
          <span className="absolute bottom-3 right-[14px] text-2xs font-semibold text-mefit-gray-400 bg-white/90 rounded-full px-[9px] py-0.5 pointer-events-none">
            {charCount.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        )}
      </div>
      {error && (
        <div className="text-xs text-mefit-danger font-semibold mt-1.5">✗ {error}</div>
      )}
    </div>
  );
}
