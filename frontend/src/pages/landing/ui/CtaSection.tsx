import { Button } from "@/shared/ui";
import { useMagnetic } from "@/shared/lib/animation";

export function CtaSection() {
  const primaryRef = useMagnetic<HTMLDivElement>({ strength: 0.35, scale: 1.04, maxXRatio: 0.03 });
  const secondaryRef = useMagnetic<HTMLDivElement>({ strength: 0.3, scale: 1.03, maxXRatio: 0.03 });

  return (
    <section className="bg-[#F9FAFB]">
      <div className="max-w-content w-full bg-[#0A0A0A] rounded-lg text-center shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] relative overflow-hidden px-[clamp(16px,3vh,80px)] py-[clamp(28px,5vh,88px)] md:max-w-[1080px] md:rounded-2xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[15%] -left-[10%] w-[60%] h-[80%] rounded-full will-change-transform animate-[glowBlob_6s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(circle, rgba(9,145,178,0.55) 0%, rgba(9,145,178,0.2) 35%, transparent 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[20%] -right-[15%] w-[55%] h-[75%] rounded-full will-change-transform animate-[glowBlob_8s_ease-in-out_infinite_reverse]"
          style={{
            background:
              "radial-gradient(circle, rgba(6,182,212,0.5) 0%, rgba(6,182,212,0.18) 40%, transparent 75%)",
            animationDelay: "1.2s",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.18]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>\")",
            backgroundSize: "180px 180px",
          }}
        />

        <h2 className="relative z-10 font-plex-sans-kr font-black text-white leading-[1.1] text-[clamp(28px,calc(3vh+3.5vw),56px)] mb-[clamp(8px,1.6vh,24px)]">
          未fit에서<br />meFit으로.
        </h2>
        <p className="relative z-10 text-white/60 leading-[1.6] text-[clamp(12px,calc(1vh+0.5vw),17px)] mb-[clamp(16px,3vh,48px)]">
          아직 핏이 맞지 않아도 괜찮아요.<br />
          지금 시작해 면접에 맞는 나로.
        </p>
        <div className="relative z-10 flex flex-col gap-[clamp(6px,1.2vh,14px)] items-center md:flex-row md:justify-center">
          <div ref={primaryRef} className="w-full md:w-auto will-change-transform">
            <Button
              href="/sign-up"
              variant="secondary"
              size="lg"
              className="w-full md:w-auto"
            >
              무료 면접 시작하기 →
            </Button>
          </div>
          <div ref={secondaryRef} className="w-full md:w-auto will-change-transform">
            <Button
              href="#pricing"
              variant="outline"
              size="lg"
              className="w-full md:w-auto"
            >
              요금제 보기
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
