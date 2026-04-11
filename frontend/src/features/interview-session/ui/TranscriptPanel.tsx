interface TranscriptPanelProps {
  finalText: string;
  interimText: string;
  highlightedHtml: string;
  isListening: boolean;
}

export function TranscriptPanel({ interimText, highlightedHtml, isListening }: TranscriptPanelProps) {
  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 flex flex-col gap-2 min-h-[120px]">
      <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">실시간 답변</div>
      <div className="flex-1 font-mono text-base leading-relaxed overflow-y-auto max-h-40">
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
