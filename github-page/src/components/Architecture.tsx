import { Server, Layout, Network, Cloud } from "lucide-react";
import { architecture, infraDiagrams } from "../data";
import Section from "./Section";
import DiagramCard from "./DiagramCard";

const icons = [
  <Server size={20} key="s" />,
  <Layout size={20} key="l" />,
  <Network size={20} key="n" />,
  <Cloud size={20} key="c" />,
];

export default function Architecture() {
  return (
    <Section
      id="architecture"
      eyebrow="아키텍처"
      title={
        <>
          LLM 기반 마이크로서비스
          <br />+ 이벤트 기반 영상 처리.
        </>
      }
      description={`k3s 클러스 내의 Django Core Backend와 5개의 Worker Service,\nAWS Lambda 기반 영상 파이프라인을 운영합니다.`}
      variant="muted"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {architecture.map((a, i) => (
          <div
            key={a.title}
            className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sc"
          >
            <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-accent-bg text-accent">
              {icons[i]}
            </div>
            <h3 className="font-display mb-3 text-base font-bold text-fg">
              {a.title}
            </h3>
            <ul className="space-y-1.5 text-sm">
              {a.items.map((item) => (
                <li key={item} className="flex gap-2 text-secondary">
                  <span className="text-accent">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {infraDiagrams.map((d) => (
          <DiagramCard
            key={d.title}
            image={d.image}
            title={d.title}
            desc={d.desc}
            aspect="wide"
          />
        ))}
      </div>
    </Section>
  );
}
