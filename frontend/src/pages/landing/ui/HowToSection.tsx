const STEPS = [
  { num: "01", title: "면접 설정", desc: "이력서 선택, 면접 유형·시간·모드 설정", label: "1 설정" },
  { num: "02", title: "사전 환경 점검", desc: "카메라·마이크·네트워크 자동 점검", label: "2 점검" },
  { num: "03", title: "면접 진행 & 결과 확인", desc: "AI 면접 후 즉시 영역별 점수 리포트 제공", label: "3 면접" },
];

const TAGS = ["꼬리질문 방식", "전체 프로세스 방식", "연습 / 실전 모드", "15분 ~ 60분"];

export function HowToSection() {
  return (
    <section id="how-to" className="py-16 px-5 flex justify-center bg-white md:py-25 md:px-10">
      <div className="max-w-content w-full flex flex-col gap-6 md:max-w-[820px] md:gap-10">
        {/* 좌측 */}
        <div className="flex flex-col">
          <div className="inline-block text-[12px] font-bold text-[#0991B2] bg-[#E6F7FA] rounded px-[14px] py-[5px] mb-[14px] self-start md:text-[13px] md:px-[18px] md:py-[6px] md:mb-[18px]">
            이용 방법
          </div>
          <h2 className="font-plex-sans-kr text-[clamp(28px,8vw,40px)] font-extrabold text-[#0A0A0A] mb-3 leading-[1.1] md:text-[clamp(32px,4vw,52px)] md:mb-4">
            3단계로 끝나는<br />AI 면접.
          </h2>
          <p className="text-[14px] text-[#6B7280] leading-[1.65] mb-6 md:text-[15px] md:mb-10">
            복잡한 설정 없이, 이력서 업로드부터 결과 확인까지 15분이면 충분합니다.
          </p>
          <div className="flex flex-col gap-2">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="flex items-center gap-[14px] bg-[#F9FAFB] rounded-lg px-[18px] py-4 border border-[#E5E7EB] transition-transform duration-200 hover:-translate-y-0.5 md:gap-[18px] md:rounded-lg md:px-6 md:py-5"
              >
                <div className="w-9 h-9 rounded-lg shrink-0 bg-[#0A0A0A] flex items-center justify-center text-[12px] font-extrabold text-white md:w-10 md:h-10 md:rounded-lg md:text-[13px]">
                  {step.num}
                </div>
                <div className="flex-1">
                  <div className="font-plex-sans-kr text-[14px] font-bold text-[#0A0A0A] mb-0.5 md:text-[15px] md:mb-[3px]">{step.title}</div>
                  <div className="text-[12px] text-[#6B7280] md:text-[13px]">{step.desc}</div>
                </div>
                <div className="text-[11px] font-semibold text-[#0991B2] bg-[#E6F7FA] rounded px-[10px] py-1 shrink-0 md:text-[12px] md:px-3">
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 다크 카드 */}
        <div className="bg-[#0A0A0A] rounded-lg px-7 py-8 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] md:rounded-lg md:px-11 md:py-12">
          <div className="text-[32px] mb-4 md:text-[36px] md:mb-5">🎙️</div>
          <h3 className="font-plex-sans-kr text-[22px] font-extrabold text-white mb-3 leading-[1.25] md:text-[26px] md:mb-4">
            연습 모드부터<br />실전 모드까지.
          </h3>
          <p className="text-[13px] text-white/65 leading-[1.7] mb-5 md:text-[14px] md:mb-7">
            준비 완료 버튼을 눌러 시작하는 연습 모드, 5~30초 랜덤 대기 후 자동 시작되는 실전 모드. 나에게 맞는 방식으로 연습하세요.
          </p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold text-white/80 bg-white/10 rounded px-3 py-[5px] border border-white/12 md:text-[12px] md:px-3.5 md:py-1.5"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
