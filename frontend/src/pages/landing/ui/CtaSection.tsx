import { Button } from "@/shared/ui";

export function CtaSection() {
  return (
    <section className="py-12 px-5 flex justify-center bg-white md:py-20 md:px-10">
      <div className="max-w-content w-full bg-[#0A0A0A] rounded-lg px-5 py-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] md:max-w-[900px] md:rounded-lg md:px-[80px] md:py-[88px]">
        <h2 className="font-inter text-[clamp(32px,10vw,48px)] font-black text-white mb-4 leading-[1.1] md:text-[clamp(36px,5vw,56px)] md:mb-6">
          未fit에서<br />meFit으로.
        </h2>
        <p className="text-[14px] text-white/60 leading-[1.7] mb-8 md:text-[17px] md:mb-12">
          아직 핏이 맞지 않아도 괜찮아요. 지금 바로 시작해서<br />
          면접에 맞는 나로 완성해가세요.
        </p>
        <div className="flex flex-col gap-[10px] items-center md:flex-row md:justify-center md:gap-[14px]">
          <Button
            href="/sign-up"
            variant="secondary"
            size="lg"
            className="w-full md:w-auto"
          >
            무료 면접 시작하기 →
          </Button>
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
    </section>
  );
}
