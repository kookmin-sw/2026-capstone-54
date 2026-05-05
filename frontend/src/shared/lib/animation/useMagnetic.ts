import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { gsap } from "./gsap-config";
import { useReducedMotion } from "./useReducedMotion";

interface UseMagneticOptions {
  strength?: number;
  scale?: number;
  duration?: number;
}

export function useMagnetic<T extends HTMLElement>(
  options: UseMagneticOptions = {},
): RefObject<T | null> {
  const { strength = 0.35, scale = 1.04, duration = 0.4 } = options;
  const ref = useRef<T | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const handleMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (event.clientX - cx) * strength;
      const dy = (event.clientY - cy) * strength;
      gsap.to(element, { x: dx, y: dy, scale, duration, ease: "power3.out" });
    };

    const handleLeave = () => {
      gsap.to(element, { x: 0, y: 0, scale: 1, duration: duration + 0.1, ease: "power3.out" });
    };

    element.addEventListener("mousemove", handleMove);
    element.addEventListener("mouseleave", handleLeave);
    return () => {
      element.removeEventListener("mousemove", handleMove);
      element.removeEventListener("mouseleave", handleLeave);
      gsap.killTweensOf(element);
    };
  }, [strength, scale, duration, reduced]);

  return ref;
}
