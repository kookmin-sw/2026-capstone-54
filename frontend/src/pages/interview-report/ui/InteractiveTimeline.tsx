import { useEffect, useRef, useState } from "react";
import { recordingApi } from "@/features/interview-session/api/recordingApi";
import type { BehaviorAnalysis } from "@/features/interview-session";
import type { SpeechSegment } from "@/features/interview-session/api/types";

const DBFS_MIN = -60;
const DBFS_MAX = 0;
const CHART_H = 48;
const CHART_PADDING_TOP = 4;

function dbfsToY(dbfs: number): number {
  const clamped = Math.max(DBFS_MIN, Math.min(DBFS_MAX, dbfs));
  return CHART_PADDING_TOP + ((DBFS_MAX - clamped) / (DBFS_MAX - DBFS_MIN)) * (CHART_H - CHART_PADDING_TOP);
}

function DbfsAreaChart({
  timeline,
  totalDurationMs,
}: {
  timeline: NonNullable<BehaviorAnalysis["speechData"]>["timeline"];
  totalDurationMs: number;
}) {
  if (totalDurationMs === 0) return null;

  const toX = (ms: number) => (ms / totalDurationMs) * 100;

  const points: string[] = [];
  const fillPoints: string[] = [];

  for (const seg of timeline) {
    const x1 = toX(seg.startMs);
    const x2 = toX(seg.endMs);

    if (seg.type === "silence") {
      const yBottom = CHART_H;
      points.push(`${x1},${yBottom}`, `${x2},${yBottom}`);
      fillPoints.push(`${x1},${yBottom}`, `${x2},${yBottom}`);
    } else {
      const y = dbfsToY(seg.dbfs ?? DBFS_MIN);
      points.push(`${x1},${y}`, `${x2},${y}`);
      fillPoints.push(`${x1},${y}`, `${x2},${y}`);
    }
  }

  const polylineStr = points.join(" ");
  const lastX = toX(totalDurationMs);
  const fillStr = `0,${CHART_H} ${fillPoints.join(" ")} ${lastX},${CHART_H}`;

  const gridLines = [-10, -20, -30, -40, -50];

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-[#6B7280]">음량 (dBFS)</span>
      <svg viewBox={`0 0 100 ${CHART_H}`} preserveAspectRatio="none" className="w-full h-12">
        {gridLines.map((db) => (
          <line
            key={db}
            x1={0} y1={dbfsToY(db)} x2={100} y2={dbfsToY(db)}
            stroke="#F3F4F6" strokeWidth={0.3}
          />
        ))}

        <defs>
          <linearGradient id="dbfs-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity={0.4} />
            <stop offset="50%" stopColor="#D97706" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#DC2626" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <polygon points={fillStr} fill="url(#dbfs-fill)" />
        <polyline points={polylineStr} fill="none" stroke="#059669" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />

        {gridLines.map((db) => (
          <text
            key={`label-${db}`}
            x={1} y={dbfsToY(db) - 1}
            className="fill-[#9CA3AF]" fontSize={2.5}
          >
            {db}
          </text>
        ))}
      </svg>
    </div>
  );
}

interface InteractiveTimelineProps {
  recordingId?: string;
  mediaType?: string;
  speechData: BehaviorAnalysis["speechData"] | null;
  speechSegments: SpeechSegment[];
}

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function InteractiveTimeline({
  recordingId,
  mediaType,
  speechData,
  speechSegments,
}: InteractiveTimelineProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  useEffect(() => {
    if (!recordingId) return;
    recordingApi.playbackUrl(recordingId).then(data => {
      setVideoUrl(data.scaledUrl || data.url);
      setAudioUrl(data.audioUrl || data.url);
    }).catch((err) => { console.error("Failed to load playback URL:", err); });
  }, [recordingId]);

  if (!speechData?.summary || !speechData?.timeline) return null;

  const { summary, timeline } = speechData;
  const { totalDurationMs } = summary;

  if (totalDurationMs <= 0 || timeline.length === 0) return null;

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTimeMs(mediaRef.current.currentTime * 1000);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = clickX / rect.width;
    const seekTimeMs = percentage * totalDurationMs;
    mediaRef.current.currentTime = seekTimeMs / 1000;
    setCurrentTimeMs(seekTimeMs);
  };

  const currentSegment = speechSegments.find(
    (seg) => currentTimeMs >= seg.startMs && currentTimeMs <= seg.endMs
  );

  const getSilenceColor = (ratio: number) => {
    if (ratio < 0.15) return "text-[#059669]";
    if (ratio <= 0.3) return "text-[#D97706]";
    return "text-[#DC2626]";
  };

  const silenceRatioPct = Math.round(summary.silenceRatio * 100);
  const cursorLeftPct = totalDurationMs > 0 ? (currentTimeMs / totalDurationMs) * 100 : 0;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-4 mt-4">
      {/* 1. Header & Stats (Always visible in both modes) */}
      <div className="flex justify-between items-start">
        <h4 className="text-[10px] font-bold uppercase tracking-wide text-[#0991B2]">음성 및 행동 분석</h4>
        <div className="flex gap-4 text-[10px] text-[#6B7280]">
          <div className="flex flex-col items-end">
            <span>총 시간</span>
            <span className="text-[11px] font-bold text-gray-900">{formatDuration(summary.totalDurationMs)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span>발화 시간</span>
            <span className="text-[11px] font-bold text-gray-900">{formatDuration(summary.speechDurationMs)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span>침묵 횟수</span>
            <span className="text-[11px] font-bold text-gray-900">{summary.silenceSegmentCount}회</span>
          </div>
          <div className="flex flex-col items-end">
            <span>평균 음량</span>
            <span className="text-[11px] font-bold text-gray-900">
              {summary.avgDbfsSpeech !== null ? `${summary.avgDbfsSpeech.toFixed(1)} dBFS` : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Video Player (Interactive mode only) */}
      {recordingId && (videoUrl || audioUrl) && (
        <div className="w-full aspect-video sm:aspect-[21/9] bg-black rounded-xl overflow-hidden print:hidden shrink-0 flex items-center justify-center">
          {mediaType === "video" ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={videoUrl || undefined}
              controls
              playsInline
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={audioUrl || videoUrl || undefined}
              controls
              className="w-full h-[40px]"
              onTimeUpdate={handleTimeUpdate}
            />
          )}
        </div>
      )}

      {/* 3. Waveform and Silence Bars */}
      <div className="flex gap-6 items-center">
        {/* Gauge (Always visible) */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[10px] text-[#6B7280]">침묵 비율</span>
          <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
            <svg viewBox="0 0 36 36" className="absolute w-full h-full -rotate-90">
              <path
                className="text-gray-200"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className={getSilenceColor(summary.silenceRatio)}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${silenceRatioPct}, 100`}
              />
            </svg>
            <span className={`text-[11px] font-bold ${getSilenceColor(summary.silenceRatio)}`}>
              {silenceRatioPct}%
            </span>
          </div>
        </div>

        {/* Timelines */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden relative">
          
          {/* Interactive Playback Cursor (Interactive mode only) */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-[#DC2626] z-10 print:hidden transition-all duration-75 pointer-events-none"
            style={{ left: `${cursorLeftPct}%` }}
          />

          {/* Interactive Click Overlay (Interactive mode only) */}
          <div 
            className="absolute inset-0 z-20 cursor-pointer print:hidden"
            onClick={handleTimelineClick}
          />

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#6B7280]">발화/침묵 구간</span>
            <div className="h-4 flex rounded-full overflow-hidden bg-gray-100 w-full group">
              {timeline.map((seg, idx) => {
                const widthPct = ((seg.endMs - seg.startMs) / totalDurationMs) * 100;
                const label = seg.type === "speech" ? "발화" : "침묵";
                return (
                  <div
                    key={idx}
                    className={`h-full relative ${seg.type === "speech" ? "bg-[#059669]" : "bg-gray-300"}`}
                    style={{ width: `${widthPct}%` }}
                    title={`${label}: ${formatDuration(seg.startMs)} - ${formatDuration(seg.endMs)}`}
                  />
                );
              })}
            </div>
          </div>

          <DbfsAreaChart timeline={timeline} totalDurationMs={totalDurationMs} />
        </div>
      </div>

      {/* 4. STT Text Display (Interactive mode only) */}
      <div className="bg-[#F9FAFB] rounded-lg p-3 border border-[#E5E7EB] min-h-[60px] flex items-center justify-center print:hidden">
        {currentSegment ? (
          <p className="text-[13px] text-gray-900 leading-relaxed text-center font-medium">
            "{currentSegment.text}"
          </p>
        ) : (
          <p className="text-[13px] text-gray-400 italic text-center">
            (침묵)
          </p>
        )}
      </div>

    </div>
  );
}
