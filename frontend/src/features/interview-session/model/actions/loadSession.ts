/** 세션 로드: 진행 중이면 현재 위치를 복원, 완료면 종료 상태로 표시. 페이지 진입 즉시 takeover 로 ownership 인수하여 다른 탭/브라우저/기기의 connection 을 backend Channels eviction 으로 닫는다. */
import { interviewApi } from "../../api/interviewApi";
import { isApiError } from "@/shared/api/client";
import { toast } from "sonner";
import type { InterviewSessionStore } from "../types";

type Set = (partial: Partial<InterviewSessionStore>) => void;

async function autoTakeoverIfPossible(set: Set, interviewSessionUuid: string) {
  try {
    const ownership = await interviewApi.takeoverInterviewSession(interviewSessionUuid);
    set({
      ownerToken: ownership.ownerToken,
      ownerVersion: ownership.ownerVersion,
      wsTicket: ownership.wsTicket,
    });
  } catch {
    /* takeover 실패 (예: 권한 없음) — 페이지는 read-only 상태로 표시될 수 있음 */
  }
}

export async function loadInterviewSession(set: Set, interviewSessionUuid: string) {
  try {
    set({ interviewPhase: "connecting" });
    const interviewSession = await interviewApi.getInterviewSession(interviewSessionUuid);

    const isResumable =
      interviewSession.interviewSessionStatus === "in_progress"
      || interviewSession.interviewSessionStatus === "paused";
    if (!isResumable) {
      set({ interviewSession, interviewPhase: "idle" });
      return;
    }

    await autoTakeoverIfPossible(set, interviewSessionUuid);

    const turns = await interviewApi.getInterviewTurns(interviewSessionUuid);

    if (turns.length === 0) {
      set({ interviewSession, interviewTurns: [], interviewPhase: "idle" });
      return;
    }

    const firstUnansweredIdx = turns.findIndex((t) => !t.answer);

    if (firstUnansweredIdx < 0) {
      try { await interviewApi.finishInterview(interviewSessionUuid); } catch { /* ignore */ }
      set({ interviewSession, interviewTurns: turns, interviewPhase: "finished" });
      return;
    }

    set({
      interviewSession,
      interviewTurns: turns,
      currentInterviewTurnIndex: firstUnansweredIdx,
      currentInterviewTurn: turns[firstUnansweredIdx],
      interviewPhase: "listening",
    });
  } catch {
    set({ interviewPhase: "error", interviewError: "면접 세션을 불러올 수 없습니다." });
  }
}

export async function loadInterviewTurns(set: Set, interviewSessionUuid: string) {
  try {
    const interviewTurns = await interviewApi.getInterviewTurns(interviewSessionUuid);
    set({ interviewTurns });
  } catch { /* ignore */ }
}

export async function startInterview(set: Set, interviewSessionUuid: string) {
  try {
    set({ interviewPhase: "starting" });
    const response = await interviewApi.startInterview(interviewSessionUuid);
    const interviewTurns = response.turns;
    const firstTurn = interviewTurns[0] ?? null;
    set({
      interviewTurns,
      currentInterviewTurnIndex: 0,
      currentInterviewTurn: firstTurn,
      interviewPhase: "listening",
      ownerToken: response.ownerToken,
      ownerVersion: response.ownerVersion,
      wsTicket: response.wsTicket,
    });
  } catch (error) {
    if (isApiError(error) && error.errorCode === "INTERVIEW_ALREADY_STARTED") {
      const message = (typeof error.message === "string" && error.message)
        || "이미 시작된 면접입니다. 이어서 진행합니다.";
      toast.info(message);
      await loadInterviewSession(set, interviewSessionUuid);
      return;
    }
    const message = isApiError(error) && typeof error.message === "string" && error.message
      ? error.message
      : "면접을 시작할 수 없습니다. 잠시 후 다시 시도하세요.";
    toast.error(message);
    set({ interviewPhase: "error", interviewError: message });
  }
}

export async function finishInterview(set: Set, interviewSessionUuid: string) {
  try {
    await interviewApi.finishInterview(interviewSessionUuid);
  } catch {
    /* 서버 오류여도 클라이언트 상태는 finished로 전환 */
  }
  set({ interviewPhase: "finished" });
}
