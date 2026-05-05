import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, registerGsapPlugins, ScrollTrigger } from "./gsap-config";
import { useReducedMotion } from "./useReducedMotion";

interface UseLenisScrollOptions {
  enabled?: boolean;
  duration?: number;
  pageSnapSelector?: string;
  pageSnapDuration?: number;
  pageSnapOffset?: number;
}

const LENIS_EASING = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

const PAGE_SNAP_COOLDOWN_MS = 60;
const PAGE_SNAP_MIN_DELTA = 8;

export function useLenisScroll({
  enabled = true,
  duration = 1.1,
  pageSnapSelector,
  pageSnapDuration = 1.4,
  pageSnapOffset = 0,
}: UseLenisScrollOptions = {}): void {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!enabled || reduced) return;
    registerGsapPlugins();

    const lenis = new Lenis({
      duration,
      easing: LENIS_EASING,
      smoothWheel: !pageSnapSelector,
    });

    const updateScrollTrigger = () => ScrollTrigger.update();
    lenis.on("scroll", updateScrollTrigger);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    let removeWheelHandler: (() => void) | undefined;

    if (pageSnapSelector) {
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>(pageSnapSelector),
      );

      if (sections.length > 0) {
        let isAnimating = false;
        let lastWheelTime = 0;

        const findCurrentIndex = (): number => {
          const probe = lenis.scroll + window.innerHeight / 2;
          let idx = 0;
          for (let i = 0; i < sections.length; i++) {
            if (sections[i].offsetTop <= probe) idx = i;
            else break;
          }
          return idx;
        };

        const onWheel = (e: WheelEvent) => {
          if (Math.abs(e.deltaY) < PAGE_SNAP_MIN_DELTA) {
            e.preventDefault();
            return;
          }
          if (isAnimating) {
            e.preventDefault();
            return;
          }
          const now = performance.now();
          if (now - lastWheelTime < PAGE_SNAP_COOLDOWN_MS) {
            e.preventDefault();
            return;
          }

          const dir = e.deltaY > 0 ? 1 : -1;
          const current = findCurrentIndex();
          const target = current + dir;
          if (target < 0 || target >= sections.length) {
            return;
          }

          e.preventDefault();
          e.stopPropagation();
          lastWheelTime = now;
          isAnimating = true;
          lenis.scrollTo(sections[target], {
            duration: pageSnapDuration,
            easing: LENIS_EASING,
            lock: true,
            offset: pageSnapOffset,
            onComplete: () => {
              window.setTimeout(() => {
                isAnimating = false;
              }, PAGE_SNAP_COOLDOWN_MS);
            },
          });
        };

        window.addEventListener("wheel", onWheel, {
          passive: false,
          capture: true,
        });
        removeWheelHandler = () =>
          window.removeEventListener("wheel", onWheel, { capture: true });
      }
    }

    return () => {
      removeWheelHandler?.();
      gsap.ticker.remove(tick);
      lenis.off("scroll", updateScrollTrigger);
      lenis.destroy();
    };
  }, [
    enabled,
    reduced,
    duration,
    pageSnapSelector,
    pageSnapDuration,
    pageSnapOffset,
  ]);
}
