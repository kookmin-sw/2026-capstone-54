import { useRef, useState, useCallback, type RefObject } from "react";
import { useInterviewSessionStore } from "@/features/interview-session";
import { initializeMediaPipe, getFaceLandmarker } from "@/shared/lib/mediapipe/MediaPipeService";
import { checkBehavioralFlags } from "@/shared/lib/mediapipe/AnalysisLogic";

export interface TurnVideoCounts {
  gazeAwayCount: number;
  headAwayCount: number;
}

export function useVideoAnalysis(videoRef: RefObject<HTMLVideoElement | null>) {
  const videoRafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const behavioralStateRef = useRef({ lookingAway: false, headTurned: false });

  const isCountingActiveRef = useRef(false);
  const gazeAwayCountRef = useRef(0);
  const headAwayCountRef = useRef(0);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [fps, setFps] = useState(0);
  const [gazeAwayCount, setGazeAwayCount] = useState(0);
  const [headAwayCount, setHeadAwayCount] = useState(0);

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

        if (isCountingActiveRef.current) {
          if (flags.lookingAway && !prev.lookingAway) {
            gazeAwayCountRef.current++;
            setGazeAwayCount(gazeAwayCountRef.current);
          }
          if (flags.headTurned && !prev.headTurned) {
            headAwayCountRef.current++;
            setHeadAwayCount(headAwayCountRef.current);
          }
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

  const startTurnCounting = useCallback(() => {
    gazeAwayCountRef.current = 0;
    headAwayCountRef.current = 0;
    setGazeAwayCount(0);
    setHeadAwayCount(0);
    behavioralStateRef.current = { lookingAway: false, headTurned: false };
    isCountingActiveRef.current = true;
  }, []);

  const stopTurnCounting = useCallback((): TurnVideoCounts => {
    isCountingActiveRef.current = false;
    return {
      gazeAwayCount: gazeAwayCountRef.current,
      headAwayCount: headAwayCountRef.current,
    };
  }, []);

  const resetWarnings = useCallback(() => {
    gazeAwayCountRef.current = 0;
    headAwayCountRef.current = 0;
    setGazeAwayCount(0);
    setHeadAwayCount(0);
    isCountingActiveRef.current = false;
    behavioralStateRef.current = { lookingAway: false, headTurned: false };
  }, []);

  const videoWarningCount = gazeAwayCount + headAwayCount;

  return {
    videoRafRef,
    isAnalyzing,
    isModelLoading,
    fps,
    videoWarningCount,
    gazeAwayCount,
    headAwayCount,
    startVideoAnalysis,
    stopVideoAnalysis,
    startTurnCounting,
    stopTurnCounting,
    resetWarnings,
  };
}
