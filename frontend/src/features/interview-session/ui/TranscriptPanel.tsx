import { useEffect, useRef } from "react";

interface TranscriptPanelProps {
  finalText: string;
  interimText: string;
  highlightedHtml: string;
  isListening: boolean;
}

/**
 * Parses the limited HTML produced by SpeechAnalyzer (only
 * `<span class="bad-word">` and `<span class="filler-word">` tags)
 * into React elements, avoiding dangerouslySetInnerHTML / XSS risk.
 */
function parseHighlightedHtml(html: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /<span class="(bad-word|filler-word)">([^<]*)<\/span>/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push(html.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={key++} className={match[1]}>
        {match[2]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    parts.push(html.slice(lastIndex));
  }

  return parts;
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
        <span className="text-white">{parseHighlightedHtml(highlightedHtml)}</span>
        <span className="text-indigo-300 italic animate-pulse ml-1">{interimText}</span>
        {!highlightedHtml && !interimText && !isListening && (
          <span className="text-slate-600 italic text-sm">답변이 여기에 표시됩니다...</span>
        )}
      </div>
    </div>
  );
}
