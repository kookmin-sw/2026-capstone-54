const STATS = [
  { value: "98%", label: "면접 만족도" },
  { value: "3배", label: "합격률 향상" },
  { value: "15분", label: "최단 면접" },
  { value: "24/7", label: "언제든 가능" },
];

export function HeroSection() {
  return (
    <section
      id="hero"
      className="min-h-svh flex flex-col items-center justify-center text-center px-5 pt-20 pb-12 relative overflow-hidden bg-white md:px-10 md:pt-25 md:pb-16"
    >
      <div className="relative z-10 max-w-content w-full flex flex-col items-center gap-10 md:max-w-[820px] md:gap-12">
        <div className="flex flex-col items-center w-full">
            <div className="inline-flex items-center gap-[7px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-full px-[14px] py-[6px] text-[12px] font-[600] text-[#374151] mb-6 leading-none">       
              <span className="w-[7px] h-[7px] rounded-full bg-[#059669] inline-block shrink-0" />
              수천 명이 meFit으로 면접 준비 중
          </div>
          <h1 className="font-plex-sans-kr text-[clamp(44px,13vw,80px)] font-black leading-[1.05] text-[#0A0A0A] mb-4 tracking-[-2px]">
            아직 핏이<br />
            <span className="gradient-text">맞지 않아도</span><br />
            괜찮아.
          </h1>
          <p className="text-[14px] text-[#6B7280] leading-[1.7] max-w-button-group mb-8 md:text-[15px] md:max-w-[420px] md:mb-9">
            未fit, meFit. 이력서 기반 AI 면접부터<br />시선 분석까지. 면접에 맞는 나로.
          </p>
          <div className="flex flex-col gap-[10px] w-full max-w-button-group md:flex-row md:max-w-none md:w-auto md:gap-3">
            <a 
              href="/sign-up" 
              className="font-plex-sans-kr text-[15px] font-bold text-white bg-[#0A0A0A] no-underline !py-[15px] !px-0 rounded-md block text-center transition-opacity duration-200 hover:opacity-85 md:inline-block md:!px-8"
            >
              무료 면접 시작하기 →
            </a>
            <a 
              href="#features" 
              className="font-plex-sans-kr text-[15px] font-semibold text-[#0A0A0A] bg-white no-underline !py-[15px] !px-0 rounded-md border-[1.5px] border-[#0A0A0A] block text-center transition-[background] duration-200 hover:bg-[#F9FAFB] md:inline-block md:!px-8"
            >
              데모 보기
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-content w-full md:grid-cols-4 md:gap-12 md:max-w-[680px]">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-[#F9FAFB] rounded-lg px-4 py-5 text-center border border-[#E5E7EB] md:bg-transparent md:border-none md:rounded-none md:p-0"
            >
              <div className="font-plex-sans-kr text-[36px] font-black text-[#0A0A0A] leading-none mb-1 md:text-[38px] md:mb-1.5">{s.value}</div>
              <div className="text-[12px] text-[#6B7280] font-medium md:text-[13px]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
