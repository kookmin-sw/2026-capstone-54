/** STT 음성 인식 테스트 카드 (다크 테마). */
import { useEffect, useRef, useState } from "react";
import { WebSpeechSTTProvider } from "@/shared/lib/stt/WebSpeechSTTProvider";
import { checkSttMatch, type SttMatchResult } from "@/shared/lib/voice/matchVoice";

const STT_TIMEOUT_MS = 8000;
type SttState = "idle" | "listening" | SttMatchResult;

export function SttTestCard() {
  const sttRef = useRef<WebSpeechSTTProvider | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<SttState>("idle");
  const [final, setFinal] = useState("");
  const [interim, setInterim] = useState("");

  useEffect(() => () => { sttRef.current?.stop(); if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const finish = () => {
    sttRef.current?.stop();
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setTimeout(() => setState((prev) => prev === "listening" ? "empty" : prev), 300);
  };

  const handleTest = () => {
    if (state === "listening") { finish(); return; }
    setFinal(""); setInterim(""); setState("listening");
    const stt = new WebSpeechSTTProvider();
    sttRef.current = stt;
    stt.onResult((r) => {
      if (r.isFinal) {
        setFinal((p) => {
          const next = p + (p ? " " : "") + r.text;
          setState(checkSttMatch(next));
          sttRef.current?.stop();
          if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
          return next;
        });
        setInterim("");
      } else setInterim(r.text);
    });
    stt.onError(() => { if (timerRef.current) clearTimeout(timerRef.current); setState((p) => p === "listening" ? "empty" : p); });
    stt.start("ko-KR");
    timerRef.current = setTimeout(finish, STT_TIMEOUT_MS);
  };

  const statusMsg = {
    idle: null, listening: null,
    match: <span className="text-[12px] font-semibold text-emerald-400">✓ 음성 인식이 정상 작동합니다</span>,
    mismatch: <span className="text-[12px] font-semibold text-amber-400">⚠ 다른 내용이 감지되었습니다. 다시 시도해보세요.</span>,
    empty: <span className="text-[12px] font-semibold text-red-400">✕ 음성이 인식되지 않았습니다. 마이크를 확인하세요.</span>,
  }[state];

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🎙️</span>
        <h3 className="text-[14px] font-extrabold text-slate-200">음성 인식 테스트</h3>
      </div>
      <p className="text-[12px] text-slate-400 leading-[1.5] mb-3">
        버튼을 누르고 <strong className="text-slate-200">"안녕하세요, 저는 지원자입니다"</strong>라고 말해주세요.
      </p>
      <button
        onClick={handleTest}
        className={`w-full py-3 rounded-lg font-bold text-[13px] border-none cursor-pointer transition-all ${state === "listening" ? "bg-red-500 text-white hover:bg-red-400" : "bg-slate-700 text-white hover:bg-slate-600"}`}
      >
        {state === "listening" ? "녹음 중지" : final ? "다시 테스트" : "말하기 테스트 시작"}
      </button>
      <div className="mt-3 min-h-[48px] bg-slate-900/60 border border-white/5 rounded-lg p-3">
        {final || interim ? (
          <p className="text-[13px] text-slate-200 leading-[1.5]">{final}{interim && <span className="text-slate-500"> {interim}</span>}</p>
        ) : (
          <p className="text-[12px] text-slate-600 italic">{state === "listening" ? "듣고 있습니다... (8초 후 자동 종료)" : "인식된 텍스트가 여기에 표시됩니다."}</p>
        )}
      </div>
      {statusMsg && <div className="mt-2">{statusMsg}</div>}
    </div>
  );
}
