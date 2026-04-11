import { useRef, useState, useCallback } from "react";
import { WebSpeechSTTProvider } from "@/shared/lib/stt/WebSpeechSTTProvider";

/**
 * Manages camera/mic stream, audio level metering, and STT provider.
 * Returns state values and refs separately to satisfy react-hooks/refs lint rule.
 */
export function useMediaSetup() {
  // ── Refs (not used in render / dependency arrays) ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRafRef = useRef<number | null>(null);
  const sttRef = useRef<WebSpeechSTTProvider | null>(null);

  // ── State (safe for render / dependency arrays) ──
  const [isListening, setIsListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);

  const setupMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      try {
        audioCtxRef.current = new AudioContext();
        const source = audioCtxRef.current.createMediaStreamSource(stream);
        const analyser = audioCtxRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const drawMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(Math.min(100, (avg / 128) * 100));
          audioRafRef.current = requestAnimationFrame(drawMeter);
        };
        drawMeter();
      } catch { /* AudioContext unavailable */ }
    } catch { console.warn("미디어 장치 접근 실패"); }

    sttRef.current = new WebSpeechSTTProvider();
    sttRef.current.onResult((result) => {
      if (result.isFinal) { setFinalText((prev) => prev + (prev ? " " : "") + result.text); setInterimText(""); }
      else setInterimText(result.text);
    });
    sttRef.current.onError((e) => console.warn("STT 오류:", e));
    setMediaReady(true);
  }, []);

  const cleanupMedia = useCallback(() => {
    sttRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (audioRafRef.current) cancelAnimationFrame(audioRafRef.current);
    audioCtxRef.current?.close();
    analyserRef.current = null;
  }, []);

  const startStt = useCallback((lang = "ko-KR") => {
    sttRef.current?.start(lang);
    setIsListening(true);
  }, []);

  const stopStt = useCallback(() => {
    sttRef.current?.stop();
    setIsListening(false);
  }, []);

  const resetText = useCallback(() => {
    setFinalText("");
    setInterimText("");
  }, []);

  return {
    // Refs — only pass to ref= props or use inside callbacks/effects
    videoRef,
    sttRef,
    // State — safe for render and dependency arrays
    isListening,
    finalText,
    interimText,
    audioLevel,
    mediaReady,
    // Setters
    setIsListening,
    setFinalText,
    setInterimText,
    // Actions
    setupMedia,
    cleanupMedia,
    startStt,
    stopStt,
    resetText,
  };
}
