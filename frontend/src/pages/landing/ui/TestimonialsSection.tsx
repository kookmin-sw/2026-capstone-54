import type { Testimonial } from "../model/content";
import { TESTIMONIALS } from "../model/content";
import { LandingSectionHeader } from "./LandingSectionHeader";
import { MarqueeRow } from "@/shared/ui";

const ROW_TOP = TESTIMONIALS.slice(0, 4);
const ROW_BOTTOM = TESTIMONIALS.slice(4, 8);

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div
      data-cursor-hover
      className="bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] shrink-0 w-[clamp(220px,32vw,420px)] p-[clamp(12px,2vh,40px)] md:rounded-2xl"
    >
      <p className="text-[#374151] leading-[1.6] text-[clamp(11px,calc(1vh+0.45vw),20px)] mb-[clamp(8px,1.6vh,28px)] line-clamp-4">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="flex items-center gap-[clamp(6px,1.4vh,16px)]">
        <span className="rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 w-[clamp(26px,4vh,56px)] h-[clamp(26px,4vh,56px)] text-[clamp(12px,2vh,28px)]">
          {testimonial.avatar}
        </span>
        <div className="min-w-0">
          <div className="font-plex-sans-kr font-bold text-[#0A0A0A] truncate text-[clamp(11px,calc(1vh+0.35vw),18px)]">
            {testimonial.name}
          </div>
          <div className="text-[#6B7280] truncate text-[clamp(10px,calc(0.85vh+0.3vw),16px)]">
            {testimonial.role}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section id="reviews" className="bg-white">
      <div className="max-w-content w-full md:max-w-[1280px]">
        <LandingSectionHeader
          eyebrow="면접 후기"
          title="실제 사용자들의 이야기."
        />
        <div className="flex flex-col gap-[clamp(8px,1.8vh,28px)] w-full">
          <MarqueeRow direction="left" duration={42}>
            {ROW_TOP.map((t) => (
              <TestimonialCard key={t.name} testimonial={t} />
            ))}
          </MarqueeRow>
          <MarqueeRow direction="right" duration={50}>
            {ROW_BOTTOM.map((t) => (
              <TestimonialCard key={t.name} testimonial={t} />
            ))}
          </MarqueeRow>
        </div>
      </div>
    </section>
  );
}
