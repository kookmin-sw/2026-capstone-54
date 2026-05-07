import { AlertCircle, Sparkles, Users } from "lucide-react";
import { overviewBlocks } from "../data";
import Section from "./Section";

const accentClasses: Record<string, { bg: string; text: string }> = {
  red: { bg: "bg-red-50", text: "text-red-700" },
  accent: { bg: "bg-accent-bg", text: "text-accent" },
  amber: { bg: "bg-amber-50", text: "text-amber-700" },
};

const icons = [
  <AlertCircle size={20} key="alert" />,
  <Sparkles size={20} key="sparkles" />,
  <Users size={20} key="users" />,
];

export default function Overview() {
  return (
    <Section
      id="overview"
      eyebrow="프로젝트 개요"
      title={
        <>
          혼자서, 빠르게,
          <br className="md:hidden" /> 진짜 면접처럼.
        </>
      }
      description={`MeFit은 면접 연습의 기회 비대칭을 해소하는 가상 면접 플랫폼입니다.\n다음 세 가지 관점에서 출발했습니다.`}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {overviewBlocks.map((block, i) => {
          const c = accentClasses[block.accent] ?? accentClasses.accent;
          return (
            <article
              key={block.label}
              className="rounded-2xl border border-border bg-white p-6 shadow-sc"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex size-10 items-center justify-center rounded-full ${c.bg} ${c.text}`}
                >
                  {icons[i]}
                </span>
                <h3 className="font-display text-base font-bold text-fg">
                  {block.label}
                </h3>
              </div>
              <ul className="mt-5 space-y-3">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-secondary">
                    <span className={`mt-2 size-1.5 shrink-0 rounded-full ${c.text.replace("text-", "bg-")}`} />
                    <span className="whitespace-pre-line">{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
