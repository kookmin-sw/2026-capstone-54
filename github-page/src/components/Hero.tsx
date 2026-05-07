import { useEffect, useState } from "react";
import { ArrowRight, Github } from "lucide-react";
import {
  heroBadge,
  heroHeadline,
  heroRotatingKeywords,
  team,
} from "../data";

export default function Hero() {
  const [keywordIndex, setKeywordIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setKeywordIndex((i) => (i + 1) % heroRotatingKeywords.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      id="top"
      className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-hidden bg-canvas px-5 pt-28 pb-16 text-center md:px-10 md:pt-32 md:pb-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(9,145,178,0.16), transparent 65%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-[1080px] flex-col items-center gap-10">
        <div className="flex flex-col items-center fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-1.5 text-xs font-semibold text-secondary shadow-sc backdrop-blur-sm">
            <span className="size-1.5 animate-pulse-soft rounded-full bg-em" />
            {heroBadge.text}
          </div>

          <h1 className="font-display mb-6 text-balance text-5xl font-black leading-[1.05] tracking-[-2px] text-fg sm:text-6xl md:text-7xl lg:text-8xl">
            {heroHeadline.line1}
            <br />
            <span className="gradient-text">{heroHeadline.line2Accent}</span>
            <br />
            {heroHeadline.line3}
          </h1>

          <p className="mb-6 max-w-[560px] whitespace-pre-line text-base leading-relaxed text-muted md:text-lg md:leading-[1.7]">
            {heroHeadline.subtitle}
          </p>

          <div className="mb-10 inline-flex items-center gap-2.5 rounded-full border border-border bg-white/70 px-4 py-2 shadow-sc backdrop-blur-sm">
            <span className="text-xs font-medium text-muted">지금 한 곳에서:</span>
            <span
              key={heroRotatingKeywords[keywordIndex]}
              className="font-display text-sm font-bold text-accent fade-up"
            >
              {heroRotatingKeywords[keywordIndex]}
            </span>
          </div>

          <div className="flex w-full flex-col items-center gap-3 md:flex-row md:gap-3">
            <a
              href={team.demo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-fg px-8 py-3.5 font-display text-sm font-bold text-white transition-opacity duration-200 hover:opacity-85 md:w-auto md:text-base"
            >
              사이트 방문
              <ArrowRight size={16} />
            </a>
            <a
              href="#features"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-fg bg-white/85 px-8 py-3.5 font-display text-sm font-semibold text-fg transition-colors duration-200 hover:bg-bg-soft md:w-auto md:text-base"
            >
              핵심 기능 보기
            </a>
            <a
              href={team.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-3.5 font-display text-sm font-semibold text-muted transition-colors duration-200 hover:text-fg md:w-auto md:text-base"
            >
              <Github size={16} />
              GitHub Org
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-em" />
            데모 운영 중
            <a
              href={team.demo}
              target="_blank"
              rel="noreferrer"
              className="ml-1 font-semibold text-accent underline-offset-4 hover:underline"
            >
              mefit.kr
            </a>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-em" />
            API
            <a
              href={team.api}
              target="_blank"
              rel="noreferrer"
              className="ml-1 font-semibold text-accent underline-offset-4 hover:underline"
            >
              api.mefit.kr
            </a>
          </span>
        </div>
      </div>
    </section>
  );
}
