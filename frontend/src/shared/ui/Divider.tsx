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
  return <div className={`h-px bg-[#E5E7EB] ${spacingStyles[spacing]} ${className}`} />;
}
