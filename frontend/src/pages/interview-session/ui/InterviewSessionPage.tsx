import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useInterviewSessionStore, FOLLOWUP_TOTAL_QUESTIONS } from "@/features/interview-session";
import { AvatarSection } from "@/features/interview-session/ui/AvatarSection";
import { QuestionPanel } from "@/features/interview-session/ui/QuestionPanel";
import { TranscriptPanel } from "@/features/interview-session/ui/TranscriptPanel";
import { BehaviorMetrics } from "@/features/interview-session/ui/BehaviorMetrics";
import { SpeechAnalyzer } from "@/shared/lib/speech/SpeechAnalyzer";
import { useTts } from "@/shared/lib/tts/useTts";
import type { IAvatarProvider } from "@/shared/lib/avatar/IAvatarProvider";
import type { AnswerState } from "@/features/interview-session";

import { useMediaSetup } from "../hooks/useMediaSetup";
import { useVideoAnalysis } from "../hooks/useVideoAnalysis";
import { usePermissionMonitor } from "../hooks/usePermissionMonitor";
import { useScreenSize } from "../hooks/useScreenSize";
import { SessionHeader } from "./SessionHeader";
import { SessionActionPanel } from "./SessionActionPanel";
import { PermissionOverlay } from "./PermissionOverlay";
import { ScreenSizeOverlay } from "./ScreenSizeOverlay";
import { FinishConfirmModal } from "./FinishConfirmModal";

export function InterviewSessionPage() {
  const { interviewSessionUuid } = useParams<{ interviewSessionUuid: string }>();
  const navigate = useNavigate();

  const {
    interviewSession, interviewTurns, currentInterviewTurn, currentInterviewTurnIndex,
    interviewPhase, interviewError,
    loadInterviewSession, startInterview, submitInterviewAnswer, resetInterviewSession,
  } = useInterviewSessionStore();

  const practiceMode = interviewSession?.interviewPracticeMode ?? "practice";
  const isRealMode = practiceMode === "real";
  const isRealModeRef = useRef(isRealMode);
  useEffect(() => { isRealModeRef.current = isRealMode; }, [isRealMode]);

  const { ttsPlaying, ttsMuted, setTtsMuted, ttsVolume, setTtsVolume, playTtsText, skipTts, destroyTts } = useTts();

  const {
    videoRef,
    isListening, finalText, interimText, audioLevel, mediaReady,
    setupMedia, cleanupMedia, startStt, stopStt, resetText,
  } = useMediaSetup();

  const video = useVideoAnalysis(videoRef);
  const { screenSize, isTooSmall } = useScreenSize();

  const avatarRef = useRef<IAvatarProvider | null>(null);
  const prevTurnIdRef = useRef<number | null>(null);
  const speechAnalyzerRef = useRef(new SpeechAnalyzer());
  const hasStartedRef = useRef(false);

  const [hasStarted, setHasStarted] = useState(false);
  const [answerState, setAnswerState] = useState<AnswerState>("waiting_ready");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [speechMetrics, setSpeechMetrics] = useState({ wpm: 0, fillerCount: 0, badWordCount: 0, pauseWarnings: 0, highlightedHtml: "" });

  const permissionError = usePermissionMonitor(hasStarted && interviewPhase !== "finished");

  const isSubmitting = interviewPhase === "submitting" || interviewPhase === "generating_followup";
  const isStarting = interviewPhase === "starting" || interviewPhase === "connecting";
  const isFinished = interviewPhase === "finished";
  const difficultyLabel = { friendly: "친근한 면접관", normal: "일반 면접관", pressure: "압박 면접관" }[interviewSession?.interviewDifficultyLevel ?? "normal"] ?? "일반 면접관";

  const cleanup = useCallback(() => {
    stopStt();
    avatarRef.current?.destroy();
    destroyTts();
    cleanupMedia();
    video.stopVideoAnalysis();
  }, [stopStt, destroyTts, cleanupMedia, video]);

  // ── Init ──
  useEffect(() => {
    if (!interviewSessionUuid) return;
    resetInterviewSession();
    loadInterviewSession(interviewSessionUuid);
    setupMedia();
    return () => cleanup();
  }, [interviewSessionUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = () => cleanup();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [cleanup]);

  // ── Resume session: use ref to avoid setState-in-effect ──
  const handleResumeSession = useCallback(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      setHasStarted(true);
      video.startVideoAnalysis();
    }
  }, [video]);

  useEffect(() => {
    if (mediaReady && interviewPhase === "listening") {
      handleResumeSession(); // eslint-disable-line react-hooks/set-state-in-effect -- sync external store state
    }
  }, [mediaReady, interviewPhase, handleResumeSession]);

  // ── New question arrival handler ──
  const handleNewQuestion = useCallback((questionText: string) => {
    stopStt();
    resetText();
    setAnswerState("waiting_ready");
    setCountdown(null);

    playTtsText(questionText).then(() => {
      if (isRealModeRef.current) {
        setCountdown(Math.floor(Math.random() * 26) + 5);
      }
    });
  }, [stopStt, resetText, playTtsText]);

  useEffect(() => {
    if (!currentInterviewTurn || !hasStarted || interviewPhase !== "listening") return;
    if (currentInterviewTurn.id === prevTurnIdRef.current) return;
    prevTurnIdRef.current = currentInterviewTurn.id;

    handleNewQuestion(currentInterviewTurn.question); // eslint-disable-line react-hooks/set-state-in-effect -- sync on new question from store
    avatarRef.current?.speak("", currentInterviewTurn.question).catch(() => {});
  }, [currentInterviewTurn, hasStarted, interviewPhase, handleNewQuestion]);

  // ── Countdown tick (setState in setTimeout callback is fine) ──
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // ── Countdown 0 → start STT ──
  const handleCountdownDone = useCallback(() => {
    setCountdown(null);
    setAnswerState("speaking");
    startStt();
  }, [startStt]);

  useEffect(() => {
    if (countdown === 0 && isRealMode && hasStarted) {
      handleCountdownDone(); // eslint-disable-line react-hooks/set-state-in-effect -- countdown reached zero
    }
  }, [countdown, isRealMode, hasStarted, handleCountdownDone]);

  // ── Finished → navigate ──
  const handleFinished = useCallback(() => {
    stopStt();
    setCountdown(null);
    destroyTts();
    cleanupMedia();
    video.stopVideoAnalysis();
    setTimeout(() => navigate("/interview/results"), 1500);
  }, [stopStt, destroyTts, cleanupMedia, video, navigate]);

  useEffect(() => {
    if (interviewPhase === "finished") {
      handleFinished(); // eslint-disable-line react-hooks/set-state-in-effect -- sync on phase change from store
    }
  }, [interviewPhase, handleFinished]);

  // ── Speech metrics ──
  useEffect(() => {
    let id: ReturnType<typeof setInterval>;
    if (isListening) {
      id = setInterval(() => setSpeechMetrics(speechAnalyzerRef.current.analyze(finalText + " " + interimText, "ko-KR", isListening)), 500);
    } else {
      setSpeechMetrics(speechAnalyzerRef.current.analyze("", "ko-KR", false));
    }
    return () => clearInterval(id);
  }, [finalText, interimText, isListening]);

  // ── Handlers ──
  const handleStart = async () => {
    if (!interviewSessionUuid) return;
    hasStartedRef.current = true;
    setHasStarted(true);
    video.resetWarnings();
    await video.startVideoAnalysis();
    await startInterview(interviewSessionUuid);
  };

  const handleSubmitAnswer = async () => {
    if (!interviewSessionUuid || !currentInterviewTurn) return;
    const answer = (finalText + " " + interimText).trim();
    if (!answer) return;
    stopStt();
    setAnswerState("waiting_ready");
    setCountdown(null);
    await submitInterviewAnswer(interviewSessionUuid, currentInterviewTurn.id, answer);
  };

  const handleFinishConfirm = () => {
    setShowFinishModal(false);
    cleanup();
    navigate("/interview/results");
  };

  return (
    <div className="w-full h-screen bg-[#080f1a] text-white flex flex-col overflow-hidden font-sans">
      <SessionHeader
        interviewSession={interviewSession}
        interviewTurns={interviewTurns}
        currentInterviewTurnIndex={currentInterviewTurnIndex}
        hasStarted={hasStarted}
        isFinished={isFinished}
        difficultyLabel={difficultyLabel}
        practiceModeLabel={isRealMode ? "실전 모드" : "연습 모드"}
        onFinish={() => setShowFinishModal(true)}
      />

      <main className="flex-1 flex overflow-hidden min-h-0">
        <section className="flex-1 flex flex-col overflow-hidden border-r border-white/10">
          {(interviewError || isFinished) && (
            <div className="shrink-0 px-6 pt-4">
              {interviewError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm mb-3">{interviewError}</div>}
              {isFinished && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 text-center mb-3">
                  <p className="text-indigo-300 font-bold text-base mb-1">면접이 종료되었습니다</p>
                  <p className="text-slate-400 text-sm">면접 결과 페이지로 이동합니다...</p>
                </div>
              )}
            </div>
          )}
          <div className="flex-1 relative min-h-0">
            <AvatarSection onReady={(a) => { avatarRef.current = a; }} className="absolute inset-0 w-full h-full" />
          </div>
          <div className="shrink-0 px-6 pb-5 pt-4 border-t border-white/5 bg-[#080f1a]/80">
            <QuestionPanel
              currentInterviewTurn={currentInterviewTurn} interviewPhase={interviewPhase}
              currentTurnIndex={currentInterviewTurnIndex}
              totalTurns={interviewSession?.interviewSessionType === "followup" ? FOLLOWUP_TOTAL_QUESTIONS : interviewTurns.length}
              ttsPlaying={ttsPlaying} ttsMuted={ttsMuted} ttsVolume={ttsVolume}
              onMuteToggle={() => setTtsMuted(!ttsMuted)} onVolumeChange={setTtsVolume} onSkipTts={skipTts}
            />
          </div>
        </section>

        <section className="w-[340px] shrink-0 flex flex-col bg-[#0b1420] border-l border-white/5">
          <SessionActionPanel
            hasStarted={hasStarted} isFinished={isFinished} isRealMode={isRealMode}
            isStarting={isStarting} isModelLoading={video.isModelLoading} isSubmitting={isSubmitting}
            interviewPhase={interviewPhase} answerState={answerState} countdown={countdown}
            ttsPlaying={ttsPlaying} audioLevel={audioLevel}
            finalText={finalText} interimText={interimText}
            onStart={handleStart}
            onPracticeStart={() => { setAnswerState("speaking"); startStt(); }}
            onSubmitAnswer={handleSubmitAnswer}
          />
          <div className="flex-1 min-h-0 p-4 flex">
            <TranscriptPanel finalText={finalText} interimText={interimText} highlightedHtml={speechMetrics.highlightedHtml} isListening={isListening} />
          </div>
          <div className="shrink-0 px-4 pb-3 border-t border-white/5 pt-3">
            <BehaviorMetrics speechMetrics={speechMetrics} videoWarningCount={video.videoWarningCount} isSpeechActive={isListening} audioLevel={audioLevel} fps={video.fps} isAnalyzing={video.isAnalyzing} />
          </div>
          <div className="h-44 relative border-t border-white/10 bg-black flex items-center justify-center shrink-0">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
              <svg viewBox="0 0 100 100" className="w-[55%] h-full text-blue-400">
                <path d="M 50 10 C 35 10, 35 45, 50 45 C 65 45, 65 10, 50 10 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" />
                <path d="M 10 95 C 10 60, 90 60, 90 95" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" />
              </svg>
            </div>
            {video.isAnalyzing && (
              <div className="absolute top-2 left-2 text-[9px] font-bold text-green-400 bg-green-400/10 border border-green-400/30 rounded px-1.5 py-px flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />{video.fps} FPS
              </div>
            )}
          </div>
        </section>
      </main>

      <style>{`.filler-word{background:rgba(234,179,8,.2);border-radius:3px;padding:0 2px;color:#facc15}.bad-word{background:rgba(239,68,68,.2);border-radius:3px;padding:0 2px;color:#f87171}`}</style>

      {showFinishModal && <FinishConfirmModal onConfirm={handleFinishConfirm} onCancel={() => setShowFinishModal(false)} />}
      {isTooSmall && <ScreenSizeOverlay screenWidth={screenSize.w} screenHeight={screenSize.h} onGoHome={() => navigate("/interview/results")} />}
      {permissionError && <PermissionOverlay onReload={() => window.location.reload()} onGoResults={() => navigate("/interview/results")} />}
    </div>
  );
}
