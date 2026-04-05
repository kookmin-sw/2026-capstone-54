const TESTIMONIALS = [
  {
    name: "김서연",
    role: "프론트엔드 개발자 취준생",
    quote: "면접에서 항상 긴장했는데, meFit으로 연습하니까 실전에서 훨씬 자연스럽게 답변할 수 있었어요. 꼬리질문 기능이 진짜 실제 면접 같아요.",
    avatar: "👩‍💻",
  },
  {
    name: "박준혁",
    role: "백엔드 개발자 · 이직 준비",
    quote: "시선 추적 분석 덕분에 면접 중 시선이 자꾸 내려가는 습관을 고칠 수 있었습니다. 리포트가 정말 상세해서 좋았어요.",
    avatar: "👨‍💼",
  },
  {
    name: "이하은",
    role: "디자이너 · 신입",
    quote: "이력서 기반으로 질문이 나오니까 훨씬 실전적이에요. 3일 만에 면접 합격 연락 받았습니다!",
    avatar: "👩‍🎨",
  },
  {
    name: "정민수",
    role: "PM · 경력 3년차",
    quote: "스트릭 기능 덕분에 매일 꾸준히 연습하게 됐어요. AI 피드백이 생각보다 정확해서 놀랐습니다.",
    avatar: "🧑‍💻",
  },
];

export function TestimonialsSection() {
  return (
    <section id="reviews" className="py-16 px-5 flex justify-center bg-[#F9FAFB] md:py-25 md:px-10">
      <div className="max-w-[480px] w-full md:max-w-[1080px]">
        <div className="text-center mb-8 md:mb-14">
          <div className="inline-block text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] rounded px-[14px] py-[5px] mb-[14px] md:text-[13px] md:px-[18px] md:py-[6px] md:mb-[18px]">
            면접 후기
          </div>
          <h2 className="font-inter text-[clamp(24px,7vw,36px)] font-extrabold text-[#0A0A0A] md:text-[clamp(32px,4vw,52px)]">
            실제 사용자들의 이야기.
          </h2>
        </div>
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-lg px-5 py-6 border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] md:rounded-lg md:px-7 md:py-8"
            >
              <p className="text-[14px] text-[#374151] leading-[1.7] mb-4 md:text-[15px]">"{t.quote}"</p>
              <div className="flex items-center gap-[10px]">
                <span className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[18px] shrink-0">
                  {t.avatar}
                </span>
                <div>
                  <div className="font-inter text-[13px] font-bold text-[#0A0A0A] md:text-[14px]">{t.name}</div>
                  <div className="text-[12px] text-[#6B7280] md:text-[13px]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
