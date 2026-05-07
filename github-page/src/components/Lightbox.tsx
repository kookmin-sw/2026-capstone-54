import { useEffect, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface LightboxProps {
  src: string;
  alt: string;
  caption?: string;
  open: boolean;
  onClose: () => void;
}

export default function Lightbox({ src, alt, caption, open, onClose }: LightboxProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ startX: number; startY: number } | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + 0.25, 4));
      if (e.key === "-") setScale((s) => Math.max(s - 0.25, 0.5));
      if (e.key === "0") {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }, [open, src]);

  if (!open) return null;

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((s) => Math.min(Math.max(s + delta, 0.5), 4));
  };

  const onMouseDown: React.MouseEventHandler<HTMLImageElement> = (e) => {
    e.preventDefault();
    setDragging({ startX: e.clientX - translate.x, startY: e.clientY - translate.y });
  };

  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!dragging) return;
    setTranslate({ x: e.clientX - dragging.startX, y: e.clientY - dragging.startY });
  };

  const onMouseUp = () => setDragging(null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between border-b border-white/10 bg-black/40 px-5 py-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold md:text-base">{alt}</h3>
          {caption && (
            <p className="mt-0.5 truncate text-xs text-white/60 md:text-sm">{caption}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
            aria-label="축소"
            className="inline-flex size-9 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ZoomOut size={16} />
          </button>
          <span className="font-numeric inline-flex w-14 justify-center text-xs text-white/80 md:text-sm">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(s + 0.25, 4))}
            aria-label="확대"
            className="inline-flex size-9 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setScale(1);
              setTranslate({ x: 0, y: 0 });
            }}
            aria-label="원본 크기"
            className="ml-1 inline-flex size-9 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="ml-1 inline-flex size-9 items-center justify-center rounded-md bg-white/15 text-white transition-colors hover:bg-white/30"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onWheel={onWheel}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          onMouseDown={onMouseDown}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 0.18s ease-out",
            cursor: dragging ? "grabbing" : "grab",
          }}
          className="max-h-full max-w-full select-none object-contain shadow-2xl"
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-white/10 bg-black/40 px-5 py-2.5 text-[11px] text-white/55 md:text-xs">
        <span>닫기 <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">ESC</kbd></span>
        <span>확대 <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">+</kbd></span>
        <span>축소 <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">-</kbd></span>
        <span>원본 <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">0</kbd></span>
        <span>드래그로 이동, 마우스 휠로 확대/축소</span>
      </div>
    </div>
  );
}
