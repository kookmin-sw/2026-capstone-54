import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  registerGsapPlugins,
  useReducedMotion,
} from "@/shared/lib/animation";
import { FOOTER_LEGAL, FOOTER_NAV } from "../model/content";

export function FooterSection() {
  const footerRef = useRef<HTMLElement | null>(null);
  const lineRef = useRef<HTMLSpanElement | null>(null);
  const megaRef = useRef<HTMLDivElement | null>(null);

  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      registerGsapPlugins();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 90%",
          once: true,
        },
        defaults: { ease: "power3.out" },
      });

      if (lineRef.current) {
        tl.from(
          lineRef.current,
          {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.9,
            ease: "power2.inOut",
          },
          0,
        );
      }

      if (megaRef.current) {
        tl.from(
          megaRef.current,
          { yPercent: 30, opacity: 0, duration: 1.0 },
          0.15,
        );
      }
    },
    { scope: footerRef, dependencies: [reduced] },
  );

  return (
    <footer
      ref={footerRef}
      className="bg-[#0A0A0A] relative overflow-hidden px-5 pt-12 pb-7 md:px-10 md:pt-16 md:pb-9"
    >
      <div
        ref={megaRef}
        aria-hidden="true"
        className="absolute pointer-events-none select-none font-plex-sans-kr font-black tracking-[-2px] leading-[0.85] left-[-2vw] right-[-2vw] bottom-[-2vh] text-[clamp(80px,calc(8vh+12vw),260px)] whitespace-nowrap"
        style={{
          color: "transparent",
          WebkitTextStroke: "1px rgba(9,145,178,0.32)",
          WebkitTextFillColor: "transparent",
        }}
      >
        meFit · 未fit
      </div>

      <div className="relative z-10 max-w-content w-full mx-auto md:max-w-[1080px]">
        <div className="flex flex-col gap-5 mb-8 md:flex-row md:items-end md:justify-between md:gap-8 md:mb-10">
          <div className="flex-1 min-w-0">
            <img
              src="/logo-korean.png"
              alt="미핏"
              className="h-[36px] w-auto mb-3 md:h-[44px] md:mb-4"
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <p className="text-[12px] text-white/60 leading-[1.65] max-w-[420px] md:text-[13px]">
              未fit → meFit. 아직 면접 핏이 맞지 않는 나를, AI와 함께 완성해가는 플랫폼.
            </p>
          </div>

          <nav
            aria-label="푸터 네비게이션"
            className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end"
          >
            {FOOTER_NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                data-cursor-hover
                className="text-[12px] font-medium text-white/70 no-underline transition-[color] duration-200 hover:text-white md:text-[13px]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <span
          ref={lineRef}
          aria-hidden="true"
          className="block w-full h-[1px] bg-gradient-to-r from-transparent via-[#0991B2]/60 to-transparent rounded-full mb-5 md:mb-6"
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
          <span className="text-[11px] text-white/55 md:text-[12px]">
            © 2026 meFit(미핏). All rights reserved.
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {FOOTER_LEGAL.map((item) => (
              <a
                key={item.label}
                href={item.href}
                data-cursor-hover
                className="text-[11px] text-white/55 no-underline transition-[color] duration-200 hover:text-white/85 md:text-[12px]"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
