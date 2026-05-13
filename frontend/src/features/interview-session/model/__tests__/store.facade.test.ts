const mockLoadSession = jest.fn();
const mockLoadTurns = jest.fn();
const mockStartInterview = jest.fn();
const mockFinishInterview = jest.fn();
const mockSubmitAnswer = jest.fn();
const mockStartReportPolling = jest.fn();
const mockStopReportStream = jest.fn();
const mockApplyTakeover = jest.fn();

jest.mock("../actions/loadSession", () => ({
  loadInterviewSession: (...a: unknown[]) => mockLoadSession(...a),
  loadInterviewTurns: (...a: unknown[]) => mockLoadTurns(...a),
  startInterview: (...a: unknown[]) => mockStartInterview(...a),
  finishInterview: (...a: unknown[]) => mockFinishInterview(...a),
}));

jest.mock("../actions/submitAnswer", () => ({
  submitInterviewAnswer: (...a: unknown[]) => mockSubmitAnswer(...a),
}));

jest.mock("../actions/reportStream", () => ({
  startReportPolling: (...a: unknown[]) => mockStartReportPolling(...a),
  stopReportStream: (...a: unknown[]) => mockStopReportStream(...a),
}));

jest.mock("../actions/takeover", () => ({
  applyTakeover: (...a: unknown[]) => mockApplyTakeover(...a),
}));

import { useInterviewSessionStore } from "../store";
import { initialInterviewSessionState } from "../types";

beforeEach(() => {
  jest.clearAllMocks();
  useInterviewSessionStore.setState(initialInterviewSessionState);
});

describe("useInterviewSessionStore — facade action 위임", () => {
  it("loadInterviewSession(uuid) → action 에 (set, uuid) 위임", () => {
    useInterviewSessionStore.getState().loadInterviewSession("u-1");
    expect(mockLoadSession).toHaveBeenCalledWith(expect.any(Function), "u-1");
  });

  it("loadInterviewTurns(uuid) → action 위임", () => {
    useInterviewSessionStore.getState().loadInterviewTurns("u-2");
    expect(mockLoadTurns).toHaveBeenCalledWith(expect.any(Function), "u-2");
  });

  it("startInterview(uuid) → action 위임", () => {
    useInterviewSessionStore.getState().startInterview("u-3");
    expect(mockStartInterview).toHaveBeenCalledWith(expect.any(Function), "u-3");
  });

  it("finishInterview(uuid) → action 위임", () => {
    useInterviewSessionStore.getState().finishInterview("u-4");
    expect(mockFinishInterview).toHaveBeenCalledWith(expect.any(Function), "u-4");
  });

  it("submitInterviewAnswer(uuid, turnPk, answer, segments, metrics) → 모든 인자 전달", () => {
    useInterviewSessionStore.getState().submitInterviewAnswer(
      "u-1",
      3,
      "내 답변",
      [{ text: "x", startMs: 0, endMs: 100 }],
      { gazeAwayCount: 2, headAwayCount: 1, speechRateSps: 4.5, pillarWordCounts: {} },
    );

    expect(mockSubmitAnswer).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      "u-1",
      3,
      "내 답변",
      [{ text: "x", startMs: 0, endMs: 100 }],
      expect.objectContaining({ gazeAwayCount: 2 }),
    );
  });

  it("startReportPolling(uuid) → reportStream action 위임", () => {
    useInterviewSessionStore.getState().startReportPolling("u-5");
    expect(mockStartReportPolling).toHaveBeenCalledWith(expect.any(Function), "u-5");
  });

  it("applyTakeover(uuid) → takeover action 위임", () => {
    useInterviewSessionStore.getState().applyTakeover("u-6");
    expect(mockApplyTakeover).toHaveBeenCalledWith(expect.any(Function), "u-6");
  });

  it("resetInterviewSession → stopReportStream 자동 호출", () => {
    useInterviewSessionStore.getState().resetInterviewSession();
    expect(mockStopReportStream).toHaveBeenCalledTimes(1);
  });
});
