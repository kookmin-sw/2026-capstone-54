/** 로딩 상태를 나타내는 회전 스피너. sm, md, lg 크기를 지원한다. */
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "w-4 h-4 border-2",
  md: "w-[18px] h-[18px] border-2",
  lg: "w-11 h-11 border-4",
};

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      className={`rounded-full border-mefit-primary-ring border-t-mefit-primary animate-spin-slow ${sizeStyles[size]} ${className}`}
    />
  );
}
