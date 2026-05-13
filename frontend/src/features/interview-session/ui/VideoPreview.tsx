import { useEffect, useRef } from "react";
import { Camera } from "lucide-react";

export interface VideoPreviewProps {
  stream: MediaStream | null;
  isRecording: boolean;
  className?: string;
}

export function VideoPreview({ stream, isRecording, className = "" }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-[#1a1a2e] aspect-video ${
        isRecording ? "ring-2 ring-green-500/50" : ""
      } ${className}`}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6B7280]">
          <Camera className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-[11px] font-medium">카메라 준비 중...</span>
        </div>
      )}
    </div>
  );
}
