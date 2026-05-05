import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  registerGsapPlugins,
  SplitText,
  useReducedMotion,
} from "@/shared/lib/animation";
import { FOOTER_LINKS } from "../model/content";

export function FooterSection() {
  const footerRef = useRef<HTMLElement | null>(null);
  const megaRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLSpanElement | null>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      registerGsapPlugins();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 80%",
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
            duration: 1.0,
            ease: "power2.inOut",
          },
          0,
        );
      }

      if (megaRef.current) {
        const split = SplitText.create(megaRef.current, {
          type: "chars,words",
          charsClass: "footer-mega-char",
        });
        tl.from(
          split.chars,
          {
            yPercent: 110,
            opacity: 0,
            duration: 0.9,
            stagger: 0.04,
            ease: "power3.out",
          },
          0.2,
        );
      }
    },
    { scope: footerRef, dependencies: [reduced] },
  );

  return (
    <footer
      ref={footerRef}
      className="bg-[#0A0A0A] relative overflow-hidden pt-12 pb-6 px-5 flex flex-col items-center md:pt-16 md:pb-8 md:px-10"
    >
      <div className="max-w-content w-full md:max-w-[1080px] relative">
        <div
          ref={megaRef}
          aria-hidden="true"
          className="font-plex-sans-kr font-black tracking-[-3px] leading-[0.9] text-center mb-10 select-none overflow-hidden text-[clamp(56px,calc(8vh+8vw),200px)] md:mb-14"
          style={{
            background:
              "linear-gradient(180deg, rgba(9,145,178,0.85) 0%, rgba(6,182,212,0.5) 60%, rgba(255,255,255,0.05) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        >
          未fit → meFit
        </div>

        <span
          ref={lineRef}
          aria-hidden="true"
          className="block w-full mb-9 md:mb-12 h-[2px] bg-gradient-to-r from-transparent via-[#0991B2] to-transparent rounded-full"
        />

        <div className="flex flex-col gap-8 mb-9 md:grid md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-10 md:mb-12">
          <div>
            <div className="mb-[10px] md:mb-3">
              <img
                src="/logo-korean.png"
                alt="미핏"
                className="h-[46px] w-auto md:h-[56px]"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
            <p className="text-[12px] text-white/40 leading-[1.7] mb-4 md:text-[13px] md:mb-5">
              未fit → meFit. 아직 면접 핏이 맞지 않는 나를,<br />AI와 함께 완성해가는 플랫폼.
            </p>
            <div className="flex gap-2">
              {["Twitter", "LinkedIn"].map((sns) => (
                <a
                  key={sns}
                  href="#"
                  data-cursor-hover
                  className="text-[11px] font-semibold text-white/50 no-underline px-3 py-[5px] rounded border border-white/12 transition-[border-color,color] duration-200 hover:text-white hover:border-white/30 md:text-[12px] md:px-3.5 md:py-1.5"
                >
                  {sns}
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "서비스", links: FOOTER_LINKS.service },
            { title: "회사", links: FOOTER_LINKS.company },
            { title: "법적 고지", links: FOOTER_LINKS.legal },
          ].map(({ title, links }) => (
            <div key={title}>
              <div className="text-[12px] font-bold text-white/60 mb-3 md:text-[13px] md:mb-4">
                {title}
              </div>
              <ul className="list-none p-0 m-0 flex flex-col gap-2 md:gap-[10px]">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      data-cursor-hover
                      className="text-[12px] text-white/35 no-underline transition-[color] duration-200 hover:text-white/70 md:text-[13px]"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-5 border-t border-white/8 flex flex-col gap-[10px] md:pt-6 md:flex-row md:justify-between md:items-center">
          <span className="text-[11px] text-white/22 md:text-[12px]">
            © 2026 meFit(미핏). All rights reserved.
          </span>
          <div className="flex gap-[14px] md:gap-4">
            {["개인정보", "이용약관", "쿠키"].map((item) => (
              <a
                key={item}
                href="#"
                data-cursor-hover
                className="text-[11px] text-white/22 no-underline transition-[color] duration-200 hover:text-white/50 md:text-[12px]"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
