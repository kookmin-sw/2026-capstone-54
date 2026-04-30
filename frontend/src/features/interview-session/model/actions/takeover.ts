/** 인터뷰 세션 owner 강제 인수 액션. */
import { interviewApi } from "../../api/interviewApi";
import type { InterviewSessionStore } from "../types";

type Set = (partial: Partial<InterviewSessionStore>) => void;

export async function applyTakeover(set: Set, interviewSessionUuid: string) {
  const response = await interviewApi.takeoverInterviewSession(interviewSessionUuid);
  set({
    ownerToken: response.ownerToken,
    ownerVersion: response.ownerVersion,
    wsTicket: response.wsTicket,
    takeoverModalOpen: false,
  });
}
