/** 면접관 TTS 음성 테스트 카드 (다크 테마). */
import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import {
  getAccessToken,
} from "@/shared/api/client";
import { VOICE_API_BASE, TTS_DEFAULT_VOICE } from "@/shared/lib/tts/useTts";

export function TtsTestCard() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }, []);

  const handleTest = async () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setLoading(true); setError(false); setDone(false);
    try {
      const token = getAccessToken();
      const res = await fetch(`${VOICE_API_BASE}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
        body: JSON.stringify({ text: "안녕하세요, 저는 AI 면접관입니다. 오늘 면접에서 좋은 결과 있으시길 바랍니다.", language: "ko", voice: TTS_DEFAULT_VOICE, rate: "+0%", volume: "+0%", pitch: "+0Hz" }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const data = await res.json() as { audio_base64: string };
      const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
      audioRef.current = audio;
      audio.onended = () => { setDone(true); setLoading(false); };
      audio.onerror = () => { setError(true); setLoading(false); };
      await audio.play();
    } catch { setError(true); setLoading(false); }
  };

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 size={18} className="text-slate-400 shrink-0" />
        <h3 className="text-[14px] font-extrabold text-slate-200">면접관 음성 테스트</h3>
      </div>
      <p className="text-[12px] text-slate-400 leading-[1.5] mb-3">버튼을 눌러 음성이 잘 들리는지 확인하세요.</p>
      <button onClick={handleTest} disabled={loading} className="w-full py-3 rounded-lg font-bold text-[13px] border-none cursor-pointer transition-all disabled:opacity-50 bg-cyan-600 text-white hover:enabled:bg-cyan-500">
        {loading ? "재생 중..." : done ? "다시 재생하기" : "테스트 음성 재생"}
      </button>
      {done && <div className="mt-2 text-[12px] font-semibold text-emerald-400">✓ 음성이 정상적으로 재생되었습니다</div>}
      {error && <div className="mt-2 text-[12px] font-semibold text-red-400">✕ 재생 실패. 스피커를 확인하세요.</div>}
    </div>
  );
}
