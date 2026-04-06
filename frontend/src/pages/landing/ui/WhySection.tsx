const REASONS = [
  {
    emoji: "🎯",
    title: "이력서 기반 맞춤 질문",
    desc: "이력서를 업로드하면 AI가 직무와 경력에 맞는 맞춤형 질문을 생성합니다. 일반적인 예상 질문이 아닌, 나에게 딱 맞는 질문으로 준비하세요.",
    featured: true,
  },
  { emoji: "🔄", title: "꼬리질문 AI", desc: "답변 내용에 따라 AI가 실시간으로 꼬리질문을 생성해 실제 면접과 똑같은 긴장감을 경험할 수 있습니다." },
  { emoji: "👁️", title: "시선 추적 분석", desc: "면접 중 시선 이탈 횟수를 측정해 자신감 있는 면접 태도를 만들 수 있도록 구체적인 피드백을 제공합니다." },
  { emoji: "📊", title: "영역별 점수 리포트", desc: "발음·전달력, 논리적 구성, 태도·자신감, 전문 용어 활용 총 4개 영역을 수치로 확인하고 개선하세요." },
  { emoji: "🔥", title: "스트릭으로 습관 형성", desc: "연속 면접 일수와 연간 활동 기록으로 꾸준한 면접 연습 습관을 만들고 성장 과정을 시각화하세요." },
  { emoji: "⚡", title: "24/7 언제든 면접", desc: "면접관 일정에 맞출 필요 없이 내가 원하는 시간에, 원하는 장소에서 면접 연습을 시작하세요." },
  { emoji: "🏢", title: "채용공고 연동", desc: "지원하는 채용공고를 등록하면 해당 직무에 최적화된 면접 질문으로 연습할 수 있습니다." },
];

const [featured, ...rest] = REASONS;

export function WhySection() {
  return (
    <section id="why" className="py-16 px-5 flex justify-center bg-white md:py-25 md:px-10">
      <div className="max-w-content w-full md:max-w-container">
        <div className="mb-8 md:mb-14">
          <div className="inline-block text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] rounded px-[14px] py-[5px] mb-3 md:text-[13px] md:px-[18px] md:py-[6px] md:mb-[18px]">
            왜 MEFIT
          </div>
          <h2 className="font-inter text-[clamp(28px,8vw,40px)] font-extrabold text-[#0A0A0A] md:text-[clamp(32px,4vw,52px)]">
            선택해야 할 이유.
          </h2>
        </div>

        {/* Featured 카드 */}
        <div className="bg-[#0A0A0A] rounded-lg px-7 py-8 mb-3 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] flex gap-6 items-center transition-transform duration-200 hover:-translate-y-0.5 md:rounded-lg md:px-10 md:py-11 md:mb-4 md:grid md:grid-cols-[1fr_2fr] md:gap-8">
          <div className="flex-1">
            <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center text-[22px] mb-4 md:w-[52px] md:h-[52px] md:rounded-lg md:text-[26px] md:mb-5">
              {featured.emoji}
            </div>
            <h3 className="font-inter text-[18px] font-extrabold text-white mb-[10px] md:text-[22px] md:mb-3">
              {featured.title}
            </h3>
            <p className="text-[13px] text-white/65 leading-[1.7] md:text-[14px]">{featured.desc}</p>
          </div>
          <div className="hidden md:block" />
        </div>

        {/* 나머지 카드 */}
        <div className="flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-3">
          {rest.map((r) => (
            <div
              key={r.title}
              className="bg-[#F9FAFB] rounded-lg px-5 py-6 border border-[#E5E7EB] transition-transform duration-200 hover:-translate-y-0.5 md:rounded-lg md:px-7 md:py-8"
            >
              <div className="text-[22px] mb-3 md:text-[26px] md:mb-3.5">{r.emoji}</div>
              <h3 className="font-inter text-[14px] font-bold text-[#0A0A0A] mb-1.5 md:text-[16px] md:mb-2">{r.title}</h3>
              <p className="text-[13px] text-[#6B7280] leading-[1.65] md:leading-[1.7]">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
