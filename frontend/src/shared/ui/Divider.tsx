/** 수평 구분선. spacing으로 상하 여백을 조절한다. */
interface DividerProps {
  className?: string;
  spacing?: "sm" | "md" | "lg";
}

const spacingStyles = {
  sm: "my-4",
  md: "my-7",
  lg: "my-10",
};

export function Divider({ className = "", spacing = "md" }: DividerProps) {
  return <div className={`h-px bg-mefit-gray-200 ${spacingStyles[spacing]} ${className}`} />;
}
