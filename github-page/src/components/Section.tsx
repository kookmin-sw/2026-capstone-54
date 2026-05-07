import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  children: ReactNode;
  variant?: "default" | "muted" | "dark";
}

export default function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  variant = "default",
}: SectionProps) {
  const bg =
    variant === "muted"
      ? "bg-bg-soft text-fg"
      : variant === "dark"
        ? "bg-fg text-white"
        : "bg-canvas text-fg";

  const eyebrowStyle =
    variant === "dark"
      ? "bg-white/10 text-accent-mid"
      : "bg-accent-bg text-accent";

  const descStyle = variant === "dark" ? "text-white/70" : "text-muted";

  return (
    <section id={id} className={`scroll-mt-20 ${bg}`}>
      <div className="mx-auto w-full max-w-[1080px] px-5 py-20 md:px-10 md:py-24">
        <div className="mx-auto mb-12 max-w-3xl text-center" data-section-header>
          {eyebrow && (
            <div
              className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${eyebrowStyle}`}
            >
              {eyebrow}
            </div>
          )}
          <h2 className="font-display text-balance text-3xl font-black leading-tight tracking-[-1px] sm:text-4xl md:text-5xl">
            {title}
          </h2>
          {description && (
            <p
              className={`mt-4 whitespace-pre-line text-base leading-relaxed md:text-lg ${descStyle}`}
            >
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
