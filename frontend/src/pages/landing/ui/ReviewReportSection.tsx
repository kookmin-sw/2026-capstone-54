import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  registerGsapPlugins,
  ScrollTrigger,
  useReducedMotion,
} from "@/shared/lib/animation";
import { LottiePlayer } from "@/shared/ui";
import { REVIEW_REPORTS } from "../model/content";
import { LandingSectionHeader } from "./LandingSectionHeader";

export function ReviewReportSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      registerGsapPlugins();

      const cards = sectionRef.current?.querySelectorAll<HTMLElement>(
        "[data-review-card]",
      );
      if (!cards?.length) return;

      const triggers = ScrollTrigger.batch(Array.from(cards), {
        start: "top 88%",
        onEnter: (els) => {
          gsap.from(els, {
            y: 32,
            opacity: 0,
            duration: 0.7,
            stagger: 0.14,
            ease: "power3.out",
            overwrite: "auto",
          });

          els.forEach((card) => {
            const bar = card.querySelector<HTMLElement>("[data-score-bar]");
            const text = card.querySelector<HTMLElement>("[data-score-text]");
            if (!bar) return;
            const score = Number(bar.dataset.score);
            if (!Number.isFinite(score)) return;

            gsap.fromTo(
              bar,
              { width: "0%" },
              {
                width: `${score}%`,
                duration: 1.4,
                delay: 0.45,
                ease: "power2.out",
              },
            );

            if (text) {
              const counter = { val: 0 };
              gsap.to(counter, {
                val: score,
                duration: 1.4,
                delay: 0.45,
                ease: "power2.out",
                onUpdate: () => {
                  text.textContent = `${Math.round(counter.val)}점`;
                },
              });
            }
          });
        },
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
      className="bg-[#F9FAFB]"
    >
      <div className="max-w-content w-full md:max-w-[1080px]">
        <LandingSectionHeader
          eyebrow="AI 리뷰 리포트"
          title="더 정확한 피드백."
        />
        <div className="flex flex-col gap-[clamp(8px,1.8vh,28px)] md:grid md:grid-cols-3 md:gap-[clamp(14px,2.4vh,36px)]">
          {REVIEW_REPORTS.map((r, idx) => (
            <div
              key={r.num}
              data-review-card
              data-cursor-hover
              className="relative bg-white rounded-lg border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform hover:-translate-y-1 hover:border-[#0991B2]/40 hover:shadow-[0_14px_36px_-12px_rgba(9,145,178,0.28)] p-[clamp(14px,2.2vh,40px)] md:rounded-2xl"
            >
              {idx === 1 && (
                <LottiePlayer
                  src="/lottie/review-progress.json"
                  ariaLabel="영역별 점수 분석 진행 중"
                  className="absolute top-[clamp(8px,1.6vh,24px)] right-[clamp(8px,1.6vh,24px)] w-[clamp(36px,5vh,72px)] h-[clamp(36px,5vh,72px)] opacity-90"
                />
              )}
              <div className="flex items-center gap-[clamp(6px,1.2vh,14px)] mb-[clamp(6px,1.4vh,28px)]">
                <span aria-hidden="true" className="font-bold text-[#6B7280] text-[clamp(10px,calc(0.85vh+0.25vw),15px)]">
                  {r.num}
                </span>
                {r.badge && (
                  <span className="font-bold text-[#047857] bg-[#ECFDF5] rounded text-[clamp(9px,calc(0.8vh+0.2vw),13px)] px-[clamp(6px,1.2vh,14px)] py-[clamp(2px,0.5vh,6px)]">
                    {r.badge}
                  </span>
                )}
              </div>
              <h3 className="font-plex-sans-kr font-bold text-[#0A0A0A] text-[clamp(12px,calc(1.2vh+0.45vw),22px)] mb-[clamp(4px,1vh,16px)] leading-tight">
                {r.title}
              </h3>
              <p className="text-[#6B7280] leading-[1.6] text-[clamp(10px,calc(0.9vh+0.35vw),17px)] line-clamp-3 md:line-clamp-none">
                {r.desc}
              </p>

              {r.score != null && (
                <div className="mt-[clamp(8px,1.8vh,32px)]">
                  <div className="flex items-center justify-between mb-[clamp(2px,0.5vh,8px)]">
                    <span className="font-semibold text-[#6B7280] text-[clamp(9px,calc(0.8vh+0.2vw),14px)]">
                      {r.scoreLabel ?? "분석 점수"}
                    </span>
                    <span
                      data-score-text
                      className="font-plex-sans-kr font-bold text-[#0E7490] tabular-nums text-[clamp(10px,calc(0.9vh+0.3vw),17px)]"
                    >
                      {reduced ? `${r.score}점` : "0점"}
                    </span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] rounded-full overflow-hidden h-[clamp(3px,0.6vh,8px)]">
                    <div
                      data-score-bar
                      data-score={r.score}
                      style={{ width: reduced ? `${r.score}%` : "0%" }}
                      className="h-full bg-gradient-to-r from-[#0991B2] to-[#06B6D4] rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
