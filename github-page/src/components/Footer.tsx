import { footerLegal, navLinks, team } from "../data";

const baseUrl = import.meta.env.BASE_URL;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-fg px-5 pt-12 pb-7 md:px-10 md:pt-16 md:pb-9">
      <div
        aria-hidden="true"
        className="font-display pointer-events-none absolute -bottom-[2vh] -left-[2vw] -right-[2vw] select-none whitespace-nowrap text-[clamp(80px,calc(8vh+12vw),260px)] font-black leading-[0.85] tracking-[-2px]"
        style={{
          color: "transparent",
          WebkitTextStroke: "1px rgba(9,145,178,0.32)",
          WebkitTextFillColor: "transparent",
        }}
      >
        meFit · 未fit
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1080px]">
        <div className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="min-w-0 flex-1">
            <img
              src={`${baseUrl}logo-korean.png`}
              alt="meFit"
              className="mb-3 h-9 w-auto md:mb-4 md:h-11"
              style={{ filter: "brightness(0) invert(1)" }}
              loading="lazy"
              decoding="async"
            />
            <p className="max-w-[500px] text-sm leading-[1.65] text-white/65 md:text-[15px]">
              未fit → meFit. 아직 면접 핏이 맞지 않는 나를, AI와 함께 완성해가는 플랫폼.
            </p>
            <p className="mt-3 text-xs text-white/45 md:text-sm">
              {team.course} · {team.name}
            </p>
          </div>

          <nav
            aria-label="푸터 네비게이션"
            className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end"
          >
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-white/70 transition-colors duration-200 hover:text-white md:text-[15px]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <span
          aria-hidden="true"
          className="mb-5 block h-px w-full rounded-full bg-gradient-to-r from-transparent via-accent/60 to-transparent md:mb-6"
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
          <span className="text-xs text-white/55 md:text-sm">
            © {year} meFit (미핏) · 김신건 · 김석준 · 김유진 · 이주현. All rights reserved.
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {footerLegal.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-white/55 transition-colors duration-200 hover:text-white/85 md:text-sm"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
