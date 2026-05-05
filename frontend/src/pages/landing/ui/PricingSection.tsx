import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  registerGsapPlugins,
  useReducedMotion,
} from "@/shared/lib/animation";
import {
  PRICING_FREE_ITEMS,
  PRICING_PRO_ITEMS,
  PRICING_PRO_PLANS,
} from "../model/content";
import { LandingSectionHeader } from "./LandingSectionHeader";

type BillingCycle = "monthly" | "yearly";

const PRICE_FORMATTER = new Intl.NumberFormat("ko-KR");

export function PricingSection() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const priceRef = useRef<HTMLSpanElement | null>(null);
  const noteRef = useRef<HTMLDivElement | null>(null);
  const proCardRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  const plan = PRICING_PRO_PLANS[cycle];

  useGSAP(
    () => {
      if (reduced) return;
      registerGsapPlugins();
      const targets = [priceRef.current, noteRef.current].filter(
        (el): el is HTMLElement => el !== null,
      );
      if (targets.length === 0) return;
      gsap.fromTo(
        targets,
        { y: -8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out", stagger: 0.04 },
      );
      if (proCardRef.current) {
        gsap.fromTo(
          proCardRef.current,
          { boxShadow: "0 0 0 0 rgba(9,145,178,0)" },
          {
            boxShadow: "0 0 0 6px rgba(9,145,178,0.18)",
            duration: 0.4,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
          },
        );
      }
    },
    { dependencies: [cycle, reduced] },
  );

  return (
    <section id="pricing" className="bg-white">
      <div className="max-w-content w-full md:max-w-[1080px]">
        <LandingSectionHeader
          eyebrow="요금제"
          title="나에게 맞는 플랜."
          subtitle="숨겨진 비용 없음. 언제든 업그레이드/취소 가능."
          spacing="tight"
        />

        <div
          role="tablist"
          aria-label="결제 주기 선택"
          className="mx-auto mb-[clamp(12px,2vh,32px)] inline-flex items-center bg-[#F3F4F6] border border-[#E5E7EB] rounded-full p-[clamp(3px,0.5vh,5px)] gap-[clamp(2px,0.4vh,4px)]"
        >
          {(["monthly", "yearly"] as const).map((value) => {
            const active = cycle === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                data-cursor-hover
                onClick={() => setCycle(value)}
                className={`relative font-plex-sans-kr font-semibold rounded-full transition-[background,color] duration-300 cursor-pointer text-[clamp(11px,calc(0.95vh+0.3vw),15px)] px-[clamp(14px,2vh,28px)] py-[clamp(6px,1vh,10px)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E7490] ${active ? "bg-white text-[#0A0A0A] shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "bg-transparent text-[#4B5563] hover:text-[#0A0A0A]"}`}
              >
                {value === "monthly" ? "월간 결제" : "연간 결제"}
                {value === "yearly" && (
                  <span className="ml-[clamp(4px,0.8vh,8px)] inline-block font-bold text-[#0E7490] bg-[#CFFAFE] rounded text-[clamp(9px,calc(0.7vh+0.2vw),12px)] px-[clamp(4px,0.8vh,8px)] py-[clamp(1px,0.3vh,3px)]">
                    -16%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-[clamp(8px,1.8vh,28px)] md:flex md:flex-row md:gap-[clamp(16px,2.8vh,40px)] md:max-w-[920px] md:mx-auto w-full">
          <div className="flex-1 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] p-[clamp(14px,2.4vh,56px)] md:rounded-2xl">
            <div className="font-plex-sans-kr font-extrabold text-[#0A0A0A] text-[clamp(12px,calc(1.2vh+0.5vw),26px)] mb-[clamp(2px,0.5vh,14px)]">
              Free
            </div>
            <div className="font-plex-sans-kr font-black text-[#0A0A0A] leading-none text-[clamp(24px,calc(2.6vh+1.4vw),72px)] mb-[clamp(2px,0.4vh,10px)]">
              ₩0
            </div>
            <div className="text-[#6B7280] text-[clamp(10px,calc(0.9vh+0.3vw),18px)] mb-[clamp(10px,2vh,40px)]">
              월 요금 없음
            </div>
            <ul className="list-none p-0 m-0 flex flex-col gap-[clamp(5px,1.1vh,18px)] mb-[clamp(10px,2vh,44px)]">
              {PRICING_FREE_ITEMS.map((item) => (
                <li
                  key={item.text}
                  className={`flex items-center gap-[clamp(6px,1.2vh,14px)] text-[clamp(10px,calc(0.95vh+0.35vw),18px)] ${item.ok ? "text-[#0A0A0A]" : "text-[#6B7280]"}`}
                >
                  <span className={`shrink-0 font-bold ${item.ok ? "text-[#047857]" : "text-[#9CA3AF]"}`} aria-hidden="true">
                    {item.ok ? "✓" : "✕"}
                  </span>
                  <span className="truncate">{item.text}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              data-cursor-hover
              className="w-full rounded-md border-none font-plex-sans-kr font-bold cursor-pointer transition-opacity duration-200 hover:opacity-85 bg-[#0A0A0A] text-white text-[clamp(11px,calc(1vh+0.4vw),18px)] py-[clamp(10px,1.8vh,22px)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0991B2] md:rounded-lg"
            >
              현재 플랜
            </button>
          </div>

          <div
            ref={proCardRef}
            data-cursor-hover
            className="flex-1 rounded-lg bg-[#0A0A0A] relative shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] animate-breathe-ring p-[clamp(14px,2.4vh,56px)] md:rounded-2xl"
          >
            <span className="absolute font-bold text-[#0A0A0A] bg-white rounded text-[clamp(9px,calc(0.8vh+0.2vw),14px)] px-[clamp(6px,1.2vh,18px)] py-[clamp(2px,0.5vh,7px)] top-[clamp(8px,1.6vh,28px)] right-[clamp(8px,1.6vh,28px)]">
              추천
            </span>
            <div className="font-plex-sans-kr font-extrabold text-white text-[clamp(12px,calc(1.2vh+0.5vw),26px)] mb-[clamp(2px,0.5vh,14px)] flex items-center gap-2">
              Pro
              {plan.badge && (
                <span className="font-bold text-[#0A0A0A] bg-[#6EE7B7] rounded text-[clamp(9px,calc(0.7vh+0.2vw),12px)] px-[clamp(5px,1vh,10px)] py-[clamp(1px,0.3vh,3px)]">
                  {plan.badge}
                </span>
              )}
            </div>
            <div className="font-plex-sans-kr font-black text-white leading-none text-[clamp(20px,calc(2vh+1.1vw),60px)] mb-[clamp(2px,0.4vh,10px)]">
              <span ref={priceRef} className="inline-block">
                ₩{PRICE_FORMATTER.format(plan.amount)}
                <span className="text-[clamp(11px,calc(1vh+0.4vw),24px)]">/{plan.period}</span>
              </span>
            </div>
            <div
              ref={noteRef}
              className="text-white/55 text-[clamp(10px,calc(0.9vh+0.3vw),18px)] mb-[clamp(10px,2vh,40px)]"
            >
              {plan.note}
            </div>
            <ul className="list-none p-0 m-0 flex flex-col gap-[clamp(5px,1.1vh,18px)] mb-[clamp(10px,2vh,44px)]">
              {PRICING_PRO_ITEMS.map((item) => (
                <li
                  key={item.text}
                  className="text-white/90 flex items-center gap-[clamp(6px,1.2vh,14px)] text-[clamp(10px,calc(0.95vh+0.35vw),18px)]"
                >
                  <span className="shrink-0 text-[#6EE7B7] font-bold">✓</span>
                  <span className="truncate">{item.text}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/subscription"
              data-cursor-hover
              className="w-full rounded-md border-none font-plex-sans-kr font-bold cursor-pointer transition-opacity duration-200 hover:opacity-85 bg-white text-[#0A0A0A] flex items-center justify-center no-underline text-[clamp(11px,calc(1vh+0.4vw),18px)] py-[clamp(10px,1.8vh,22px)] md:rounded-lg"
            >
              Pro 업그레이드
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
