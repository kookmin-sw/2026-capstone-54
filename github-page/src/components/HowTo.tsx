import { ChevronRight } from "lucide-react";
import { howToSteps, howToTags } from "../data";
import Section from "./Section";

export default function HowTo() {
  return (
    <Section
      id="how-to"
      eyebrow="이용 방법"
      title={
        <>
          <span className="gradient-text">3단계</span>로 시작합니다.
        </>
      }
      description={`회원가입 → 이력서 · 공고 선택 → 면접 → 결과 확인.\n그게 전부입니다.`}
    >
      <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
        {howToSteps.map((s, i) => (
          <li
            key={s.num}
            className="relative flex flex-col rounded-2xl border border-border bg-bg-soft p-7 shadow-sc"
          >
            <div className="font-numeric text-5xl font-black leading-none tracking-tighter text-accent md:text-6xl">
              {s.num}
            </div>
            <h3 className="font-display mt-5 text-xl font-bold text-fg">
              {s.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              <span className="whitespace-pre-line">{s.desc}</span>
            </p>
            {i < howToSteps.length - 1 && (
              <ChevronRight
                size={22}
                strokeWidth={2.5}
                className="absolute right-[-14px] top-1/2 hidden -translate-y-1/2 text-border md:block"
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {howToTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-secondary shadow-sc"
          >
            {tag}
          </span>
        ))}
      </div>
    </Section>
  );
}
