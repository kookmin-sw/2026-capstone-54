import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  registerGsapPlugins,
  useReducedMotion,
} from "@/shared/lib/animation";
import { HOW_TO_STEPS, HOW_TO_TAGS } from "../model/content";
import { LandingSectionHeader } from "./LandingSectionHeader";

export function HowToSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      registerGsapPlugins();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          once: true,
        },
        defaults: { ease: "power3.out" },
      });

      tl.from(
        "[data-howto-line]",
        {
          scaleY: 0,
          transformOrigin: "top",
          duration: 1.0,
          ease: "power2.inOut",
        },
        0,
      );

      tl.from(
        "[data-step-card]",
        {
          x: -32,
          opacity: 0,
          duration: 0.6,
          stagger: 0.16,
        },
        0.2,
      );

      tl.from(
        "[data-howto-dark]",
        {
          y: 28,
          opacity: 0,
          duration: 0.7,
        },
        0.4,
      );
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={sectionRef}
      id="how-to"
      className="bg-white"
    >
      <div className="max-w-content w-full md:max-w-[1080px]">
        <LandingSectionHeader
          eyebrow="이용 방법"
          title={
            <>
              3단계로 끝나는<br />AI 면접.
            </>
          }
          subtitle="이력서 업로드부터 결과 리포트까지, 15분이면 끝납니다."
          align="left"
          spacing="tight"
        />

        <div className="flex flex-col gap-[clamp(8px,1.6vh,20px)] md:grid md:grid-cols-[5fr_4fr] md:gap-[clamp(20px,3vh,32px)] md:items-stretch">
          <div className="relative flex flex-col gap-[clamp(6px,1.2vh,16px)] px-[clamp(8px,1.4vh,20px)] md:px-0">
            <span
              data-howto-line
              aria-hidden="true"
              className="absolute left-[calc(clamp(8px,1.4vh,20px)+clamp(20px,2.8vh,38px))] top-[clamp(14px,2vh,24px)] bottom-[clamp(14px,2vh,24px)] w-[2px] bg-gradient-to-b from-[#0991B2] via-[#06B6D4] to-[#0991B2]/30 rounded-full md:left-[clamp(20px,2.8vh,38px)]"
            />
            {HOW_TO_STEPS.map((step) => (
              <div
                key={step.num}
                data-step-card
                data-cursor-hover
                className="relative flex items-center bg-[#F9FAFB] rounded-md border border-[#E5E7EB] transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#0991B2]/40 gap-[clamp(8px,1.4vh,18px)] px-[clamp(14px,2vh,24px)] py-[clamp(10px,1.6vh,18px)] md:rounded-lg"
              >
                <div className="relative z-10 rounded-md shrink-0 bg-[#0A0A0A] flex items-center justify-center font-extrabold text-white w-[clamp(24px,3.4vh,40px)] h-[clamp(24px,3.4vh,40px)] text-[clamp(10px,1.3vh,13px)] shadow-[0_0_0_3px_rgba(255,255,255,1)] md:rounded-lg md:shadow-[0_0_0_4px_rgba(255,255,255,1)]">
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-plex-sans-kr font-bold text-[#0A0A0A] truncate text-[clamp(12px,calc(1vh+0.35vw),15px)] mb-[clamp(0px,0.2vh,3px)]">
                    {step.title}
                  </div>
                  <div className="text-[#6B7280] truncate text-[clamp(10px,calc(0.75vh+0.25vw),13px)]">
                    {step.desc}
                  </div>
                </div>
                <div className="font-semibold text-[#0991B2] bg-[#E6F7FA] rounded shrink-0 text-[clamp(9px,calc(0.7vh+0.2vw),12px)] px-[clamp(6px,1vh,12px)] py-[clamp(2px,0.4vh,4px)]">
                  {step.label}
                </div>
              </div>
            ))}
          </div>

          <div
            data-howto-dark
            data-cursor-hover
            className="relative bg-[#0A0A0A] rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] flex flex-col justify-center animate-breathe-ring p-[clamp(12px,2vh,36px)] md:rounded-lg"
          >
            <div className="text-[clamp(18px,calc(1.6vh+0.6vw),32px)] mb-[clamp(4px,0.8vh,16px)]">
              🎙️
            </div>
            <h3 className="font-plex-sans-kr font-extrabold text-white leading-[1.2] text-[clamp(13px,calc(1.4vh+0.6vw),24px)] mb-[clamp(4px,0.8vh,14px)]">
              연습 모드부터 실전 모드까지.
            </h3>
            <p className="text-white/65 leading-[1.5] text-[clamp(10px,calc(0.85vh+0.3vw),14px)] mb-[clamp(8px,1.6vh,24px)] line-clamp-3 md:line-clamp-none">
              준비 완료 버튼으로 시작하는 연습 모드, 5~30초 랜덤 대기 후 자동 시작되는 실전 모드.
            </p>
            <div className="flex flex-wrap gap-[clamp(4px,0.8vh,8px)]">
              {HOW_TO_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="font-semibold text-white/80 bg-white/10 rounded border border-white/12 text-[clamp(9px,calc(0.7vh+0.2vw),12px)] px-[clamp(6px,1vh,14px)] py-[clamp(2px,0.4vh,6px)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
