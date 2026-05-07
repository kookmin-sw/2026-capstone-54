import { team } from "../data";
import Section from "./Section";

const roleStyles: Record<string, string> = {
  PM: "bg-purple-100 text-purple-800",
  Backend: "bg-emerald-100 text-emerald-800",
  Frontend: "bg-accent-bg text-accent-deep",
};

export default function Team() {
  return (
    <Section
      id="team"
      eyebrow="팀 소개"
      title={
        <>
          {team.course} · {team.name} 
        </>
      }
      description={`기획 · 백엔드 · 프론트엔드 4인 구성.\n도메인 모델링부터 LLM 응용, 클라우드 운영까지 전 영역을 함께 진행합니다.`}
      variant="muted"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {team.members.map((m) => (
          <article
            key={m.name}
            className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sc transition-shadow duration-300 hover:shadow-sch"
          >
            <div className="font-display flex size-14 items-center justify-center rounded-full bg-fg text-2xl font-black text-white">
              {m.name.charAt(0)}
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <h3 className="font-display text-lg font-bold text-fg">{m.name}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  roleStyles[m.role] ?? "bg-bg-soft text-muted"
                }`}
              >
                {m.role}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
              {m.description}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
