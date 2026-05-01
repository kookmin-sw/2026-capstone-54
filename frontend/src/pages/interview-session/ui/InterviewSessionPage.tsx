import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useInterviewSessionStore, useRecordingManager, RecordingIndicator } from "@/features/interview-session";
import { AvatarSection } from "@/features/interview-session/ui/AvatarSection";
import { QuestionPanel } from "@/features/interview-session/ui/QuestionPanel";
import { TranscriptPanel } from "@/features/interview-session/ui/TranscriptPanel";
import { BehaviorMetrics } from "@/features/interview-session/ui/BehaviorMetrics";
import { SpeechAnalyzer } from "@/shared/lib/speech/SpeechAnalyzer";
import { useTts } from "@/shared/lib/tts/useTts";
import { CoachMarks, type CoachMarkStep } from "@/shared/ui";
import { shouldShowCoachMarks, markCoachMarksShown } from "@/shared/lib/storage";
import type { IAvatarProvider } from "@/shared/lib/avatar/IAvatarProvider";

import { useMediaSetup } from "../hooks/useMediaSetup";
import { useVideoAnalysis } from "../hooks/useVideoAnalysis";
import { usePermissionMonitor } from "../hooks/usePermissionMonitor";
import { useScreenSize } from "../hooks/useScreenSize";
import { useInterviewMachine } from "../hooks/useInterviewMachine";
import { useSessionWs } from "../hooks/useSessionWs";
import { SessionHeader } from "./SessionHeader";
import { SessionActionPanel } from "./SessionActionPanel";
import { PermissionOverlay } from "./PermissionOverlay";
import { ScreenSizeOverlay } from "./ScreenSizeOverlay";
import { FinishConfirmModal } from "./FinishConfirmModal";
import { SessionTakeoverModal } from "@/widgets/interview-session/SessionTakeoverModal";
import { PausedOverlay } from "@/widgets/interview-session/PausedOverlay";
import { IdleDetectedModal } from "@/widgets/interview-session/IdleDetectedModal";
import { SttAidNotice } from "@/widgets/interview-session/SttAidNotice";
import { useIdleDetector } from "@/features/interview-session/lib/useIdleDetector";

const INTERVIEW_COACH_MARKS_KEY = "interview-session";

const interviewCoachMarksSteps: CoachMarkStep[] = [
  {
    id: "welcome",
    title: "면접 세션 안내",
    description: "면접 세션이 시작되었습니다. 주요 기능을 안내해 드리겠습니다.",
    targetSelector: ".session-header",
    position: "bottom",
    align: "center",
  },
  {
    id: "question-panel",
    title: "질문 패널",
    description: "여기서 면접관의 질문이 표시됩니다. 질문이 끝나면 답변을 시작하세요.",
    targetSelector: ".question-panel",
    position: "top",
    align: "center",
  },
  {
    id: "action-panel",
    title: "액션 패널",
    description: "면접 시작, 답변 제출 등 주요 액션을 여기서 수행합니다.",
    targetSelector: ".session-action-panel",
    position: "left",
    align: "center",
  },
  {
    id: "transcript-panel",
    title: "대본 패널",
    description: "당신의 답변이 실시간으로 표시됩니다. 말하기 습관을 확인할 수 있습니다.",
    targetSelector: ".transcript-panel",
    position: "left",
    align: "center",
  },
  {
    id: "behavior-metrics",
    title: "행동 지표",
    description: "말하기 속도, 채움말 사용 등 다양한 지표를 실시간으로 확인할 수 있습니다.",
    targetSelector: ".behavior-metrics",
    position: "left",
    align: "center",
  },
];

const INTERVIEW_COACH_MARKS_KEY = "interview-session";

const interviewCoachMarksSteps: CoachMarkStep[] = [
  {
    id: "welcome",
    title: "면접 세션 안내",
    description: "면접 세션이 시작되었습니다. 주요 기능을 안내해 드리겠습니다.",
    targetSelector: ".session-header",
    position: "bottom",
    align: "center",
  },
  {
    id: "question-panel",
    title: "질문 패널",
    description: "여기서 면접관의 질문이 표시됩니다. 질문이 끝나면 답변을 시작하세요.",
    targetSelector: ".question-panel",
    position: "top",
    align: "center",
  },
  {
    id: "action-panel",
    title: "액션 패널",
    description: "면접 시작, 답변 제출 등 주요 액션을 여기서 수행합니다.",
    targetSelector: ".session-action-panel",
    position: "left",
    align: "center",
  },
  {
    id: "transcript-panel",
    title: "대본 패널",
    description: "당신의 답변이 실시간으로 표시됩니다. 말하기 습관을 확인할 수 있습니다.",
    targetSelector: ".transcript-panel",
    position: "left",
    align: "center",
  },
  {
    id: "behavior-metrics",
    title: "행동 지표",
    description: "말하기 속도, 채움말 사용 등 다양한 지표를 실시간으로 확인할 수 있습니다.",
    targetSelector: ".behavior-metrics",
    position: "left",
    align: "center",
  },
];

export function InterviewSessionPage() {
  const { interviewSessionUuid } = useParams<{ interviewSessionUuid: string }>();
  const navigate = useNavigate();

  const {
    interviewSession, currentInterviewTurn, currentInterviewTurnIndex,
    interviewPhase, interviewError,
    loadInterviewSession, resetInterviewSession,
  } = useInterviewSessionStore();

  const { ttsPlaying, ttsMuted, setTtsMuted, ttsVolume, setTtsVolume, playTtsText, skipTts, destroyTts } = useTts();

  const {
    videoRef,
    isListening, finalText, interimText, audioLevel, mediaReady, sttSegments,
    setupMedia, cleanupMedia, startStt, stopStt, resetText,
  } = useMediaSetup();

  const video = useVideoAnalysis(videoRef);
  const { screenSize, isTooSmall } = useScreenSize();

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  useEffect(() => {
    if (videoRef.current?.srcObject) {
      setMediaStream(videoRef.current.srcObject as MediaStream);
    }
  }, [mediaReady, videoRef]);

  const recording = useRecordingManager({
    sessionUuid: interviewSessionUuid ?? "",
    externalStream: mediaStream,
    enabled: !!interviewSessionUuid,
  });

  const avatarRef = useRef<IAvatarProvider | null>(null);
  const speechAnalyzerRef = useRef(new SpeechAnalyzer());

  const machine = useInterviewMachine({
    sessionUuid: interviewSessionUuid ?? "",
    playTtsText,
    skipTts,
    destroyTts,
    startStt,
    stopStt,
    resetText,
    cleanupMedia,
    mediaReady,
    prepareRecording: recording.prepareRecording,
    startRecording: recording.startRecording,
    stopRecording: recording.stopRecording,
    abortRecording: recording.abortRecording,
    avatarSpeak: (text: string) => { avatarRef.current?.speak("", text).catch(() => {}); },
    startVideoAnalysis: video.startVideoAnalysis,
    stopVideoAnalysis: video.stopVideoAnalysis,
    resetWarnings: video.resetWarnings,
    navigate,
  });

  const { phase } = machine.state;
  const hasStarted = phase !== "idle" && phase !== "ready";
  const isFinished = phase === "finished";
  const isRealMode = interviewSession?.interviewPracticeMode === "real";
  const difficultyLabel = { friendly: "친근한 면접관", normal: "일반 면접관", pressure: "압박 면접관" }[interviewSession?.interviewDifficultyLevel ?? "normal"] ?? "일반 면접관";
  
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [speechMetrics, setSpeechMetrics] = useState({ wpm: 0, fillerCount: 0, badWordCount: 0, pauseWarnings: 0, highlightedHtml: "" });
  const [showCoachMarks, setShowCoachMarks] = useState(false);
  const [coachMarksStep, setCoachMarksStep] = useState(0);
  const [coachMarksCompleted, setCoachMarksCompleted] = useState(false);

  const isFirstQuestion = currentInterviewTurnIndex === 0;
  const shouldShowCoachMarksGuide = shouldShowCoachMarks(INTERVIEW_COACH_MARKS_KEY) && isFirstQuestion && !coachMarksCompleted;

  const permissionError = usePermissionMonitor(hasStarted && !isFinished);

  const wsClientRef = useSessionWs({
    interviewSessionUuid: interviewSessionUuid ?? "",
    enabled: !isFinished,
  });

  const { isIdle, resetIdle } = useIdleDetector({
    enabled: hasStarted && !isFinished,
    thresholdMs: 60_000,
    faceVisible: video.isAnalyzing && video.fps > 0,
  });

  useEffect(() => {
    if (!hasStarted || isFinished) return;
    if (isIdle) {
      wsClientRef.current?.sendPause("user_idle");
    } else {
      wsClientRef.current?.sendResume();
    }
  }, [isIdle, hasStarted, isFinished, wsClientRef]);

  const handleIdleContinue = () => {
    resetIdle();
  };

  const handleIdleFinish = () => {
    resetIdle();
    setShowFinishModal(true);
  };

  const initGuardRef = useRef<string | null>(null);

  useEffect(() => {
    if (!interviewSessionUuid) return;
    if (initGuardRef.current === interviewSessionUuid) return;
    initGuardRef.current = interviewSessionUuid;
    resetInterviewSession();
    loadInterviewSession(interviewSessionUuid);
    setupMedia();
    return () => {
      stopStt();
      avatarRef.current?.destroy();
      destroyTts();
      cleanupMedia();
      video.stopVideoAnalysis();
      recording.abortRecording().catch(() => {});
    };
  }, [interviewSessionUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = () => {
      recording.abortRecording().catch(() => {});
      stopStt();
      destroyTts();
      cleanupMedia();
      video.stopVideoAnalysis();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [recording, stopStt, destroyTts, cleanupMedia, video]);

  useEffect(() => {
    let id: ReturnType<typeof setInterval>;
    if (isListening) {
      id = setInterval(() => setSpeechMetrics(speechAnalyzerRef.current.analyze(finalText + " " + interimText, "ko-KR", isListening)), 500);
    } else {
      setSpeechMetrics(speechAnalyzerRef.current.analyze("", "ko-KR", false));
    }
    return () => clearInterval(id);
  }, [finalText, interimText, isListening]);

  useEffect(() => {
    if (shouldShowCoachMarksGuide && interviewSession && !showCoachMarks) {
      const timer = setTimeout(() => {
        setShowCoachMarks(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowCoachMarksGuide, interviewSession, showCoachMarks]);

  const handleSubmitAnswer = () => {
    const answer = (finalText + " " + interimText).trim();
    machine.handleSubmit(answer, sttSegments);
  };

  const handleFinishConfirm = () => {
    setShowFinishModal(false);
    stopStt();
    avatarRef.current?.destroy();
    destroyTts();
    cleanupMedia();
    video.stopVideoAnalysis();
    recording.abortRecording().catch(() => {});
    navigate("/interview/results");
  };

  return (
    <div className="w-full h-screen bg-[#080f1a] text-white flex flex-col overflow-hidden font-sans">
           <SessionHeader
            className="session-header"
            interviewSession={interviewSession}
            currentInterviewTurnIndex={currentInterviewTurnIndex}
            hasStarted={hasStarted}
            isFinished={isFinished}
            difficultyLabel={difficultyLabel}
            practiceModeLabel={isRealMode ? "실전 모드" : "연습 모드"}
            onFinish={() => setShowFinishModal(true)}
          />

      <main className="flex-1 flex overflow-hidden min-h-0">
        <section className="flex-1 flex flex-col overflow-hidden border-r border-white/10">
          {(interviewError || isFinished || recording.error) && (
            <div className="shrink-0 px-6 pt-4">
              {interviewError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm mb-3">{interviewError}</div>}
              {recording.error && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-400 text-sm mb-3">
                  녹화 오류: {recording.error}
                </div>
              )}
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
              className="question-panel"
              currentInterviewTurn={currentInterviewTurn} interviewPhase={interviewPhase}
              currentTurnIndex={currentInterviewTurnIndex}
              totalTurns={interviewSession?.estimatedTotalQuestions ?? 0}
              ttsPlaying={ttsPlaying} ttsMuted={ttsMuted} ttsVolume={ttsVolume}
              onMuteToggle={() => setTtsMuted(!ttsMuted)} onVolumeChange={setTtsVolume} onSkipTts={skipTts}
            />
          </div>
        </section>

        <section className="w-[340px] shrink-0 flex flex-col bg-[#0b1420] border-l border-white/5">
           <SessionActionPanel
            className="session-action-panel"
            machinePhase={phase}
            isRealMode={isRealMode}
            countdown={machine.state.countdown}
            isModelLoading={video.isModelLoading}
            interviewPhase={interviewPhase}
            audioLevel={audioLevel}
            finalText={finalText}
            interimText={interimText}
            onStart={machine.handleStart}
            onPracticeStart={machine.handlePracticeStart}
            onSubmitAnswer={handleSubmitAnswer}
          />
          <div className="flex-1 min-h-0 p-4 flex">
             <TranscriptPanel className="transcript-panel" finalText={finalText} interimText={interimText} highlightedHtml={speechMetrics.highlightedHtml} isListening={isListening} />
          </div>
          <div className="shrink-0 px-4 pb-3 border-t border-white/5 pt-3">
             <BehaviorMetrics className="behavior-metrics" speechMetrics={speechMetrics} videoWarningCount={video.videoWarningCount} isSpeechActive={isListening} audioLevel={audioLevel} fps={video.fps} isAnalyzing={video.isAnalyzing} />
          </div>
          <div className="h-44 relative border-t border-white/10 bg-black flex items-center justify-center shrink-0">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
              <svg viewBox="0 0 100 100" className="w-[55%] h-full text-blue-400">
                <path d="M 50 10 C 35 10, 35 45, 50 45 C 65 45, 65 10, 50 10 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" />
                <path d="M 10 95 C 10 60, 90 60, 90 95" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" />
              </svg>
            </div>
            <div className="absolute top-2 right-2 z-10">
              <RecordingIndicator isRecording={recording.isRecording} />
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

      {showCoachMarks && (
        <CoachMarks
          steps={interviewCoachMarksSteps}
          open={showCoachMarks}
          onClose={() => {
            setShowCoachMarks(false);
            markCoachMarksShown(INTERVIEW_COACH_MARKS_KEY);
          }}
          onComplete={() => {
            setCoachMarksCompleted(true);
            setShowCoachMarks(false);
            markCoachMarksShown(INTERVIEW_COACH_MARKS_KEY);
          }}
          currentStep={coachMarksStep}
          onStepChange={setCoachMarksStep}
          dismissOnBackdrop={false}
          dismissOnEsc={true}
        />
      )}
      {showFinishModal && <FinishConfirmModal onConfirm={handleFinishConfirm} onCancel={() => setShowFinishModal(false)} />}
      {isTooSmall && <ScreenSizeOverlay screenWidth={screenSize.w} screenHeight={screenSize.h} onGoHome={() => navigate("/interview/results")} />}
      {permissionError && <PermissionOverlay onReload={() => window.location.reload()} onGoResults={() => navigate("/interview/results")} />}
      <SessionTakeoverModal />
      <PausedOverlay />
      <IdleDetectedModal open={isIdle} onContinue={handleIdleContinue} onFinish={handleIdleFinish} />
      <SttAidNotice />
    </div>
  );
}
