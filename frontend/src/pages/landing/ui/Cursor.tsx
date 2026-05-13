import { useEffect, useRef } from "react";
import { gsap, useReducedMotion } from "@/shared/lib/animation";

const HOVERABLE_SELECTOR =
  "a, button, [role='button'], input, textarea, label, [data-cursor-hover]";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "none";

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 });

    let initialized = false;

    const onMove = (event: MouseEvent) => {
      if (!initialized) {
        gsap.set([dot, ring], { x: event.clientX, y: event.clientY, opacity: 1 });
        initialized = true;
        return;
      }
      gsap.to(dot, {
        x: event.clientX,
        y: event.clientY,
        duration: 0.1,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.to(ring, {
        x: event.clientX,
        y: event.clientY,
        duration: 0.45,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const onDocumentLeave = () => {
      gsap.to([dot, ring], { opacity: 0, duration: 0.25 });
    };
    const onDocumentEnter = () => {
      if (initialized) gsap.to([dot, ring], { opacity: 1, duration: 0.25 });
    };

    const onEnterHoverable = () => {
      gsap.to(ring, {
        scale: 1.8,
        opacity: 0.45,
        backgroundColor: "rgba(9,145,178,0.08)",
        duration: 0.3,
        ease: "power3.out",
      });
      gsap.to(dot, { scale: 0, duration: 0.2 });
    };
    const onLeaveHoverable = () => {
      gsap.to(ring, {
        scale: 1,
        opacity: 1,
        backgroundColor: "rgba(9,145,178,0)",
        duration: 0.3,
        ease: "power3.out",
      });
      gsap.to(dot, { scale: 1, duration: 0.2 });
    };

    const onMouseDown = () => {
      gsap.to(ring, { scale: 0.8, duration: 0.15 });
    };
    const onMouseUp = () => {
      gsap.to(ring, { scale: 1, duration: 0.2 });
    };

    // event delegation: mouseover/mouseout(bubbling) + relatedTarget으로 hoverable 경계만 감지
    const onPointerOver = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(HOVERABLE_SELECTOR)
        : null;
      if (!target) return;
      const related = event.relatedTarget instanceof Element
        ? event.relatedTarget.closest<HTMLElement>(HOVERABLE_SELECTOR)
        : null;
      if (related === target) return;
      onEnterHoverable();
    };
    const onPointerOut = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(HOVERABLE_SELECTOR)
        : null;
      if (!target) return;
      const related = event.relatedTarget instanceof Element
        ? event.relatedTarget.closest<HTMLElement>(HOVERABLE_SELECTOR)
        : null;
      if (related === target) return;
      onLeaveHoverable();
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onDocumentLeave);
    document.addEventListener("mouseenter", onDocumentEnter);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseover", onPointerOver);
    document.addEventListener("mouseout", onPointerOut);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onDocumentLeave);
      document.removeEventListener("mouseenter", onDocumentEnter);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseover", onPointerOver);
      document.removeEventListener("mouseout", onPointerOut);
      document.body.style.cursor = previousCursor;
      gsap.killTweensOf([dot, ring]);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#0991B2] pointer-events-none z-[9999] opacity-0"
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 w-[6px] h-[6px] rounded-full bg-[#0991B2] pointer-events-none z-[9999] opacity-0"
      />
    </>
  );
}
