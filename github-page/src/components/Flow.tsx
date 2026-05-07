import { activityDiagrams, userFlow } from "../data";
import Section from "./Section";
import DiagramCard from "./DiagramCard";

export default function Flow() {
  return (
    <Section
      id="flow"
      eyebrow="사용자 흐름"
      title={
        <>
          <span className="gradient-text">Activity Diagram</span>으로
          <br />한눈에 보기.
        </>
      }
      description={`인증 / 이력서 / 채용공고 / 면접 / 분석 리포트`}
    >
      <ol className="mb-12 grid gap-3 md:grid-cols-4">
        {userFlow.map((f) => (
          <li
            key={f.step}
            className="flex flex-col rounded-2xl border border-border bg-bg-soft p-5"
          >
            <div className="font-numeric text-3xl font-black tracking-tighter text-accent">
              {f.step}
            </div>
            <h3 className="font-display mt-2 text-base font-bold text-fg">
              {f.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{f.desc}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {activityDiagrams.map((d) => (
          <DiagramCard
            key={d.title}
            image={d.image}
            title={d.title}
            desc={d.desc}
            aspect="tall"
          />
        ))}
      </div>
    </Section>
  );
}
