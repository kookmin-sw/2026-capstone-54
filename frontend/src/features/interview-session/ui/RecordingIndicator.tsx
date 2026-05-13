import { useEffect, useRef, useState } from "react";

export interface RecordingIndicatorProps {
  isRecording: boolean;
  isPaused?: boolean;
  className?: string;
}

export function RecordingIndicator({ isRecording, isPaused = false, className = "" }: RecordingIndicatorProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(0);
  const pausedAccumRef = useRef(0);
  const pauseStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording) {
      setElapsedSeconds(0); // eslint-disable-line react-hooks/set-state-in-effect -- reset on stop
      startTimeRef.current = 0;
      pausedAccumRef.current = 0;
      pauseStartedAtRef.current = null;
      return;
    }
    startTimeRef.current = Date.now();
    pausedAccumRef.current = 0;
    pauseStartedAtRef.current = null;
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      if (pauseStartedAtRef.current !== null) return;
      const elapsed = Date.now() - startTimeRef.current - pausedAccumRef.current;
      setElapsedSeconds(Math.floor(elapsed / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) return;
    if (isPaused && pauseStartedAtRef.current === null) {
      pauseStartedAtRef.current = Date.now();
    } else if (!isPaused && pauseStartedAtRef.current !== null) {
      pausedAccumRef.current += Date.now() - pauseStartedAtRef.current;
      pauseStartedAtRef.current = null;
    }
  }, [isPaused, isRecording]);

  if (!isRecording) return null;

  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");

  const labelText = isPaused ? "PAUSED" : "REC";
  const indicatorColor = isPaused ? "#94A3B8" : "#DC2626";
  const bgColor = isPaused ? "rgba(148,163,184,0.1)" : "rgba(220,38,38,0.1)";
  const dotAnimation = isPaused ? "" : "animate-pulse";

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <div className={`w-2.5 h-2.5 rounded-full ${dotAnimation}`} style={{ backgroundColor: indicatorColor }} />
      <span className="text-[11px] font-extrabold tracking-wider" style={{ color: indicatorColor }}>{labelText}</span>
      <span className="text-[11px] font-mono font-bold" style={{ color: indicatorColor }}>
        {minutes}:{seconds}
      </span>
    </div>
  );
}
