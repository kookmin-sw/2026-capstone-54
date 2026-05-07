import { ArrowRight, Github } from "lucide-react";
import { team } from "../data";

export default function Cta() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-fg px-5 py-20 md:px-10 md:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(9,145,178,0.45), transparent 60%), radial-gradient(circle at 50% 90%, rgba(6,182,212,0.25), transparent 65%)",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-[1080px] flex-col items-center text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-mid backdrop-blur-sm">
          미핏을 직접 사용해보세요
        </span>
        <h2 className="font-display max-w-3xl text-balance text-4xl font-black leading-[1.1] tracking-[-1px] text-white md:text-5xl lg:text-6xl">
          이력서와 채용공고만 넣으면,
          <br />
          <span className="gradient-text">AI 면접관이 질문하고</span>
          <br />
          <span className="gradient-text">맞춤형 AI 리포트</span>를 제공합니다.
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
          국민대 캡스톤 2026 · 54팀이 만든 가상 면접 플랫폼.
          <br className="hidden md:inline" />
          {" "}아래 사이트에서 직접 체험해보세요!
        </p>

        <div className="mt-9 flex w-full flex-col items-center gap-3 md:flex-row md:justify-center">
          <a
            href={team.demo}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-8 py-3.5 font-display text-sm font-bold text-fg transition-transform duration-200 hover:scale-[1.02] md:w-auto md:text-base"
          >
            사이트 방문
            <ArrowRight size={16} />
          </a>
          <a
            href={team.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-white/30 bg-transparent px-8 py-3.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 md:w-auto md:text-base"
          >
            <Github size={16} />
            GitHub Organization
          </a>
        </div>
      </div>
    </section>
  );
}
