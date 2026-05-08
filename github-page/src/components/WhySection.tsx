import { whyReasons } from "../data";
import Section from "./Section";

const [featured, ...rest] = whyReasons;

export default function WhySection() {
  return (
    <Section
      id="why"
      eyebrow="왜 MeFit인가"
      title={
        <>
          6가지 이유로,
          <br className="md:hidden" /> 다른 모의면접과 다릅니다.
        </>
      }
      description={`이력서 & 채용공고 기반 맞춤 질문, 꼬리질문 AI,\n표정 · 발화 분석까지 한 플랫폼에서.`}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-3">
        <article className="group relative col-span-1 flex flex-col overflow-hidden rounded-2xl bg-fg p-7 text-white shadow-sc transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-cta md:col-span-2 md:row-span-2 md:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(9,145,178,0.4), transparent 55%)",
            }}
          />
          <div className="relative z-10 mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-white/12 transition-colors duration-300 group-hover:bg-accent/30">
            <featured.Icon size={26} strokeWidth={2} className="text-white" aria-hidden="true" />
          </div>
          <h3 className="font-display relative z-10 mb-3 text-2xl font-bold leading-tight text-white md:text-3xl">
            {featured.title}
          </h3>
          <p className="relative z-10 max-w-prose whitespace-pre-line text-sm leading-[1.7] text-white/75 md:text-base">
            <span className="whitespace-pre-line">{featured.desc}</span>
          </p>
        </article>

        {rest.map((r) => (
          <article
            key={r.title}
            className="group flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sc transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-sch"
          >
            <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-accent-bg text-accent">
              <r.Icon size={20} strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="font-display mb-2 text-base font-bold leading-tight text-fg">
              {r.title}
            </h3>
            <p className="text-sm leading-[1.55] text-muted">{r.desc}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
