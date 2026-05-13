import { useScrollProgress } from "@/shared/lib/animation";

export function ScrollProgress() {
  const progress = useScrollProgress();
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[3px] z-[300] pointer-events-none"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-[#0991B2] to-[#06B6D4] will-change-transform"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
