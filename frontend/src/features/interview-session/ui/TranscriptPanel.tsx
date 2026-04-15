import { useEffect, useRef } from "react";

interface TranscriptPanelProps {
  finalText: string;
  interimText: string;
  highlightedHtml: string;
  isListening: boolean;
}

export function TranscriptPanel({
  interimText,
  highlightedHtml,
  isListening,
}: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [highlightedHtml, interimText]);

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 flex flex-col gap-2 min-h-[120px] flex-1 h-full min-h-0">
      <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
        실시간 답변
      </div>
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 font-mono text-base leading-relaxed overflow-y-auto"
      >
        <span
          className="text-white"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
        <span className="text-indigo-300 italic animate-pulse ml-1">{interimText}</span>
        {!highlightedHtml && !interimText && !isListening && (
          <span className="text-slate-600 italic text-sm">답변이 여기에 표시됩니다...</span>
        )}
      </div>
    </div>
  );
}
