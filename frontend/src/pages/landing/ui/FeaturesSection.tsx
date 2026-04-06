const FEATURES = [
  { emoji: "🎥", title: "AI 화상 면접", desc: "실시간 화상으로 AI 면접관과 대화. 꼬리질문 방식과 전체 프로세스 방식 중 선택하세요.", badge: "Pro 핵심 기능" },
  { emoji: "📄", title: "이력서 분석", desc: "PDF·DOCX 업로드 즉시 AI가 분석해 맞춤 면접 질문을 생성합니다." },
  { emoji: "👁️", title: "시선 추적 분석", desc: "면접 중 시선 이탈 횟수와 집중도를 분석해 자신감 있는 태도를 만들어드립니다." },
  { emoji: "📊", title: "AI 리뷰 리포트", desc: "발음·전달력, 논리적 구성, 태도·자신감, 전문 용어 4개 영역 점수를 상세 분석합니다." },
  { emoji: "🔥", title: "스트릭 & 통계", desc: "연속 면접 일수와 연간 활동 기록으로 꾸준한 습관을 만들고 성장을 시각화하세요." },
];

const [featured, ...rest] = FEATURES;

export function FeaturesSection() {
  return (
    <section id="features" className="py-14 px-5 flex justify-center bg-white md:py-20 md:px-10">
      <div className="max-w-content w-full md:max-w-container">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-block text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] rounded px-[14px] py-[5px] mb-[14px] md:text-[13px] md:px-[18px] md:py-[6px]">
            핵심 기능
          </div>
          <h2 className="font-inter text-[28px] font-extrabold text-[#0A0A0A] mb-[10px] md:text-[clamp(32px,4vw,48px)]">
            면접 준비의 모든 것.
          </h2>
          <p className="text-[14px] text-[#6B7280] leading-[1.6] md:text-[15px]">
            이력서 분석부터 실전 화상 면접, AI 피드백까지 한 플랫폼에서.
          </p>
        </div>

        {/* 모바일: 세로 스택 / 데스크탑: 좌우 2컬럼 */}
        <div className="flex flex-col gap-3 md:flex-row md:gap-4 md:items-stretch">
          {/* 첫 번째 카드 (다크) */}
          <div className="bg-[#0A0A0A] rounded-lg px-5 py-6 relative shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-transform duration-200 hover:-translate-y-0.5 md:flex-1 md:rounded-lg md:px-9 md:py-10 md:flex md:flex-col md:justify-end md:min-h-[480px]">
            <span className="absolute top-4 right-4 text-[11px] font-bold text-[#0A0A0A] bg-white rounded px-[10px] py-[3px]">
              {featured.badge}
            </span>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[20px] mb-[14px] bg-white/12">
              {featured.emoji}
            </div>
            <h3 className="font-inter text-[16px] font-bold text-white mb-2 md:text-[22px]">{featured.title}</h3>
            <p className="text-[13px] text-white/72 leading-[1.65] md:text-[14px]">{featured.desc}</p>
          </div>

          {/* 나머지 카드들 */}
          <div className="flex flex-col gap-3 md:flex-1 md:grid md:grid-cols-2 md:gap-3">
            {rest.map((f) => (
              <div
                key={f.title}
                className="bg-[#F9FAFB] rounded-lg px-5 py-6 border border-[#E5E7EB] transition-transform duration-200 hover:-translate-y-0.5 md:rounded-lg md:px-6 md:py-7"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[20px] mb-[14px] bg-white border border-[#E5E7EB]">
                  {f.emoji}
                </div>
                <h3 className="font-inter text-[16px] font-bold text-[#0A0A0A] mb-2 md:text-[18px]">{f.title}</h3>
                <p className="text-[13px] text-[#6B7280] leading-[1.65] md:text-[14px]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
