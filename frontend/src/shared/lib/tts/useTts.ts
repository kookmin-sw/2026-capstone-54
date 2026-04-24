import { useState, useRef, useCallback, useEffect } from "react";
import { fetchWithAuth } from "@/shared/api/client";

export const VOICE_API_BASE =
  import.meta.env.VITE_VOICE_API_BASE_URL || "https://voice-api.mefit.kr/voice-api/api/v1";
const VOICE_API_PATH = "/voice-api/api/v1/tts";
export const TTS_DEFAULT_VOICE = "ko-KR-InJoonNeural";

export interface UseTtsReturn {
  ttsPlaying: boolean;
  ttsMuted: boolean;
  setTtsMuted: (v: boolean) => void;
  ttsVolume: number;
  setTtsVolume: (v: number) => void;
  playTtsText: (text: string) => Promise<void>;
  skipTts: () => void;
  destroyTts: () => void;
}

export function useTts(): UseTtsReturn {
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsMuted, setTtsMuted] = useState(false);
  const [ttsVolume, setTtsVolume] = useState(80);

  // Stable refs so callbacks always see current values
  const ttsMutedRef = useRef(false);
  const ttsVolumeRef = useRef(80);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  useEffect(() => { ttsMutedRef.current = ttsMuted; }, [ttsMuted]);
  useEffect(() => {
    ttsVolumeRef.current = ttsVolume;
    if (gainRef.current) gainRef.current.gain.value = ttsVolume / 100;
  }, [ttsVolume]);

  const _stopInternal = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    try { sourceRef.current?.stop(); } catch { /* already stopped */ }
    sourceRef.current = null;
  }, []);

  const skipTts = useCallback(() => {
    // Save callback before stopping — source.onended may fire and null it
    const cb = resolveRef.current;
    resolveRef.current = null;
    _stopInternal();
    setTtsPlaying(false);
    cb?.();
  }, [_stopInternal]);

  const playTtsText = useCallback((text: string): Promise<void> => {
    skipTts(); // cancel any in-progress playback (resolves previous promise)
    if (ttsMutedRef.current || !text.trim()) return Promise.resolve();

    return new Promise<void>((resolve) => {
      resolveRef.current = resolve;

      (async () => {
        try {
          setTtsPlaying(true);
          const abort = new AbortController();
          abortRef.current = abort;

          const res = await fetchWithAuth(VOICE_API_PATH, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              language: "ko",
              voice: TTS_DEFAULT_VOICE,
              rate: "+0%",
              volume: "+0%",
              pitch: "+0Hz",
            }),
            signal: abort.signal,
          });

          if (!res.ok) throw new Error(`TTS ${res.status}`);
          const data = await res.json() as { audio_base64: string };

          // Decode base64 → Uint8Array
          const binary = atob(data.audio_base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

          // Play via Web Audio API (for gain control)
          if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
            audioCtxRef.current = new AudioContext();
          }
          const ctx = audioCtxRef.current;
          // slice(0) creates a copy so decodeAudioData can detach the buffer
          const buffer = await ctx.decodeAudioData(bytes.buffer.slice(0));

          const gain = ctx.createGain();
          gain.gain.value = ttsVolumeRef.current / 100;
          gainRef.current = gain;
          gain.connect(ctx.destination);

          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(gain);
          sourceRef.current = source;

          source.onended = () => {
            const cb = resolveRef.current;
            resolveRef.current = null;
            setTtsPlaying(false);
            cb?.();
          };

          source.start();
        } catch (e) {
          if ((e as Error)?.name !== "AbortError") {
            console.warn("TTS playback error:", e);
          }
          const cb = resolveRef.current;
          resolveRef.current = null;
          setTtsPlaying(false);
          cb?.();
        }
      })();
    });
  }, [skipTts]);

  const destroyTts = useCallback(() => {
    skipTts();
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
  }, [skipTts]);

  return {
    ttsPlaying,
    ttsMuted,
    setTtsMuted,
    ttsVolume,
    setTtsVolume,
    playTtsText,
    skipTts,
    destroyTts,
  };
}
