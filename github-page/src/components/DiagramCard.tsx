import { useState } from "react";
import { Maximize2 } from "lucide-react";
import Lightbox from "./Lightbox";

const baseUrl = import.meta.env.BASE_URL;

interface DiagramCardProps {
  image: string;
  title: string;
  desc: string;
  aspect?: "wide" | "tall";
}

export default function DiagramCard({ image, title, desc, aspect = "wide" }: DiagramCardProps) {
  const [open, setOpen] = useState(false);
  const aspectClass = aspect === "tall" ? "aspect-[3/4]" : "aspect-[4/3]";
  const src = `${baseUrl}${image}`;

  return (
    <>
      <figure className="overflow-hidden rounded-2xl border border-border bg-white shadow-sc transition-shadow duration-300 hover:shadow-sch">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${title} 다이어그램 크게 보기`}
          className={`group relative flex w-full ${aspectClass} items-center justify-center overflow-hidden bg-bg-soft p-3 transition-colors hover:bg-accent-bg/40`}
        >
          <img
            src={src}
            alt={title}
            loading="lazy"
            decoding="async"
            className="max-h-full w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span
            aria-hidden="true"
            className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-fg/85 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
          >
            <Maximize2 size={16} />
          </span>
          <span className="absolute bottom-3 left-3 rounded-full bg-fg/85 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm md:text-xs">
            클릭하여 크게 보기
          </span>
        </button>
        <figcaption className="border-t border-border p-5">
          <h4 className="font-display mb-1.5 text-sm font-bold text-fg">{title}</h4>
          <p className="text-xs leading-relaxed text-muted">{desc}</p>
        </figcaption>
      </figure>
      <Lightbox
        src={src}
        alt={title}
        caption={desc}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
