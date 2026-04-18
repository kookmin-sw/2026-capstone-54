import { useEffect, useRef, useState } from "react";
import { Download, Video, Mic, AlertCircle } from "lucide-react";
import { recordingApi } from "../api/recordingApi";
import type { PlaybackUrlResponse } from "../api/recordingApi";

interface MediaPlayerProps {
  recordingId: string;
  mediaType: "video" | "audio";
  className?: string;
}

export function MediaPlayer({ recordingId, mediaType, className = "" }: MediaPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [playbackData, setPlaybackData] = useState<PlaybackUrlResponse | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  const loadMedia = async () => {
    try {
      setIsLoading(true);
      setError(false);
      const data = await recordingApi.playbackUrl(recordingId);
      setPlaybackData(data);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && !playbackData && !error) {
      loadMedia();
    }
  }, [isVisible, recordingId, playbackData, error]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center w-full aspect-video sm:aspect-[21/9] bg-[#F3F4F6] text-[#6B7280]">
          <AlertCircle className="w-8 h-8 mb-2 text-[#9CA3AF]" />
          <p className="text-sm font-medium">재생할 수 없습니다</p>
          <button
            onClick={loadMedia}
            className="mt-3 text-[12px] font-bold px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB] transition-colors"
          >
            다시 시도
          </button>
        </div>
      );
    }

    if (isLoading || !playbackData) {
      return (
        <div className="flex items-center justify-center w-full aspect-video sm:aspect-[21/9] bg-[#F3F4F6] animate-pulse">
          {mediaType === "video" ? (
            <Video className="w-8 h-8 text-[#D1D5DB]" />
          ) : (
            <Mic className="w-8 h-8 text-[#D1D5DB]" />
          )}
        </div>
      );
    }

    const { url, scaledUrl, audioUrl } = playbackData;

    if (mediaType === "video") {
      const src = scaledUrl || url;
      return (
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          className="w-full aspect-video object-contain bg-black"
        />
      );
    }

    const src = audioUrl || url;
    return (
      <div className="w-full p-4 flex items-center justify-center bg-white border-b border-[#E5E7EB]">
        <audio src={src} controls className="w-full max-w-md h-[40px]" />
      </div>
    );
  };

  const downloadUrl = playbackData?.url;

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden bg-[#F9FAFB] border border-[#E5E7EB] ${className}`}
    >
      {renderContent()}

      <div className="h-10 px-4 flex items-center justify-between bg-[#F9FAFB] border-t border-[#E5E7EB]">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#6B7280]">
          {mediaType === "video" ? (
            <><Video className="w-4 h-4" /> 비디오 답변</>
          ) : (
            <><Mic className="w-4 h-4" /> 오디오 답변</>
          )}
        </div>
        
        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            className="flex items-center gap-1 text-[12px] font-medium text-[#6B7280] hover:text-[#0991B2] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>다운로드</span>
          </a>
        )}
      </div>
    </div>
  );
}
