import { create } from "zustand";
import { interviewApi } from "../api/interviewApi";
import type {
  InterviewSession,
  InterviewTurn,
  InterviewAnalysisReport,
  SubmitAnswerFollowupResponse,
} from "../api/types";
import type { InterviewPhase } from "./types";

interface InterviewSessionStoreState {
  interviewSession: InterviewSession | null;
  interviewTurns: InterviewTurn[];
  currentInterviewTurnIndex: number;
  currentInterviewTurn: InterviewTurn | null;
  interviewPhase: InterviewPhase;
  interviewError: string | null;
  interviewAnalysisReport: InterviewAnalysisReport | null;
  isReportPolling: boolean;

  loadInterviewSession: (interviewSessionUuid: string) => Promise<void>;
  loadInterviewTurns: (interviewSessionUuid: string) => Promise<void>;
  startInterview: (interviewSessionUuid: string) => Promise<void>;
  submitInterviewAnswer: (
    interviewSessionUuid: string,
    turnPk: number,
    answer: string
  ) => Promise<void>;
  finishInterview: (interviewSessionUuid: string) => Promise<void>;
  startReportPolling: (interviewSessionUuid: string) => void;
  resetInterviewSession: () => void;
}

export const useInterviewSessionStore = create<InterviewSessionStoreState>((set, get) => ({
  interviewSession: null,
  interviewTurns: [],
  currentInterviewTurnIndex: 0,
  currentInterviewTurn: null,
  interviewPhase: "idle",
  interviewError: null,
  interviewAnalysisReport: null,
  isReportPolling: false,

  loadInterviewSession: async (interviewSessionUuid) => {
    try {
      set({ interviewPhase: "connecting" });
      const interviewSession = await interviewApi.getInterviewSession(interviewSessionUuid);

      if (interviewSession.interviewSessionStatus === "in_progress") {
        // 진행 중인 세션: 기존 turns 로드 후 현재 위치 복원
        const turns = await interviewApi.getInterviewTurns(interviewSessionUuid);

        if (turns.length === 0) {
          // start API가 아직 호출 안 된 세션 → 시작 화면으로
          set({ interviewSession, interviewTurns: [], interviewPhase: "idle" });
          return;
        }

        const firstUnansweredIdx = turns.findIndex((t) => !t.answer);

        if (firstUnansweredIdx < 0) {
          // 모든 질문에 답했지만 종료 API가 호출 안 된 경우 → 자동 종료
          try { await interviewApi.finishInterview(interviewSessionUuid); } catch { /* ignore */ }
          set({ interviewSession, interviewTurns: turns, interviewPhase: "finished" });
        } else {
          set({
            interviewSession,
            interviewTurns: turns,
            currentInterviewTurnIndex: firstUnansweredIdx,
            currentInterviewTurn: turns[firstUnansweredIdx],
            interviewPhase: "listening",   // ← 페이지가 이 상태를 보고 자동 재개
          });
        }
      } else {
        set({ interviewSession, interviewPhase: "idle" });
      }
    } catch {
      set({ interviewPhase: "error", interviewError: "면접 세션을 불러올 수 없습니다." });
    }
  },

  loadInterviewTurns: async (interviewSessionUuid) => {
    try {
      const interviewTurns = await interviewApi.getInterviewTurns(interviewSessionUuid);
      set({ interviewTurns });
    } catch { /* ignore */ }
  },

  startInterview: async (interviewSessionUuid) => {
    try {
      set({ interviewPhase: "starting" });
      const interviewTurns = await interviewApi.startInterview(interviewSessionUuid);
      const firstTurn = interviewTurns[0] ?? null;
      set({
        interviewTurns,
        currentInterviewTurnIndex: 0,
        currentInterviewTurn: firstTurn,
        interviewPhase: "listening",
      });
    } catch {
      set({ interviewPhase: "error", interviewError: "면접 시작에 실패했습니다." });
    }
  },

  submitInterviewAnswer: async (interviewSessionUuid, turnPk, answer) => {
    const { interviewSession, interviewTurns, currentInterviewTurnIndex } = get();
    if (!interviewSession) return;

    const isFollowup = interviewSession.interviewSessionType === "followup";
    const nextPhase: InterviewPhase = isFollowup ? "generating_followup" : "submitting";
    set({ interviewPhase: nextPhase });

    // 로컬 상태에서도 방금 제출한 답변을 현재 turn에 반영해 둔다.
    const turnsWithAnswer = interviewTurns.map((t) =>
      t.id === turnPk ? { ...t, answer } : t
    );

    try {
      const response = await interviewApi.submitAnswer(interviewSessionUuid, turnPk, answer);

      if (isFollowup) {
        // FOLLOWUP: { turns: InterviewTurn[], followupExhausted: boolean }
        // followupExhausted=true → turns=[] (모든 앵커 체인 소진, 면접 종료)
        // followupExhausted=false → turns=[next turn] (꼬리질문 or 다음 앵커)
        const followup = response as SubmitAnswerFollowupResponse;
        const newTurns = followup?.turns ?? [];
        const allTurns = [...turnsWithAnswer, ...newTurns];

        if (followup?.followupExhausted) {
          // 모든 앵커 체인 소진 → 백엔드에 자동 종료 요청
          try { await interviewApi.finishInterview(interviewSessionUuid); } catch { /* ignore */ }
          set({ interviewTurns: allTurns, interviewPhase: "finished" });
          return;
        }

        const nextIndex = currentInterviewTurnIndex + 1;
        set({
          interviewTurns: allTurns,
          currentInterviewTurnIndex: nextIndex,
          currentInterviewTurn: allTurns[nextIndex] ?? null,
          interviewPhase: "listening",
        });
      } else {
        // FULL_PROCESS: response is next turn or {detail: ...} if done
        if (response && "detail" in (response as object)) {
          // 전체 프로세스 완료 → 백엔드에 자동 종료 요청
          try { await interviewApi.finishInterview(interviewSessionUuid); } catch { /* ignore */ }
          set({ interviewTurns: turnsWithAnswer, interviewPhase: "finished" });
          return;
        }
        const nextTurn = response as InterviewTurn;
        const allTurns = [...turnsWithAnswer, nextTurn];
        const nextIndex = currentInterviewTurnIndex + 1;
        set({
          interviewTurns: allTurns,
          currentInterviewTurnIndex: nextIndex,
          currentInterviewTurn: nextTurn,
          interviewPhase: "listening",
        });
      }
    } catch {
      set({ interviewPhase: "error", interviewError: "답변 제출에 실패했습니다." });
    }
  },

  finishInterview: async (interviewSessionUuid) => {
    try {
      await interviewApi.finishInterview(interviewSessionUuid);
    } catch {
      /* 서버 오류여도 클라이언트 상태는 finished로 전환 */
    }
    set({ interviewPhase: "finished" });
  },

  startReportPolling: (interviewSessionUuid) => {
    set({ isReportPolling: true });

    const poll = async () => {
      try {
        const interviewAnalysisReport = await interviewApi.getInterviewAnalysisReport(interviewSessionUuid);
        set({ interviewAnalysisReport });
        const done =
          interviewAnalysisReport.interviewAnalysisReportStatus === "completed" ||
          interviewAnalysisReport.interviewAnalysisReportStatus === "failed";
        if (!done) setTimeout(poll, 5000);
        else set({ isReportPolling: false });
      } catch {
        setTimeout(poll, 8000);
      }
    };

    poll();
  },

  resetInterviewSession: () =>
    set({
      interviewSession: null,
      interviewTurns: [],
      currentInterviewTurnIndex: 0,
      currentInterviewTurn: null,
      interviewPhase: "idle",
      interviewError: null,
      interviewAnalysisReport: null,
      isReportPolling: false,
    }),
}));
