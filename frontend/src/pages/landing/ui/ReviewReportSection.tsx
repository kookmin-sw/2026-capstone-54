const REPORTS = [
  {
    num: "01",
    badge: "발음 / 전달력",
    title: "말하는 방식까지 분석",
    desc: "답변 명확성, 발음, 속도, 전달력을 점수화해 구체적인 개선 방향을 제시합니다.",
  },
  {
    num: "02",
    title: "영역별 점수 리포트",
    desc: "발음·전달력 / 논리적 구성 / 태도·자신감 / 전문 용어 활용 4개 영역을 세밀하게 평가합니다.",
  },
  {
    num: "03",
    title: "꼬리질문 AI 대화",
    desc: "답변에 따라 실시간으로 꼬리질문을 생성. 실제 면접관처럼 자연스러운 대화 흐름을 만듭니다.",
  },
];

export function ReviewReportSection() {
  return (
    <section className="py-16 px-5 flex justify-center bg-[#F9FAFB] md:py-25 md:px-10">
      <div className="max-w-content w-full md:max-w-container">
        <div className="text-center mb-8 md:mb-14">
          <div className="inline-block text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] rounded px-[14px] py-[5px] mb-[14px] md:text-[13px] md:px-[18px] md:py-[6px] md:mb-[18px]">
            AI 리뷰 리포트
          </div>
          <h2 className="font-inter text-[clamp(24px,7vw,36px)] font-extrabold text-[#0A0A0A] md:text-[clamp(32px,4vw,52px)]">
            면접 후, 더 정확한 피드백.
          </h2>
        </div>
        <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-4">
          {REPORTS.map((r) => (
            <div
              key={r.num}
              className="bg-white rounded-lg px-6 py-7 border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-transform duration-200 hover:-translate-y-0.5 md:rounded-lg md:px-8 md:py-9"
            >
              <div className="flex items-center gap-[10px] mb-4 md:mb-5">
                <span className="text-[12px] font-bold text-[#D1D5DB] md:text-[13px]">{r.num}</span>
                {r.badge && (
                  <span className="text-[11px] font-bold text-[#059669] bg-[#ECFDF5] rounded px-[10px] py-[3px] md:text-[11px] md:px-3 md:py-1">
                    {r.badge}
                  </span>
                )}
              </div>
              <h3 className="font-inter text-[16px] font-bold text-[#0A0A0A] mb-2 md:text-[18px] md:mb-3">{r.title}</h3>
              <p className="text-[13px] text-[#6B7280] leading-[1.7] md:text-[14px]">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
