import { useReducer, useEffect, useRef, useCallback } from "react";
import {
  machineReducer,
  initialMachineState,
  type MachineState,
  type MachineEvent,
} from "../model/machine";
import { useInterviewSessionStore } from "@/features/interview-session";

export interface InterviewMachineDeps {
  sessionUuid: string;
  playTtsText: (text: string) => Promise<void>;
  skipTts: () => void;
  destroyTts: () => void;
  startStt: () => void;
  stopStt: () => void;
  resetText: () => void;
  cleanupMedia: () => void;
  mediaReady: boolean;
  prepareRecording: (turnId: number) => Promise<void>;
  startRecording: (turnId: number) => Promise<void>;
  stopRecording: () => Promise<void>;
  abortRecording: () => Promise<void>;
  avatarSpeak: (text: string) => void;
  startVideoAnalysis: () => Promise<void>;
  stopVideoAnalysis: () => void;
  resetWarnings: () => void;
  navigate: (to: string) => void;
}

export interface UseInterviewMachineReturn {
  state: MachineState;
  dispatch: React.Dispatch<MachineEvent>;
  handleStart: () => Promise<void>;
  handlePracticeStart: () => void;
  handleSubmit: (answer: string, speechSegments?: { text: string; startMs: number; endMs: number }[]) => Promise<void>;
}

export function useInterviewMachine(deps: InterviewMachineDeps): UseInterviewMachineReturn {
  const {
    interviewSession,
    interviewPhase: storePhase,
    interviewError: storeError,
    currentInterviewTurn,
    startInterview,
    submitInterviewAnswer,
  } = useInterviewSessionStore();

  const isRealMode = interviewSession?.interviewPracticeMode === "real";

  const [state, dispatch] = useReducer(machineReducer, {
    ...initialMachineState,
    isRealMode,
  });

  useEffect(() => {
    dispatch({ type: "SET_REAL_MODE", isRealMode });
  }, [isRealMode]);

  const depsRef = useRef(deps);
  depsRef.current = deps;
  const busyRef = useRef(false);

  // ── Transition: idle → ready | resume ──
  useEffect(() => {
    if (state.phase !== "idle" || !deps.mediaReady) return;

    if (storePhase === "listening" && currentInterviewTurn) {
      depsRef.current.startVideoAnalysis().catch(() => {});
      dispatch({
        type: "RESUME",
        turnId: currentInterviewTurn.id,
        question: currentInterviewTurn.question,
      });
    } else if (storePhase === "finished") {
      dispatch({ type: "FINISH" });
    } else if (interviewSession && storePhase === "idle") {
      dispatch({ type: "MEDIA_READY" });
    }
  }, [state.phase, deps.mediaReady, storePhase, currentInterviewTurn, interviewSession]);

  // ── Store error → machine error ──
  useEffect(() => {
    if (storePhase === "error" && storeError) {
      dispatch({ type: "ERROR", message: storeError });
    }
  }, [storePhase, storeError]);

  // ── Store finished (external) → machine finished ──
  useEffect(() => {
    if (storePhase === "finished" && state.phase !== "finished" && state.phase !== "idle") {
      dispatch({ type: "FINISH" });
    }
  }, [storePhase, state.phase]);

  // ── Effect: tts_playing → TTS 재생 + 녹화 준비 병렬 시작 ──
  const preparePromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (state.phase !== "tts_playing" || !state.question || !state.turnId) return;
    let cancelled = false;

    const d = depsRef.current;
    d.resetText();
    d.avatarSpeak(state.question);
    preparePromiseRef.current = d.prepareRecording(state.turnId).catch(() => {});
    d.playTtsText(state.question).then(() => {
      if (!cancelled) dispatch({ type: "TTS_DONE" });
    });

    return () => {
      cancelled = true;
      depsRef.current.skipTts();
    };
  }, [state.phase, state.turnId, state.question]);

  // ── Effect: preparing_record → 녹화 준비 완료 대기 ──
  useEffect(() => {
    if (state.phase !== "preparing_record") return;
    let cancelled = false;

    const promise = preparePromiseRef.current ?? Promise.resolve();
    promise.then(() => {
      if (!cancelled) dispatch({ type: "RECORDING_READY" });
    });

    return () => { cancelled = true; };
  }, [state.phase]);

  // ── Effect: countdown tick ──
  useEffect(() => {
    if (state.phase !== "countdown" || state.countdown === null || state.countdown <= 0) return;
    const id = setTimeout(() => dispatch({ type: "COUNTDOWN_TICK" }), 1000);
    return () => clearTimeout(id);
  }, [state.phase, state.countdown]);

  // ── Effect: speaking entry → start STT + recording ──
  useEffect(() => {
    if (state.phase !== "speaking" || !state.turnId) return;
    depsRef.current.startStt();
    depsRef.current.startRecording(state.turnId).catch(() => {});
  }, [state.phase, state.turnId]);

  // ── Effect: finished entry → cleanup + navigate ──
  useEffect(() => {
    if (state.phase !== "finished") return;

    const d = depsRef.current;
    d.stopStt();
    d.stopRecording().catch(() => {});
    d.destroyTts();
    d.cleanupMedia();
    d.stopVideoAnalysis();

    const timer = setTimeout(() => depsRef.current.navigate("/interview/results"), 1500);
    return () => clearTimeout(timer);
  }, [state.phase]);

  // ── Handlers ──

  const handleStart = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      dispatch({ type: "START" });
      const d = depsRef.current;
      d.resetWarnings();
      await d.startVideoAnalysis();

      await startInterview(deps.sessionUuid);
      const store = useInterviewSessionStore.getState();

      if (store.interviewPhase === "error") {
        dispatch({ type: "ERROR", message: store.interviewError ?? "면접 시작에 실패했습니다." });
        return;
      }

      if (store.currentInterviewTurn) {
        dispatch({
          type: "QUESTION_ARRIVED",
          turnId: store.currentInterviewTurn.id,
          question: store.currentInterviewTurn.question,
        });
      }
    } finally {
      busyRef.current = false;
    }
  }, [deps.sessionUuid, startInterview]);

  const handlePracticeStart = useCallback(() => {
    dispatch({ type: "PRACTICE_START" });
  }, []);

  const handleSubmit = useCallback(
    async (answer: string, speechSegments?: { text: string; startMs: number; endMs: number }[]) => {
      if (busyRef.current || !state.turnId || !answer.trim()) return;
      busyRef.current = true;

      dispatch({ type: "SUBMIT" });
      const d = depsRef.current;
      d.stopStt();
      await d.stopRecording();

      try {
        await submitInterviewAnswer(deps.sessionUuid, state.turnId, answer, speechSegments);
        const store = useInterviewSessionStore.getState();

        if (store.interviewPhase === "error") {
          dispatch({ type: "ERROR", message: store.interviewError ?? "답변 제출에 실패했습니다." });
          return;
        }

        if (store.interviewPhase === "finished") {
          dispatch({ type: "FINISH" });
        } else if (store.currentInterviewTurn && store.currentInterviewTurn.id !== state.turnId) {
          dispatch({
            type: "ANSWER_ACCEPTED",
            nextTurnId: store.currentInterviewTurn.id,
            nextQuestion: store.currentInterviewTurn.question,
          });
        }
      } finally {
        busyRef.current = false;
      }
    },
    [state.turnId, deps.sessionUuid, submitInterviewAnswer],
  );

  return { state, dispatch, handleStart, handlePracticeStart, handleSubmit };
}
