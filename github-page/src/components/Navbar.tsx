import { useEffect, useState } from "react";
import { ExternalLink, Github, Menu, X } from "lucide-react";
import { navLinks, team } from "../data";

const baseUrl = import.meta.env.BASE_URL;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        padding: scrolled ? "4px 16px" : "14px 16px",
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--color-border)" : "1px solid transparent",
      }}
    >
      <div
        className="mx-auto flex w-full max-w-[1080px] items-center justify-between transition-all duration-300"
        style={{
          background: scrolled ? "transparent" : "rgba(255,255,255,0.92)",
          backdropFilter: scrolled ? "none" : "blur(12px)",
          WebkitBackdropFilter: scrolled ? "none" : "blur(12px)",
          borderRadius: scrolled ? 0 : 8,
          border: scrolled ? "1px solid transparent" : "1px solid var(--color-border)",
          padding: scrolled ? "8px 0" : "10px 10px 10px 18px",
          boxShadow: scrolled ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <a href="#top" className="flex items-center" aria-label="meFit 홈">
          <img
            src={`${baseUrl}logo-korean.png`}
            alt="meFit"
            className="h-9 w-auto md:h-11"
            loading="eager"
            decoding="async"
          />
        </a>

        <ul className="hidden items-center gap-8 md:flex" role="list">
          {navLinks.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-sm font-medium text-muted transition-colors duration-200 hover:text-fg"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-1 md:flex">
          <a
            href={team.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-bg-soft hover:text-fg"
          >
            <Github size={14} />
            GitHub
          </a>
          <a
            href={team.demo}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-fg px-5 py-2 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-85"
          >
            사이트 방문
            <ExternalLink size={14} />
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-md text-fg transition-colors hover:bg-bg-soft md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="mx-auto mt-2 flex w-full max-w-[1080px] flex-col rounded-2xl border border-border bg-white p-4 shadow-sc md:hidden">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-3 text-sm font-medium text-fg transition-colors hover:bg-bg-soft"
            >
              {item.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2 border-t border-border pt-3">
            <a
              href={team.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-fg"
            >
              <Github size={14} />
              GitHub
            </a>
            <a
              href={team.demo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-fg px-3 py-2 text-sm font-bold text-white"
            >
              사이트 방문
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
