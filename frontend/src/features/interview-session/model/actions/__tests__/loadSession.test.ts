jest.mock("../../../api/interviewApi", () => ({
  interviewApi: {
    getInterviewSession: jest.fn(),
    getInterviewTurns: jest.fn(),
    startInterview: jest.fn(),
    finishInterview: jest.fn(),
    takeoverInterviewSession: jest.fn(),
  },
}));

jest.mock("@/shared/api/client", () => ({
  isApiError: (e: unknown): e is { errorCode?: string; message?: string } =>
    typeof e === "object" && e !== null && ("errorCode" in e || "message" in e),
}));

jest.mock("sonner", () => ({
  toast: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { interviewApi } from "../../../api/interviewApi";
import { toast } from "sonner";
import {
  loadInterviewSession,
  loadInterviewTurns,
  startInterview,
  finishInterview,
} from "../loadSession";

const mockGetSession = interviewApi.getInterviewSession as jest.Mock;
const mockGetTurns = interviewApi.getInterviewTurns as jest.Mock;
const mockStart = interviewApi.startInterview as jest.Mock;
const mockFinish = interviewApi.finishInterview as jest.Mock;
const mockTakeover = interviewApi.takeoverInterviewSession as jest.Mock;
const mockToastInfo = toast.info as jest.Mock;
const mockToastError = toast.error as jest.Mock;

const SESSION_IN_PROGRESS = {
  uuid: "sess-1",
  interviewSessionType: "followup",
  interviewSessionStatus: "in_progress",
};
const SESSION_PAUSED = { ...SESSION_IN_PROGRESS, interviewSessionStatus: "paused" };
const SESSION_COMPLETED = { ...SESSION_IN_PROGRESS, interviewSessionStatus: "completed" };

const OWNERSHIP = {
  ownerToken: "owner-token",
  ownerVersion: 1,
  wsTicket: "ws-ticket",
};

describe("loadInterviewSession", () => {
  beforeEach(() => jest.clearAllMocks());

  it("connecting → 세션 응답이 completed 면 idle 로 종료 (resumable 아님)", async () => {
    mockGetSession.mockResolvedValue(SESSION_COMPLETED);
    const setMock = jest.fn();

    await loadInterviewSession(setMock, "sess-1");

    expect(setMock).toHaveBeenCalledWith({ interviewPhase: "connecting" });
    expect(setMock).toHaveBeenCalledWith({
      interviewSession: SESSION_COMPLETED,
      interviewPhase: "idle",
    });
    expect(mockGetTurns).not.toHaveBeenCalled();
  });

  it("in_progress 면 takeover 호출 + ownership 설정", async () => {
    mockGetSession.mockResolvedValue(SESSION_IN_PROGRESS);
    mockTakeover.mockResolvedValue(OWNERSHIP);
    mockGetTurns.mockResolvedValue([]);
    const setMock = jest.fn();

    await loadInterviewSession(setMock, "sess-1");

    expect(mockTakeover).toHaveBeenCalledWith("sess-1");
    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({
      ownerToken: OWNERSHIP.ownerToken,
      ownerVersion: OWNERSHIP.ownerVersion,
      wsTicket: OWNERSHIP.wsTicket,
    }));
  });

  it("paused 상태도 resumable 로 간주하여 takeover 진행", async () => {
    mockGetSession.mockResolvedValue(SESSION_PAUSED);
    mockTakeover.mockResolvedValue(OWNERSHIP);
    mockGetTurns.mockResolvedValue([]);
    const setMock = jest.fn();

    await loadInterviewSession(setMock, "sess-1");

    expect(mockTakeover).toHaveBeenCalled();
  });

  it("turns=[] 면 idle 로 종료 (시작 전)", async () => {
    mockGetSession.mockResolvedValue(SESSION_IN_PROGRESS);
    mockTakeover.mockResolvedValue(OWNERSHIP);
    mockGetTurns.mockResolvedValue([]);
    const setMock = jest.fn();

    await loadInterviewSession(setMock, "sess-1");

    const finalCall = setMock.mock.calls[setMock.mock.calls.length - 1][0];
    expect(finalCall).toMatchObject({
      interviewSession: SESSION_IN_PROGRESS,
      interviewTurns: [],
      interviewPhase: "idle",
    });
  });

  it("모든 turn 답변 완료 시 finishInterview 호출 + phase='finished'", async () => {
    const turns = [
      { id: 1, question: "Q1", answer: "A1" },
      { id: 2, question: "Q2", answer: "A2" },
    ];
    mockGetSession.mockResolvedValue(SESSION_IN_PROGRESS);
    mockTakeover.mockResolvedValue(OWNERSHIP);
    mockGetTurns.mockResolvedValue(turns);
    mockFinish.mockResolvedValue(undefined);
    const setMock = jest.fn();

    await loadInterviewSession(setMock, "sess-1");

    expect(mockFinish).toHaveBeenCalledWith("sess-1");
    const finalCall = setMock.mock.calls[setMock.mock.calls.length - 1][0];
    expect(finalCall.interviewPhase).toBe("finished");
  });

  it("부분 답변 시 firstUnansweredIdx 로 이동 + listening", async () => {
    const turns = [
      { id: 1, question: "Q1", answer: "A1" },
      { id: 2, question: "Q2", answer: "" },
      { id: 3, question: "Q3", answer: "" },
    ];
    mockGetSession.mockResolvedValue(SESSION_IN_PROGRESS);
    mockTakeover.mockResolvedValue(OWNERSHIP);
    mockGetTurns.mockResolvedValue(turns);
    const setMock = jest.fn();

    await loadInterviewSession(setMock, "sess-1");

    const finalCall = setMock.mock.calls[setMock.mock.calls.length - 1][0];
    expect(finalCall).toMatchObject({
      currentInterviewTurnIndex: 1,
      currentInterviewTurn: turns[1],
      interviewPhase: "listening",
    });
  });

  it("API 실패 시 phase='error' + 메시지", async () => {
    mockGetSession.mockRejectedValue(new Error("server"));
    const setMock = jest.fn();

    await loadInterviewSession(setMock, "sess-1");

    expect(setMock).toHaveBeenLastCalledWith({
      interviewPhase: "error",
      interviewError: "면접 세션을 불러올 수 없습니다.",
    });
  });

  it("takeover 실패해도 페이지 로드는 계속 진행 (read-only)", async () => {
    mockGetSession.mockResolvedValue(SESSION_IN_PROGRESS);
    mockTakeover.mockRejectedValue(new Error("forbidden"));
    mockGetTurns.mockResolvedValue([]);
    const setMock = jest.fn();

    await loadInterviewSession(setMock, "sess-1");

    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({
      interviewPhase: "idle",
    }));
  });
});

describe("loadInterviewTurns", () => {
  beforeEach(() => jest.clearAllMocks());

  it("성공 시 interviewTurns 설정", async () => {
    const turns = [{ id: 1, question: "Q", answer: "" }];
    mockGetTurns.mockResolvedValue(turns);
    const setMock = jest.fn();

    await loadInterviewTurns(setMock, "sess-1");

    expect(setMock).toHaveBeenCalledWith({ interviewTurns: turns });
  });

  it("실패 시 set 미호출 (silent ignore)", async () => {
    mockGetTurns.mockRejectedValue(new Error("network"));
    const setMock = jest.fn();

    await loadInterviewTurns(setMock, "sess-1");

    expect(setMock).not.toHaveBeenCalled();
  });
});

describe("startInterview", () => {
  beforeEach(() => jest.clearAllMocks());

  it("성공 시 모든 응답 필드 store 에 적용 + listening", async () => {
    const turns = [{ id: 1, question: "첫 질문", answer: "" }];
    mockStart.mockResolvedValue({
      interviewSession: SESSION_IN_PROGRESS,
      turns,
      ownerToken: "t",
      ownerVersion: 1,
      wsTicket: "ws",
    });
    const setMock = jest.fn();

    await startInterview(setMock, "sess-1");

    expect(setMock).toHaveBeenCalledWith({ interviewPhase: "starting" });
    const finalCall = setMock.mock.calls[setMock.mock.calls.length - 1][0];
    expect(finalCall).toMatchObject({
      interviewSession: SESSION_IN_PROGRESS,
      interviewTurns: turns,
      currentInterviewTurnIndex: 0,
      currentInterviewTurn: turns[0],
      interviewPhase: "listening",
      ownerToken: "t",
      ownerVersion: 1,
      wsTicket: "ws",
    });
  });

  it("INTERVIEW_ALREADY_STARTED 에러 시 toast.info + loadInterviewSession 재호출", async () => {
    mockStart.mockRejectedValue({ errorCode: "INTERVIEW_ALREADY_STARTED", message: "이미 시작됨" });
    mockGetSession.mockResolvedValue(SESSION_IN_PROGRESS);
    mockTakeover.mockResolvedValue(OWNERSHIP);
    mockGetTurns.mockResolvedValue([]);
    const setMock = jest.fn();

    await startInterview(setMock, "sess-1");

    expect(mockToastInfo).toHaveBeenCalledWith("이미 시작됨");
    expect(mockGetSession).toHaveBeenCalledWith("sess-1");
  });

  it("일반 에러 시 toast.error + phase='error'", async () => {
    mockStart.mockRejectedValue({ message: "티켓 부족" });
    const setMock = jest.fn();

    await startInterview(setMock, "sess-1");

    expect(mockToastError).toHaveBeenCalledWith("티켓 부족");
    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({
      interviewPhase: "error",
      interviewError: "티켓 부족",
    }));
  });

  it("에러 메시지 없으면 기본 메시지 사용", async () => {
    mockStart.mockRejectedValue({});
    const setMock = jest.fn();

    await startInterview(setMock, "sess-1");

    expect(mockToastError).toHaveBeenCalledWith("면접을 시작할 수 없습니다. 잠시 후 다시 시도하세요.");
  });
});

describe("finishInterview", () => {
  beforeEach(() => jest.clearAllMocks());

  it("성공 시 phase='finished'", async () => {
    mockFinish.mockResolvedValue(undefined);
    const setMock = jest.fn();

    await finishInterview(setMock, "sess-1");

    expect(mockFinish).toHaveBeenCalledWith("sess-1");
    expect(setMock).toHaveBeenCalledWith({ interviewPhase: "finished" });
  });

  it("API 실패해도 phase='finished' 로 설정 (graceful)", async () => {
    mockFinish.mockRejectedValue(new Error("server"));
    const setMock = jest.fn();

    await finishInterview(setMock, "sess-1");

    expect(setMock).toHaveBeenCalledWith({ interviewPhase: "finished" });
  });
});
