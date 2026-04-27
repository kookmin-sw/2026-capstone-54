/** 답변 제출: followup과 full_process 응답 형식이 다르기 때문에 분기 처리. */
import { interviewApi } from "../../api/interviewApi";
import type { InterviewTurn, SubmitAnswerFollowupResponse } from "../../api/types";
import type { InterviewPhase, InterviewSessionStore } from "../types";

type Get = () => InterviewSessionStore;
type Set = (partial: Partial<InterviewSessionStore>) => void;

export async function submitInterviewAnswer(
  set: Set,
  get: Get,
  interviewSessionUuid: string,
  turnPk: number,
  answer: string,
  speechSegments?: { text: string; startMs: number; endMs: number }[],
  fallbackOptions?: { fallbackRequested?: boolean; recordingUuid?: string },
) {
  const { interviewSession, interviewTurns, currentInterviewTurnIndex } = get();
  if (!interviewSession) return;

  const isFollowup = interviewSession.interviewSessionType === "followup";
  const nextPhase: InterviewPhase = isFollowup ? "generating_followup" : "submitting";
  set({ interviewPhase: nextPhase });

  const turnsWithAnswer = interviewTurns.map((t) =>
    t.id === turnPk ? { ...t, answer } : t,
  );

  try {
    const response = await interviewApi.submitAnswer(
      interviewSessionUuid,
      turnPk,
      answer,
      speechSegments,
      fallbackOptions,
    );

    if (isFollowup) {
      await handleFollowupResponse(set, interviewSessionUuid, response as SubmitAnswerFollowupResponse, turnsWithAnswer, currentInterviewTurnIndex);
    } else {
      await handleFullProcessResponse(set, interviewSessionUuid, response, turnsWithAnswer, currentInterviewTurnIndex);
    }
  } catch {
    set({ interviewPhase: "error", interviewError: "답변 제출에 실패했습니다." });
  }
}

async function handleFollowupResponse(
  set: Set,
  interviewSessionUuid: string,
  response: SubmitAnswerFollowupResponse,
  turnsWithAnswer: InterviewTurn[],
  currentIdx: number,
) {
  const newTurns = response?.turns ?? [];
  const allTurns = [...turnsWithAnswer, ...newTurns];

  if (response?.followupExhausted) {
    try { await interviewApi.finishInterview(interviewSessionUuid); } catch { /* ignore */ }
    set({ interviewTurns: allTurns, interviewPhase: "finished" });
    return;
  }

  const nextIndex = currentIdx + 1;
  set({
    interviewTurns: allTurns,
    currentInterviewTurnIndex: nextIndex,
    currentInterviewTurn: allTurns[nextIndex] ?? null,
    interviewPhase: "listening",
  });
}

async function handleFullProcessResponse(
  set: Set,
  interviewSessionUuid: string,
  response: unknown,
  turnsWithAnswer: InterviewTurn[],
  currentIdx: number,
) {
  if (response && typeof response === "object" && "detail" in response) {
    try { await interviewApi.finishInterview(interviewSessionUuid); } catch { /* ignore */ }
    set({ interviewTurns: turnsWithAnswer, interviewPhase: "finished" });
    return;
  }
  const nextTurn = response as InterviewTurn;
  const allTurns = [...turnsWithAnswer, nextTurn];
  const nextIndex = currentIdx + 1;
  set({
    interviewTurns: allTurns,
    currentInterviewTurnIndex: nextIndex,
    currentInterviewTurn: nextTurn,
    interviewPhase: "listening",
  });
}
