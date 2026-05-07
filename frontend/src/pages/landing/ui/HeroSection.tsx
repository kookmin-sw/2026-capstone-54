import { lazy, Suspense, useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  registerGsapPlugins,
  SplitText,
  useMagnetic,
  useReducedMotion,
} from "@/shared/lib/animation";
import { LottiePlayer } from "@/shared/ui";
import {
  HERO_ROTATING_KEYWORDS,
  HERO_ROTATING_KEYWORDS_LONGEST,
  HERO_STATS,
} from "../model/content";
import type { HeroStat } from "../model/content";

const HeroBackground3D = lazy(() => import("./HeroBackground3D"));

const HERO_BG_STYLE: React.CSSProperties = {
  background:
    "radial-gradient(circle at 50% 35%, rgba(9,145,178,0.14), transparent 65%)",
};

function StatValue({ stat }: { stat: HeroStat }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || stat.numeric == null) return;
      const target = stat.numeric;
      const suffix = stat.suffix ?? "";
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.6,
        ease: "power3.out",
        delay: 0.7,
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = `${Math.round(obj.val)}${suffix}`;
          }
        },
      });
    },
    { dependencies: [stat.numeric, stat.suffix, reduced] },
  );

  const initial =
    reduced || stat.numeric == null ? stat.value : `0${stat.suffix ?? ""}`;

  return (
    <div
      ref={ref}
      className="font-plex-sans-kr font-black text-[#0A0A0A] leading-none tabular-nums text-[clamp(22px,calc(2vh+1.2vw),40px)] mb-[clamp(2px,0.4vh,6px)]"
    >
      {initial}
    </div>
  );
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const primaryCtaRef = useMagnetic<HTMLAnchorElement>({ strength: 0.3, scale: 1.03 });
  const secondaryCtaRef = useMagnetic<HTMLAnchorElement>({ strength: 0.25, scale: 1.02 });
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      registerGsapPlugins();

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (headlineRef.current) {
        const split = SplitText.create(headlineRef.current, {
          type: "words,lines",
          wordsClass: "hero-word",
          linesClass: "hero-line",
        });
        const accentLine = split.lines[1];
        if (accentLine) {
          accentLine
            .querySelectorAll<HTMLElement>(".hero-word")
            .forEach((w) => w.classList.add("gradient-text"));
        }
        tl.from(
          split.words,
          { yPercent: 110, opacity: 0, duration: 0.85, stagger: 0.05 },
          0,
        );
      }

      tl.from(
        "[data-hero-anim]",
        { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 },
        0.35,
      );

      const keywords = sectionRef.current?.querySelectorAll<HTMLElement>(
        "[data-rotating-keyword]",
      );
      if (keywords && keywords.length > 1) {
        const items = Array.from(keywords);
        gsap.set(items, { opacity: 0, yPercent: 60 });
        gsap.set(items[0], { opacity: 1, yPercent: 0 });

        const rotateTl = gsap.timeline({ repeat: -1, delay: 1.2 });
        items.forEach((current, i) => {
          const next = items[(i + 1) % items.length];
          rotateTl
            .to(current, {
              opacity: 0,
              yPercent: -60,
              duration: 0.5,
              ease: "power2.in",
            }, "+=2.8")
            .fromTo(
              next,
              { opacity: 0, yPercent: 60 },
              {
                opacity: 1,
                yPercent: 0,
                duration: 0.5,
                ease: "power2.out",
              },
              "<+0.05",
            );
        });
      }
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="flex flex-col items-center justify-center text-center relative overflow-hidden bg-white"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={HERO_BG_STYLE}
      />
      <Suspense fallback={null}>
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none hidden md:block opacity-65 mix-blend-multiply"
        >
          <HeroBackground3D />
        </div>
      </Suspense>

      <div className="relative z-10 max-w-content w-full flex flex-col items-center gap-[clamp(20px,4vh,56px)] md:max-w-[1080px]">
        <div className="flex flex-col items-center w-full">
          <div
            data-hero-anim
            className="inline-flex items-center bg-white/80 backdrop-blur-sm border border-[#E5E7EB] rounded-full font-[600] text-[#374151] leading-none shadow-sm gap-[clamp(5px,0.8vh,8px)] px-[clamp(10px,1.6vh,16px)] py-[clamp(4px,0.8vh,7px)] text-[clamp(10px,calc(0.9vh+0.3vw),13px)] mb-[clamp(12px,2.4vh,28px)]"
          >
            <span className="rounded-full bg-[#059669] inline-block shrink-0 animate-pulse-soft w-[clamp(6px,0.9vh,8px)] h-[clamp(6px,0.9vh,8px)]" />
            모두가 미핏으로 면접 준비 중
          </div>
          <h1
            ref={headlineRef}
            className="font-plex-sans-kr font-black leading-[1.05] text-[#0A0A0A] tracking-[-2px] overflow-hidden text-[clamp(36px,calc(4vh+5vw),96px)] mb-[clamp(12px,2.4vh,28px)]"
          >
            아직 핏이<br />
            <span className="gradient-text">맞지 않아도</span><br />
            괜찮아.
          </h1>
          <p
            data-hero-anim
            className="text-[#6B7280] leading-[1.65] max-w-button-group text-[clamp(12px,calc(0.95vh+0.4vw),16px)] mb-[clamp(12px,2vh,24px)] md:max-w-[420px] md:leading-[1.7]"
          >
            未fit, meFit. 이력서 기반 AI 면접부터<br />시선 분석까지. 면접에 맞는 나로.
          </p>

          <div
            data-hero-anim
            className="inline-flex items-center bg-white/70 backdrop-blur-sm border border-[#E5E7EB] rounded-full shadow-sm gap-[clamp(5px,0.8vh,10px)] px-[clamp(10px,1.6vh,18px)] py-[clamp(4px,0.8vh,8px)] mb-[clamp(20px,3.6vh,44px)]"
          >
            <LottiePlayer
              src="/lottie/hero-ai-brain.json"
              ariaLabel="AI 면접 두뇌 일러스트"
              className="shrink-0 w-[clamp(20px,2.6vh,30px)] h-[clamp(20px,2.6vh,30px)]"
            />
            <span className="text-[#6B7280] font-medium leading-none text-[clamp(10px,calc(0.85vh+0.3vw),13px)]">
              지금 한 곳에서:
            </span>
            <span
              className="relative inline-block overflow-hidden leading-none align-middle"
              aria-live="polite"
            >
              <span
                aria-hidden="true"
                className="invisible whitespace-nowrap font-plex-sans-kr font-bold text-[clamp(11px,calc(0.9vh+0.35vw),14px)]"
              >
                {HERO_ROTATING_KEYWORDS_LONGEST}
              </span>
              {HERO_ROTATING_KEYWORDS.map((kw) => (
                <span
                  key={kw}
                  data-rotating-keyword
                  className="absolute left-0 top-0 whitespace-nowrap font-plex-sans-kr font-bold text-[#0991B2] text-[clamp(11px,calc(0.9vh+0.35vw),14px)]"
                >
                  {kw}
                </span>
              ))}
            </span>
          </div>

          <div
            data-hero-anim
            className="flex flex-col w-full max-w-button-group gap-[clamp(8px,1.4vh,14px)] md:flex-row md:max-w-none md:w-auto"
          >
            <a
              ref={primaryCtaRef}
              href="/sign-up"
              className="font-plex-sans-kr font-bold text-white bg-[#0A0A0A] no-underline rounded-md block text-center transition-opacity duration-200 hover:opacity-85 will-change-transform text-[clamp(13px,calc(1vh+0.4vw),16px)] !py-[clamp(11px,1.8vh,18px)] !px-0 md:inline-block md:!px-[clamp(24px,3vh,40px)]"
            >
              무료 면접 시작하기 →
            </a>
            <a
              ref={secondaryCtaRef}
              href="#features"
              className="font-plex-sans-kr font-semibold text-[#0A0A0A] bg-white/85 backdrop-blur-sm no-underline rounded-md border-[1.5px] border-[#0A0A0A] block text-center transition-[background] duration-200 hover:bg-[#F9FAFB] will-change-transform text-[clamp(13px,calc(1vh+0.4vw),16px)] !py-[clamp(11px,1.8vh,18px)] !px-0 md:inline-block md:!px-[clamp(24px,3vh,40px)]"
            >
              데모 보기
            </a>
          </div>
        </div>

        <div
          data-hero-anim
          className="grid grid-cols-4 max-w-content w-full gap-[clamp(6px,1.2vh,16px)] md:gap-[clamp(20px,4vh,48px)] md:max-w-[680px]"
        >
          {HERO_STATS.map((s) => (
            <div
              key={s.label}
              className="bg-white/85 backdrop-blur-sm rounded-lg text-center border border-[#E5E7EB] px-[clamp(4px,0.8vh,12px)] py-[clamp(8px,1.4vh,18px)] md:bg-transparent md:backdrop-blur-none md:border-none md:rounded-none md:p-0"
            >
              <StatValue stat={s} />
              <div className="text-[#6B7280] font-medium leading-tight text-[clamp(10px,calc(0.75vh+0.25vw),13px)]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
