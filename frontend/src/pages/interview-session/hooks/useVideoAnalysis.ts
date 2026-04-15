import { useRef, useState, useCallback, type RefObject } from "react";
import { useInterviewSessionStore } from "@/features/interview-session";
import { initializeMediaPipe, getFaceLandmarker } from "@/shared/lib/mediapipe/MediaPipeService";
import { checkBehavioralFlags } from "@/shared/lib/mediapipe/AnalysisLogic";

export function useVideoAnalysis(videoRef: RefObject<HTMLVideoElement | null>) {
  const videoRafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const videoWarningCountRef = useRef(0);
  const behavioralStateRef = useRef({ lookingAway: false, headTurned: false });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [fps, setFps] = useState(0);
  const [videoWarningCount, setVideoWarningCount] = useState(0);

  const runVideoLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video || !useInterviewSessionStore.getState().interviewPhase) return;
    const start = performance.now();
    if (lastVideoTimeRef.current !== video.currentTime) {
      lastVideoTimeRef.current = video.currentTime;
      const landmarker = getFaceLandmarker();
      if (landmarker) {
        const result = landmarker.detectForVideo(video, start);
        const flags = checkBehavioralFlags(result);
        const prev = behavioralStateRef.current;
        if ((flags.lookingAway && !prev.lookingAway) || (flags.headTurned && !prev.headTurned)) {
          videoWarningCountRef.current++;
          setVideoWarningCount(videoWarningCountRef.current);
        }
        behavioralStateRef.current = flags;
      }
    }
    setFps((prev) => (prev === 0 ? 24 : prev));
    videoRafRef.current = requestAnimationFrame(runVideoLoop);
  }, [videoRef]);

  const startVideoAnalysis = async () => {
    if (!videoRef.current) return;
    setIsModelLoading(true);
    try { await initializeMediaPipe(); setIsAnalyzing(true); runVideoLoop(); }
    catch { console.warn("MediaPipe 초기화 실패"); }
    finally { setIsModelLoading(false); }
  };

  const stopVideoAnalysis = () => {
    if (videoRafRef.current) { cancelAnimationFrame(videoRafRef.current); videoRafRef.current = null; }
  };

  const resetWarnings = () => {
    videoWarningCountRef.current = 0;
    setVideoWarningCount(0);
  };

  return {
    videoRafRef, isAnalyzing, isModelLoading, fps, videoWarningCount,
    startVideoAnalysis, stopVideoAnalysis, resetWarnings,
  };
}
