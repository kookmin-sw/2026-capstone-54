/** 사용자 idle 감지: 입력 + face presence 동시 부재 시간 측정. */
import { useCallback, useEffect, useRef, useState } from "react";

interface UseIdleDetectorOptions {
  enabled: boolean;
  thresholdMs: number;
  faceVisible: boolean;
}

interface UseIdleDetectorResult {
  isIdle: boolean;
  resetIdle: () => void;
}

const INPUT_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "wheel",
  "scroll",
];

export function useIdleDetector({ enabled, thresholdMs, faceVisible }: UseIdleDetectorOptions): UseIdleDetectorResult {
  const [isIdle, setIsIdle] = useState(false);
  const lastInputAtRef = useRef<number>(0);
  const lastFaceAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const now = Date.now();
    lastInputAtRef.current = now;
    lastFaceAtRef.current = now;

    const markInput = () => {
      lastInputAtRef.current = Date.now();
    };

    INPUT_EVENTS.forEach((evt) => window.addEventListener(evt, markInput, { passive: true }));
    return () => {
      INPUT_EVENTS.forEach((evt) => window.removeEventListener(evt, markInput));
    };
  }, [enabled]);

  useEffect(() => {
    if (faceVisible) {
      lastFaceAtRef.current = Date.now();
    }
  }, [faceVisible]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      const now = Date.now();
      const inputIdleMs = now - lastInputAtRef.current;
      const faceIdleMs = now - lastFaceAtRef.current;
      const both = inputIdleMs >= thresholdMs && faceIdleMs >= thresholdMs;
      setIsIdle((prev) => (prev !== both ? both : prev));
    }, 1000);
    return () => clearInterval(id);
  }, [enabled, thresholdMs]);

  const resetIdle = useCallback(() => {
    const now = Date.now();
    lastInputAtRef.current = now;
    lastFaceAtRef.current = now;
    setIsIdle(false);
  }, []);

  return { isIdle, resetIdle };
}
