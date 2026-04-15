import { Fragment } from "react";
import type { ResumeCountStats } from "@/features/resume";

interface ResumeStatsStripProps {
  count: ResumeCountStats;
}

export function ResumeStatsStrip({ count }: ResumeStatsStripProps) {
  const analyzing = count.processing + count.pending;

  const statItems = [
    { value: count.total,     label: "전체 이력서" },
    { value: count.active,    label: "활성 이력서" },
    { value: count.completed, label: "분석 완료" },
    { value: analyzing,       label: "분석 중" },
  ];

  const badges = [
    { dot: "#10B981", text: `분석 완료 ${count.completed}개` },
    { dot: "#0EA5E9", text: `분석 중 ${analyzing}개` },
    { dot: "#F59E0B", text: `활성 이력서 ${count.active}개` },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#065F79] to-[#0991B2] rounded-lg px-6 py-[22px] mb-7 shadow-[0_12px_32px_rgba(9,145,178,.35)] flex items-center gap-[18px] flex-wrap before:content-[''] before:absolute before:top-[-40px] before:right-[-40px] before:w-[160px] before:h-[160px] before:rounded-full before:bg-[rgba(255,255,255,.07)] md:px-9 md:py-7 md:gap-8">
      {statItems.map((item, i) => (
        <Fragment key={item.label}>
          <div className="flex flex-col gap-[2px] relative">
            <span className="font-plex-sans-kr text-[clamp(28px,4vw,46px)] font-black text-white leading-none">
              {item.value}
            </span>
            <span className="text-[12px] font-semibold text-white/65">{item.label}</span>
          </div>
          {i < statItems.length - 1 && <div className="w-px h-10 bg-white/20 shrink-0" />}
        </Fragment>
      ))}
      <div className="flex gap-2 flex-wrap relative ml-auto">
        {badges.map((badge) => (
          <span
            key={badge.text}
            className="flex items-center gap-[5px] bg-white/15 backdrop-blur-[8px] rounded-full px-[13px] py-[6px] text-[12px] font-semibold text-white"
          >
            {badge.dot && (
              <span
                className="w-[6px] h-[6px] rounded-full shrink-0"
                style={{ backgroundColor: badge.dot }}
              />
            )}
            {badge.text}
          </span>
        ))}
      </div>
    </div>
  );
}
