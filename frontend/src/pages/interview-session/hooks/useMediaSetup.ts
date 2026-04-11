import { useRef, useState } from "react";
import { WebSpeechSTTProvider } from "@/shared/lib/stt/WebSpeechSTTProvider";

export function useMediaSetup() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRafRef = useRef<number | null>(null);
  const sttRef = useRef<WebSpeechSTTProvider | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);

  const setupMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      // Audio meter
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
    // STT
    sttRef.current = new WebSpeechSTTProvider();
    sttRef.current.onResult((result) => {
      if (result.isFinal) { setFinalText((prev) => prev + (prev ? " " : "") + result.text); setInterimText(""); }
      else setInterimText(result.text);
    });
    sttRef.current.onError((e) => console.warn("STT 오류:", e));
    setMediaReady(true);
  };

  const cleanupMedia = () => {
    sttRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (audioRafRef.current) cancelAnimationFrame(audioRafRef.current);
    audioCtxRef.current?.close();
    analyserRef.current = null;
  };

  return {
    videoRef, sttRef, mediaStreamRef, audioRafRef,
    isListening, setIsListening,
    finalText, setFinalText,
    interimText, setInterimText,
    audioLevel, mediaReady,
    setupMedia, cleanupMedia,
  };
}
