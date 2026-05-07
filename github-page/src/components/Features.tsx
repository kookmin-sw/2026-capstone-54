import { features } from "../data";
import Section from "./Section";

const [featured, ...rest] = features;

export default function Features() {
  return (
    <Section
      id="features"
      eyebrow="핵심 기능"
      title="면접 준비의 모든 것."
      description={`이력서 분석부터 실전 화상 면접,\nAI 피드백까지 한 플랫폼에서.`}
      variant="muted"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2">
        <article className="group relative col-span-1 flex flex-col overflow-hidden rounded-2xl bg-fg p-7 text-white shadow-sc transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-cta md:col-span-2 md:row-span-2 md:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(9,145,178,0.4), transparent 55%)",
            }}
          />
          {featured.badge && (
            <span className="absolute right-4 top-4 z-10 rounded bg-white px-3 py-1 text-xs font-bold text-fg">
              {featured.badge}
            </span>
          )}
          <div className="relative z-10 mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-white/12 transition-colors duration-300 group-hover:bg-accent/30">
            <featured.Icon
              size={26}
              strokeWidth={2}
              className="text-white"
              aria-hidden="true"
            />
          </div>
          <h3 className="font-display relative z-10 mb-3 text-xl font-bold leading-tight text-white md:text-2xl">
            {featured.title}
          </h3>
          <p className="relative z-10 text-sm leading-[1.6] text-white/75 md:text-base">
            <span className="whitespace-pre-line">{featured.desc}</span>
          </p>
        </article>

        {rest.map((f) => (
          <article
            key={f.title}
            className="group flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sc transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-sch"
          >
            <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl border border-border bg-white transition-colors duration-300 group-hover:border-accent/50 group-hover:bg-accent-bg">
              <f.Icon
                size={22}
                strokeWidth={2}
                className="text-fg transition-colors duration-300 group-hover:text-accent"
                aria-hidden="true"
              />
            </div>
            <h3 className="font-display mb-2 text-base font-bold leading-tight text-fg">
              {f.title}
            </h3>
            <p className="text-sm leading-[1.55] text-muted">
              <span className="whitespace-pre-line">{f.desc}</span>
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
