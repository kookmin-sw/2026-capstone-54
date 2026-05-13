import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  registerGsapPlugins,
  ScrollTrigger,
  useReducedMotion,
} from "@/shared/lib/animation";
import { Modal } from "@/shared/ui";
import { FEATURES } from "../model/content";
import { LandingSectionHeader } from "./LandingSectionHeader";

const [featured, ...rest] = FEATURES;

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const [demoOpen, setDemoOpen] = useState(false);

  useGSAP(
    () => {
      if (reduced) return;
      registerGsapPlugins();

      const cards = sectionRef.current?.querySelectorAll<HTMLElement>(
        "[data-feature-card]",
      );
      if (!cards?.length) return;

      const triggers = ScrollTrigger.batch(Array.from(cards), {
        start: "top 88%",
        onEnter: (els) =>
          gsap.from(els, {
            opacity: 0,
            duration: 0.7,
            stagger: 0.08,
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

  return (
    <section
      ref={sectionRef}
      id="features"
      className="bg-[#F9FAFB]"
    >
      <div className="max-w-content w-full md:max-w-[1080px]">
        <LandingSectionHeader
          eyebrow="핵심 기능"
          title="면접 준비의 모든 것."
          subtitle="이력서 분석부터 실전 화상 면접, AI 피드백까지 한 플랫폼에서."
          spacing="tight"
        />

        <div className="grid grid-cols-2 gap-[clamp(8px,1.4vh,16px)] md:grid-cols-4 md:grid-rows-2 md:gap-[clamp(10px,1.4vh,18px)] md:items-start">
          <button
            type="button"
            data-feature-card
            data-cursor-hover
            onClick={() => setDemoOpen(true)}
            aria-label={`${featured.title} 시연 영상 열기`}
            className="col-span-2 md:col-span-2 md:row-span-2 md:self-stretch group relative overflow-hidden text-left bg-[#0A0A0A] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-1 hover:shadow-[0_18px_50px_-12px_rgba(9,145,178,0.55),0_0_0_1px_rgba(9,145,178,0.25)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E7490] cursor-pointer flex flex-col p-[clamp(16px,2.8vh,40px)] md:rounded-2xl md:p-[clamp(20px,2.8vh,40px)]"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(circle at 30% 20%, rgba(9,145,178,0.35), transparent 55%)",
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-30"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>\")",
                backgroundSize: "160px 160px",
              }}
            />

            {featured.badge && (
              <span className="absolute top-2.5 right-2.5 z-10 font-bold text-[#0A0A0A] bg-white rounded text-[clamp(9px,calc(0.85vh+0.2vw),14px)] px-[clamp(6px,calc(0.9vh+0.3vw),14px)] py-[clamp(2px,0.5vh,6px)] md:top-5 md:right-5">
                {featured.badge}
              </span>
            )}
            <span
              aria-hidden="true"
              className="absolute z-10 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/20 transition-[transform,background] duration-300 group-hover:bg-[#0991B2]/35 group-hover:scale-110 w-[clamp(34px,5vh,64px)] h-[clamp(34px,5vh,64px)] bottom-[clamp(12px,2vh,28px)] right-[clamp(12px,2vh,28px)]"
            >
              <svg
                className="text-white w-[clamp(14px,2vh,24px)] h-[clamp(14px,2vh,24px)] ml-[2px]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <div className="relative z-10 rounded-md flex items-center justify-center bg-white/12 transition-colors duration-300 group-hover:bg-[#0991B2]/30 w-[clamp(26px,3.8vh,52px)] h-[clamp(26px,3.8vh,52px)] mb-[clamp(6px,1.4vh,20px)] md:rounded-xl">
              <featured.Icon
                className="text-white w-[clamp(13px,1.9vh,26px)] h-[clamp(13px,1.9vh,26px)]"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
            <h3 className="relative z-10 font-plex-sans-kr font-bold text-white text-[clamp(12px,calc(1.2vh+0.45vw),22px)] mb-[clamp(2px,0.6vh,12px)] leading-tight">
              {featured.title}
            </h3>
            <p className="relative z-10 text-white/72 leading-[1.55] text-[clamp(10px,calc(0.9vh+0.35vw),17px)]">
              {featured.desc}
            </p>
          </button>

          {rest.map((f) => (
            <div
              key={f.title}
              data-feature-card
              data-cursor-hover
              className="group relative bg-white rounded-lg border border-[#E5E7EB] transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform hover:-translate-y-1 hover:border-[#0991B2]/40 hover:shadow-[0_14px_36px_-12px_rgba(9,145,178,0.28)] p-[clamp(12px,2vh,40px)] md:rounded-2xl flex flex-col"
            >
              <div className="rounded-md flex items-center justify-center bg-white border border-[#E5E7EB] transition-colors duration-300 group-hover:border-[#0991B2]/50 group-hover:bg-[#E6F7FA] w-[clamp(26px,3.8vh,52px)] h-[clamp(26px,3.8vh,52px)] mb-[clamp(6px,1.4vh,20px)] md:rounded-xl">
                <f.Icon
                  className="text-[#0A0A0A] transition-colors duration-300 group-hover:text-[#0991B2] w-[clamp(13px,1.9vh,26px)] h-[clamp(13px,1.9vh,26px)]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-plex-sans-kr font-bold text-[#0A0A0A] text-[clamp(12px,calc(1.2vh+0.45vw),22px)] mb-[clamp(2px,0.6vh,12px)] leading-tight">
                {f.title}
              </h3>
              <p className="text-[#6B7280] leading-[1.5] text-[clamp(10px,calc(0.9vh+0.35vw),17px)]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        title={`${featured.title} 시연`}
        description={featured.desc}
        size="lg"
        heightMode="fixed"
      >
        {featured.demoVideoUrl ? (
          <video
            src={featured.demoVideoUrl}
            controls
            playsInline
            autoPlay
            className="w-full aspect-video object-contain bg-black rounded-lg"
          />
        ) : (
          <div className="w-full aspect-video bg-[#0A0A0A] rounded-lg flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(9,145,178,0.4), transparent 60%), radial-gradient(circle at 70% 70%, rgba(6,182,212,0.3), transparent 65%)",
              }}
            />
            <span className="relative z-10 font-bold text-[#0E7490] bg-[#CFFAFE] rounded text-xs px-3 py-1 mb-4">
              Coming Soon
            </span>
            <h3 className="relative z-10 font-plex-sans-kr font-extrabold text-white text-2xl mb-2 md:text-3xl">
              실제 시연 영상은 곧 공개됩니다
            </h3>
            <p className="relative z-10 text-white/70 text-sm leading-relaxed max-w-md md:text-base">
              화상 면접 진행 흐름, AI 면접관과의 실시간 대화, 분석 리포트까지 한 번에 확인할 수 있는 시연 영상을 준비 중입니다.
            </p>
          </div>
        )}
      </Modal>
    </section>
  );
}
