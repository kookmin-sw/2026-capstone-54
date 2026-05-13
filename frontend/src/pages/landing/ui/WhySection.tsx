import { useRef } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  registerGsapPlugins,
  ScrollTrigger,
  useReducedMotion,
} from "@/shared/lib/animation";
import { WHY_REASONS } from "../model/content";
import { LandingSectionHeader } from "./LandingSectionHeader";

const [featured, ...rest] = WHY_REASONS;

interface ParallaxStyle extends CSSProperties {
  "--px"?: string;
  "--py"?: string;
  "--mx"?: string;
  "--my"?: string;
}

const FEATURED_STYLE: ParallaxStyle = {
  "--px": "0px",
  "--py": "0px",
  "--mx": "50%",
  "--my": "50%",
  transform: "translate3d(var(--px, 0px), var(--py, 0px), 0)",
};

const REST_STYLE: ParallaxStyle = {
  "--px": "0px",
  "--py": "0px",
  transform: "translate3d(var(--px, 0px), var(--py, 0px), 0)",
};

export function WhySection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      registerGsapPlugins();

      const cards = sectionRef.current?.querySelectorAll<HTMLElement>(
        "[data-why-card]",
      );
      if (!cards?.length) return;

      const triggers = ScrollTrigger.batch(Array.from(cards), {
        start: "top 88%",
        onEnter: (els) =>
          gsap.from(els, {
            y: 36,
            opacity: 0,
            duration: 0.75,
            stagger: { each: 0.07, from: "start", grid: "auto" },
            ease: "power3.out",
            overwrite: "auto",
          }),
      });

      return () => {
        triggers.forEach((t) => t.kill());
      };
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  const handleParallax = (
    e: ReactMouseEvent<HTMLDivElement>,
    intensity: number,
    trackOrigin: boolean,
  ) => {
    if (reduced) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const ratioX = (e.clientX - rect.left) / rect.width;
    const ratioY = (e.clientY - rect.top) / rect.height;
    const px = (ratioX - 0.5) * 2 * intensity;
    const py = (ratioY - 0.5) * 2 * intensity;
    el.style.setProperty("--px", `${px.toFixed(2)}px`);
    el.style.setProperty("--py", `${py.toFixed(2)}px`);
    if (trackOrigin) {
      el.style.setProperty("--mx", `${(ratioX * 100).toFixed(2)}%`);
      el.style.setProperty("--my", `${(ratioY * 100).toFixed(2)}%`);
    }
  };

  const resetParallax = (
    e: ReactMouseEvent<HTMLDivElement>,
    trackOrigin: boolean,
  ) => {
    const el = e.currentTarget;
    el.style.setProperty("--px", "0px");
    el.style.setProperty("--py", "0px");
    if (trackOrigin) {
      el.style.setProperty("--mx", "50%");
      el.style.setProperty("--my", "50%");
    }
  };

  const FeaturedIcon = featured.Icon;

  return (
    <section
      ref={sectionRef}
      id="why"
      className="bg-[#F9FAFB]"
    >
      <div className="max-w-content w-full md:max-w-[1080px]">
        <LandingSectionHeader
          eyebrow="왜 MEFIT"
          title="선택해야 할 이유."
          align="left"
        />

        <div
          data-why-card
          data-cursor-hover
          onMouseMove={(e) => handleParallax(e, 8, true)}
          onMouseLeave={(e) => resetParallax(e, true)}
          style={FEATURED_STYLE}
          className="group relative overflow-hidden bg-[#0A0A0A] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] flex items-center transition-[box-shadow,transform] duration-500 ease-out will-change-transform hover:shadow-[0_22px_60px_-18px_rgba(9,145,178,0.55)] p-[clamp(16px,2.6vh,48px)] gap-[clamp(12px,2.2vh,40px)] mb-[clamp(8px,1.8vh,28px)] md:rounded-2xl md:p-[clamp(28px,3.6vh,64px)] md:grid md:grid-cols-[1fr_2fr]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(9,145,178,0.45), rgba(6,182,212,0.18) 35%, transparent 65%)",
            }}
          />
          <div className="relative z-10 flex-1">
            <div className="rounded-md bg-white/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-[#0991B2]/30 w-[clamp(30px,4.4vh,68px)] h-[clamp(30px,4.4vh,68px)] mb-[clamp(8px,1.8vh,28px)] md:rounded-xl">
              <FeaturedIcon
                className="text-white w-[clamp(15px,2.2vh,32px)] h-[clamp(15px,2.2vh,32px)]"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
            <h3 className="font-plex-sans-kr font-extrabold text-white text-[clamp(14px,calc(1.6vh+0.7vw),32px)] mb-[clamp(4px,1vh,16px)] leading-tight">
              {featured.title}
            </h3>
            <p className="text-white/65 leading-[1.55] text-[clamp(11px,calc(1vh+0.4vw),20px)]">
              {featured.desc}
            </p>
          </div>
          <div className="hidden md:block" />
        </div>

        <div className="grid grid-cols-2 gap-[clamp(8px,1.8vh,24px)] md:grid-cols-3 md:gap-[clamp(12px,2vh,28px)]">
          {rest.map((r) => {
            const Icon = r.Icon;
            return (
              <div
                key={r.title}
                data-why-card
                data-cursor-hover
                onMouseMove={(e) => handleParallax(e, 4, false)}
                onMouseLeave={(e) => resetParallax(e, false)}
                style={REST_STYLE}
                className="group relative bg-white rounded-lg border border-[#E5E7EB] transition-[box-shadow,border-color,transform] duration-300 ease-out will-change-transform hover:border-[#0991B2]/40 hover:shadow-[0_14px_36px_-14px_rgba(9,145,178,0.30)] p-[clamp(12px,2vh,40px)] md:rounded-2xl"
              >
                <div className="rounded-md bg-white border border-[#E5E7EB] flex items-center justify-center transition-colors duration-300 group-hover:bg-[#E6F7FA] group-hover:border-[#0991B2]/50 w-[clamp(26px,3.8vh,56px)] h-[clamp(26px,3.8vh,56px)] mb-[clamp(6px,1.4vh,20px)] md:rounded-xl">
                  <Icon
                    className="text-[#0A0A0A] transition-colors duration-300 group-hover:text-[#0991B2] w-[clamp(13px,1.9vh,28px)] h-[clamp(13px,1.9vh,28px)]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-plex-sans-kr font-bold text-[#0A0A0A] text-[clamp(11px,calc(1.1vh+0.4vw),20px)] mb-[clamp(2px,0.6vh,10px)] leading-tight">
                  {r.title}
                </h3>
                <p className="text-[#6B7280] leading-[1.5] text-[clamp(10px,calc(0.85vh+0.3vw),16px)] line-clamp-3 md:line-clamp-none">
                  {r.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
