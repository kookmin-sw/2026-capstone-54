import { techStack } from "../data";
import Section from "./Section";

export default function TechStack() {
  return (
    <Section
      id="tech-stack"
      eyebrow="기술 스택"
      title=" Production 수준의 도구 조합 도전"
      description="다양한 기술, 도구를 접목하여 최적의 솔루션을 구축하는 것을 목표로 했습니다."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {techStack.map((t) => (
          <div
            key={t.group}
            className="rounded-2xl border border-border bg-white p-6 shadow-sc"
          >
            <div className="font-display text-xs font-bold uppercase tracking-wider text-accent">
              {t.group}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.items.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-border bg-bg-soft px-3 py-1 text-xs font-medium text-fg"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
