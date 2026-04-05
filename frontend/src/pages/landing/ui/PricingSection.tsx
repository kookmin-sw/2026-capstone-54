const FREE_ITEMS = [
  { ok: true, text: "월 5회 면접" },
  { ok: true, text: "기본 AI 리뷰 리포트" },
  { ok: true, text: "스트릭 기능" },
  { ok: true, text: "이력서 등록 (최대 2개)" },
  { ok: false, text: "시선 추적 분석" },
  { ok: false, text: "상세 AI 리뷰 리포트" },
];

const PRO_ITEMS = [
  { ok: true, text: "무제한 면접" },
  { ok: true, text: "상세 AI 리뷰 리포트" },
  { ok: true, text: "시선 추적 분석" },
  { ok: true, text: "스트릭 보상 2배" },
  { ok: true, text: "이력서 무제한 등록" },
  { ok: true, text: "채용공고 연동" },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 px-5 flex justify-center bg-white md:py-25 md:px-10">
      <div className="max-w-[480px] w-full md:max-w-[1080px]">
        <div className="text-center mb-10 md:mb-16">
          <div className="inline-block text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] rounded px-[14px] py-[5px] mb-[14px] md:text-[14px] md:px-5 md:py-2 md:mb-5">
            요금제
          </div>
          <h2 className="font-inter text-[clamp(24px,7vw,36px)] font-extrabold text-[#0A0A0A] mb-3 md:text-[clamp(32px,4vw,48px)] md:mb-[18px]">
            나에게 맞는 플랜을 선택하세요.
          </h2>
          <p className="text-[14px] text-[#6B7280] md:text-[17px]">
            숨겨진 비용 없음. 언제든지 업그레이드 또는 취소 가능합니다.
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:gap-5 md:max-w-[760px] md:mx-auto">
          {/* Free */}
          <div className="flex-1 rounded-lg px-7 py-9 bg-[#F9FAFB] border border-[#E5E7EB] md:px-10 md:py-11">
            <div className="font-inter text-[18px] font-extrabold text-[#0A0A0A] mb-2 md:text-[20px] md:mb-2.5">Free</div>
            <div className="font-inter text-[44px] font-black text-[#0A0A0A] mb-1 md:text-[48px] md:mb-1.5">₩0</div>
            <div className="text-[13px] text-[#6B7280] mb-6 md:text-[14px] md:mb-8">월 요금 없음</div>
            <ul className="list-none p-0 m-0 mb-7 flex flex-col gap-3 md:gap-3.5 md:mb-9">
              {FREE_ITEMS.map((item) => (
                <li
                  key={item.text}
                  className={`text-[14px] flex items-center gap-[10px] md:text-[15px] md:gap-3 ${item.ok ? "text-[#0A0A0A]" : "text-[#9CA3AF]"}`}
                >
                  <span className={item.ok ? "text-[#059669] font-bold" : "text-[#D1D5DB] font-bold"}>
                    {item.ok ? "✓" : "✕"}
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
            <button className="w-full py-[14px] rounded-lg border-none font-inter text-[15px] font-bold cursor-pointer transition-opacity duration-200 hover:opacity-85 bg-[#0A0A0A] text-white md:py-4 md:rounded-lg md:text-[16px]">
              현재 플랜
            </button>
            <div className="text-center text-[12px] text-[#6B7280] mt-2.5 md:text-[13px] md:mt-3">기본 기능 무료 사용</div>
          </div>

          {/* Pro */}
          <div className="flex-1 rounded-lg px-7 py-9 bg-[#0A0A0A] relative shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] md:px-10 md:py-11">
            <span className="absolute top-5 right-5 text-[11px] font-bold text-[#0A0A0A] bg-white rounded px-3 py-1 md:top-6 md:right-6 md:text-[12px] md:px-3.5 md:py-[5px]">
              추천
            </span>
            <div className="font-inter text-[18px] font-extrabold text-white mb-2 md:text-[20px] md:mb-2.5">Pro</div>
            <div className="font-inter text-[44px] font-black text-white mb-1 md:text-[48px] md:mb-1.5">
              ₩19,900<span className="text-[18px] md:text-[20px]">/월</span>
            </div>
            <div className="text-[13px] text-white/55 mb-6 md:text-[14px] md:mb-8">월 구독</div>
            <ul className="list-none p-0 m-0 mb-7 flex flex-col gap-3 md:gap-3.5 md:mb-9">
              {PRO_ITEMS.map((item) => (
                <li key={item.text} className="text-[14px] text-white/90 flex items-center gap-[10px] md:text-[15px] md:gap-3">
                  <span className="text-[#6EE7B7] font-bold">✓</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <button className="w-full py-[14px] rounded-lg border-none font-inter text-[15px] font-bold cursor-pointer transition-opacity duration-200 hover:opacity-85 bg-white text-[#0A0A0A] md:py-4 md:rounded-lg md:text-[16px]">
              Pro 업그레이드
            </button>
            <div className="text-center text-[12px] text-white/45 mt-2.5 md:text-[13px] md:mt-3">언제든지 취소 가능</div>
          </div>
        </div>
      </div>
    </section>
  );
}
