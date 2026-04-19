import { useEffect, useRef, useState } from "react";

export interface RecordingIndicatorProps {
  isRecording: boolean;
  className?: string;
}

export function RecordingIndicator({ isRecording, className = "" }: RecordingIndicatorProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!isRecording) {
      setElapsedSeconds(0); // eslint-disable-line react-hooks/set-state-in-effect -- reset on stop
      return;
    }
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);  
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isRecording) return null;

  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(220,38,38,0.1)] ${className}`}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-pulse" />
      <span className="text-[11px] font-extrabold text-[#DC2626] tracking-wider">REC</span>
      <span className="text-[11px] font-mono font-bold text-[#DC2626]">
        {minutes}:{seconds}
      </span>
    </div>
  );
}
