const SERVICE_LINKS = ["면접 시작", "이력서 관리", "채용공고 연동", "스트릭", "요금제"];
const COMPANY_LINKS = ["소개", "채용", "블로그", "문의"];
const LEGAL_LINKS = ["개인정보처리방침", "이용약관", "쿠키 정책", "데이터 수집 동의"];

export function FooterSection() {
  return (
    <footer className="bg-[#0A0A0A] pt-12 pb-6 px-5 flex justify-center md:pt-16 md:pb-8 md:px-10">
      <div className="max-w-content w-full md:max-w-[1080px]">
        <div className="flex flex-col gap-8 mb-9 md:grid md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-10 md:mb-12">
          {/* 브랜드 */}
          <div>
            <div className="mb-[10px] md:mb-3">
              <img 
                src="/logo-korean.png" 
                alt="미핏" 
                className="h-[46px] w-auto md:h-[56px]"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
            <p className="text-[12px] text-white/40 leading-[1.7] mb-4 md:text-[13px] md:mb-5">
              未fit → meFit. 아직 면접 핏이 맞지 않는 나를,<br />AI와 함께 완성해가는 플랫폼.
            </p>
            <div className="flex gap-2">
              {["Twitter", "LinkedIn"].map((sns) => (
                <a
                  key={sns}
                  href="#"
                  className="text-[11px] font-semibold text-white/50 no-underline px-3 py-[5px] rounded border border-white/12 transition-[border-color,color] duration-200 hover:text-white hover:border-white/30 md:text-[12px] md:px-3.5 md:py-1.5"
                >
                  {sns}
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "서비스", links: SERVICE_LINKS },
            { title: "회사", links: COMPANY_LINKS },
            { title: "법적 고지", links: LEGAL_LINKS },
          ].map(({ title, links }) => (
            <div key={title}>
              <div className="text-[12px] font-bold text-white/60 mb-3 md:text-[13px] md:mb-4">{title}</div>
              <ul className="list-none p-0 m-0 flex flex-col gap-2 md:gap-[10px]">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[12px] text-white/35 no-underline transition-[color] duration-200 hover:text-white/70 md:text-[13px]"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-5 border-t border-white/8 flex flex-col gap-[10px] md:pt-6 md:flex-row md:justify-between md:items-center">
          <span className="text-[11px] text-white/22 md:text-[12px]">© 2026 meFit(미핏). All rights reserved.</span>
          <div className="flex gap-[14px] md:gap-4">
            {["개인정보", "이용약관", "쿠키"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[11px] text-white/22 no-underline transition-[color] duration-200 hover:text-white/50 md:text-[12px]"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
