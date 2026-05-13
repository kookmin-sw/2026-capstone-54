jest.mock("../../../api/interviewApi", () => ({
  interviewApi: {
    submitAnswer: jest.fn(),
    finishInterview: jest.fn(),
  },
}));

import { interviewApi } from "../../../api/interviewApi";
import { submitInterviewAnswer } from "../submitAnswer";
import type { InterviewSessionStore } from "../../types";

const mockSubmitAnswer = interviewApi.submitAnswer as jest.Mock;
const mockFinishInterview = interviewApi.finishInterview as jest.Mock;

function makeStore(overrides: Partial<InterviewSessionStore> = {}): InterviewSessionStore {
  const session = { uuid: "sess-1", interviewSessionType: "followup" } as never;
  const turns = [
    { id: 1, question: "Q1", answer: "" },
    { id: 2, question: "Q2", answer: "" },
  ] as never;

  return {
    interviewSession: session,
    interviewTurns: turns,
    currentInterviewTurnIndex: 0,
    currentInterviewTurn: turns[0],
    interviewPhase: "listening",
    interviewError: null,
    interviewAnalysisReport: null,
    isReportPolling: false,
    ownerToken: null,
    ownerVersion: null,
    wsTicket: null,
    takeoverModalOpen: false,
    isPaused: false,
    pauseReason: null,
    ...overrides,
  } as InterviewSessionStore;
}

describe("submitInterviewAnswer — guard clauses", () => {
  beforeEach(() => jest.clearAllMocks());

  it("interviewSession 이 null 이면 early return (API 미호출)", async () => {
    const setMock = jest.fn();
    const getMock = jest.fn(() => makeStore({ interviewSession: null }));

    await submitInterviewAnswer(setMock, getMock, "sess-x", 1, "answer");

    expect(mockSubmitAnswer).not.toHaveBeenCalled();
    expect(setMock).not.toHaveBeenCalled();
  });
});

describe("submitInterviewAnswer — FOLLOWUP 모드", () => {
  beforeEach(() => jest.clearAllMocks());

  it("interviewPhase 를 'generating_followup' 으로 즉시 전환", async () => {
    mockSubmitAnswer.mockResolvedValue({ turns: [], followupExhausted: false });
    const setMock = jest.fn();
    const getMock = jest.fn(() => makeStore());

    await submitInterviewAnswer(setMock, getMock, "sess-1", 1, "ans");

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ interviewPhase: "generating_followup" })
    );
  });

  it("응답에 새 turns 있으면 기존+신규 turn 합치고 nextIndex 로 이동", async () => {
    const newTurn = { id: 3, question: "후속Q", answer: "" };
    mockSubmitAnswer.mockResolvedValue({ turns: [newTurn], followupExhausted: false });
    const setMock = jest.fn();
    const getMock = jest.fn(() => makeStore());

    await submitInterviewAnswer(setMock, getMock, "sess-1", 1, "내 답변");

    const finalCall = setMock.mock.calls[setMock.mock.calls.length - 1][0];
    expect(finalCall).toMatchObject({
      currentInterviewTurnIndex: 1,
      interviewPhase: "listening",
    });
    expect(finalCall.interviewTurns).toHaveLength(3);
    expect(finalCall.interviewTurns[0].answer).toBe("내 답변");
    expect(finalCall.interviewTurns[2]).toEqual(newTurn);
  });

  it("followupExhausted=true 면 finishInterview 호출 + phase='finished'", async () => {
    mockSubmitAnswer.mockResolvedValue({ turns: [], followupExhausted: true });
    mockFinishInterview.mockResolvedValue(undefined);
    const setMock = jest.fn();
    const getMock = jest.fn(() => makeStore());

    await submitInterviewAnswer(setMock, getMock, "sess-1", 1, "ans");

    expect(mockFinishInterview).toHaveBeenCalledWith("sess-1");
    const finalCall = setMock.mock.calls[setMock.mock.calls.length - 1][0];
    expect(finalCall.interviewPhase).toBe("finished");
  });

  it("turnMetrics 전달 시 해당 turn 에 병합되어 저장", async () => {
    mockSubmitAnswer.mockResolvedValue({ turns: [], followupExhausted: false });
    const setMock = jest.fn();
    const getMock = jest.fn(() => makeStore());
    const metrics = { gazeAwayCount: 3, headAwayCount: 1, speechRateSps: 4.2, pillarWordCounts: { "음": 2 } };

    await submitInterviewAnswer(setMock, getMock, "sess-1", 1, "ans", undefined, metrics);

    const finalCall = setMock.mock.calls[setMock.mock.calls.length - 1][0];
    expect(finalCall.interviewTurns[0]).toMatchObject({
      id: 1,
      answer: "ans",
      gazeAwayCount: 3,
      headAwayCount: 1,
      speechRateSps: 4.2,
    });
  });

  it("turnMetrics 미전달 시 default zeros 사용", async () => {
    mockSubmitAnswer.mockResolvedValue({ turns: [], followupExhausted: false });
    const setMock = jest.fn();
    const getMock = jest.fn(() => makeStore());

    await submitInterviewAnswer(setMock, getMock, "sess-1", 1, "ans");

    const finalCall = setMock.mock.calls[setMock.mock.calls.length - 1][0];
    expect(finalCall.interviewTurns[0]).toMatchObject({
      gazeAwayCount: 0,
      headAwayCount: 0,
      speechRateSps: null,
    });
  });

  it("API 에러 발생 시 phase='error' + 메시지 설정", async () => {
    mockSubmitAnswer.mockRejectedValue(new Error("network"));
    const setMock = jest.fn();
    const getMock = jest.fn(() => makeStore());

    await submitInterviewAnswer(setMock, getMock, "sess-1", 1, "ans");

    const errorCall = setMock.mock.calls.find((call) => call[0].interviewPhase === "error");
    expect(errorCall).toBeDefined();
    expect(errorCall![0].interviewError).toBe("답변 제출에 실패했습니다.");
  });

  it("finishInterview API 실패해도 phase='finished' 유지 (graceful)", async () => {
    mockSubmitAnswer.mockResolvedValue({ turns: [], followupExhausted: true });
    mockFinishInterview.mockRejectedValue(new Error("server"));
    const setMock = jest.fn();
    const getMock = jest.fn(() => makeStore());

    await submitInterviewAnswer(setMock, getMock, "sess-1", 1, "ans");

    const finalCall = setMock.mock.calls[setMock.mock.calls.length - 1][0];
    expect(finalCall.interviewPhase).toBe("finished");
  });
});

describe("submitInterviewAnswer — FULL_PROCESS 모드", () => {
  beforeEach(() => jest.clearAllMocks());

  function makeFullProcessStore() {
    return makeStore({
      interviewSession: { uuid: "sess-1", interviewSessionType: "full_process" } as never,
    });
  }

  it("interviewPhase 를 'submitting' 으로 (followup 과 다름)", async () => {
    mockSubmitAnswer.mockResolvedValue({ id: 99, question: "다음" });
    const setMock = jest.fn();
    const getMock = jest.fn(() => makeFullProcessStore());

    await submitInterviewAnswer(setMock, getMock, "sess-1", 1, "ans");

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ interviewPhase: "submitting" })
    );
  });

  it("다음 turn 응답 시 currentTurn 으로 설정 + listening 전환", async () => {
    const nextTurn = { id: 99, question: "다음 질문", answer: "" };
    mockSubmitAnswer.mockResolvedValue(nextTurn);
    const setMock = jest.fn();
    const getMock = jest.fn(() => makeFullProcessStore());

    await submitInterviewAnswer(setMock, getMock, "sess-1", 1, "ans");

    const finalCall = setMock.mock.calls[setMock.mock.calls.length - 1][0];
    expect(finalCall.currentInterviewTurn).toEqual(nextTurn);
    expect(finalCall.interviewPhase).toBe("listening");
    expect(finalCall.currentInterviewTurnIndex).toBe(1);
  });

  it("response 가 {detail: ...} 형태면 finishInterview 호출 + phase='finished'", async () => {
    mockSubmitAnswer.mockResolvedValue({ detail: "All answered" });
    mockFinishInterview.mockResolvedValue(undefined);
    const setMock = jest.fn();
    const getMock = jest.fn(() => makeFullProcessStore());

    await submitInterviewAnswer(setMock, getMock, "sess-1", 1, "ans");

    expect(mockFinishInterview).toHaveBeenCalled();
    const finalCall = setMock.mock.calls[setMock.mock.calls.length - 1][0];
    expect(finalCall.interviewPhase).toBe("finished");
  });
});
