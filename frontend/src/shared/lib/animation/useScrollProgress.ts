import { useEffect, useState } from "react";

export function useScrollProgress(): number {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const compute = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) {
        setProgress(0);
        return;
      }
      const value = window.scrollY / max;
      setProgress(value < 0 ? 0 : value > 1 ? 1 : value);
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  return progress;
}
