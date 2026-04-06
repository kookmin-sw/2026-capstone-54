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
      className={`rounded-full border-[rgba(9,145,178,0.15)] border-t-[#0991B2] animate-[ri-spin_0.7s_linear_infinite] ${sizeStyles[size]} ${className}`}
    />
  );
}
