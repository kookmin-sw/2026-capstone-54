import { act } from "@testing-library/react";
import { useInterviewSessionStore } from "../store";
import { initialInterviewSessionState } from "../types";

jest.mock("../actions/loadSession", () => ({
  loadInterviewSession: jest.fn().mockResolvedValue(undefined),
  loadInterviewTurns: jest.fn().mockResolvedValue(undefined),
  startInterview: jest.fn().mockResolvedValue(undefined),
  finishInterview: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../actions/submitAnswer", () => ({
  submitInterviewAnswer: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../actions/reportStream", () => ({
  startReportPolling: jest.fn(),
  stopReportStream: jest.fn(),
}));

jest.mock("../actions/takeover", () => ({
  applyTakeover: jest.fn().mockResolvedValue(undefined),
}));

function resetStore() {
  act(() => {
    useInterviewSessionStore.setState(initialInterviewSessionState);
  });
}

describe("useInterviewSessionStore — 초기 상태", () => {
  beforeEach(resetStore);

  it("모든 상태 필드가 initialInterviewSessionState 와 일치", () => {
    const state = useInterviewSessionStore.getState();
    expect(state.interviewSession).toBeNull();
    expect(state.interviewTurns).toEqual([]);
    expect(state.currentInterviewTurnIndex).toBe(0);
    expect(state.currentInterviewTurn).toBeNull();
    expect(state.interviewPhase).toBe("idle");
    expect(state.interviewError).toBeNull();
    expect(state.interviewAnalysisReport).toBeNull();
    expect(state.isReportPolling).toBe(false);
    expect(state.ownerToken).toBeNull();
    expect(state.ownerVersion).toBeNull();
    expect(state.wsTicket).toBeNull();
    expect(state.takeoverModalOpen).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.pauseReason).toBeNull();
  });

  it("모든 액션이 함수로 노출됨", () => {
    const state = useInterviewSessionStore.getState();
    expect(typeof state.loadInterviewSession).toBe("function");
    expect(typeof state.loadInterviewTurns).toBe("function");
    expect(typeof state.startInterview).toBe("function");
    expect(typeof state.finishInterview).toBe("function");
    expect(typeof state.submitInterviewAnswer).toBe("function");
    expect(typeof state.startReportPolling).toBe("function");
    expect(typeof state.applyTakeover).toBe("function");
    expect(typeof state.setTakeoverModalOpen).toBe("function");
    expect(typeof state.setPaused).toBe("function");
    expect(typeof state.resetInterviewSession).toBe("function");
  });
});

describe("useInterviewSessionStore — setTakeoverModalOpen", () => {
  beforeEach(resetStore);

  it("true 로 호출 시 takeoverModalOpen=true", () => {
    act(() => useInterviewSessionStore.getState().setTakeoverModalOpen(true));
    expect(useInterviewSessionStore.getState().takeoverModalOpen).toBe(true);
  });

  it("false 로 호출 시 takeoverModalOpen=false", () => {
    act(() => useInterviewSessionStore.getState().setTakeoverModalOpen(true));
    act(() => useInterviewSessionStore.getState().setTakeoverModalOpen(false));
    expect(useInterviewSessionStore.getState().takeoverModalOpen).toBe(false);
  });

  it("다른 상태에 영향 없음", () => {
    act(() => useInterviewSessionStore.setState({ isPaused: true, pauseReason: "user_idle" }));
    act(() => useInterviewSessionStore.getState().setTakeoverModalOpen(true));
    expect(useInterviewSessionStore.getState().isPaused).toBe(true);
    expect(useInterviewSessionStore.getState().pauseReason).toBe("user_idle");
  });
});

describe("useInterviewSessionStore — setPaused", () => {
  beforeEach(resetStore);

  it("(true, reason) 호출 시 isPaused + pauseReason 모두 설정", () => {
    act(() => useInterviewSessionStore.getState().setPaused(true, "user_left_window"));
    const state = useInterviewSessionStore.getState();
    expect(state.isPaused).toBe(true);
    expect(state.pauseReason).toBe("user_left_window");
  });

  it("(true) reason 생략 시 pauseReason 은 null (default)", () => {
    act(() => useInterviewSessionStore.getState().setPaused(true));
    const state = useInterviewSessionStore.getState();
    expect(state.isPaused).toBe(true);
    expect(state.pauseReason).toBeNull();
  });

  it("(false, null) 호출 시 isPaused=false + pauseReason=null", () => {
    act(() => useInterviewSessionStore.getState().setPaused(true, "manual_pause"));
    act(() => useInterviewSessionStore.getState().setPaused(false, null));
    const state = useInterviewSessionStore.getState();
    expect(state.isPaused).toBe(false);
    expect(state.pauseReason).toBeNull();
  });

  it("4가지 reason 값 모두 정상 저장", () => {
    const reasons = ["user_left_window", "user_idle", "manual_pause", "heartbeat_timeout"];
    reasons.forEach((reason) => {
      act(() => useInterviewSessionStore.getState().setPaused(true, reason));
      expect(useInterviewSessionStore.getState().pauseReason).toBe(reason);
    });
  });
});

describe("useInterviewSessionStore — resetInterviewSession", () => {
  beforeEach(resetStore);

  it("dirty 상태에서 호출 시 모든 필드가 initialInterviewSessionState 로 복귀", () => {
    act(() => {
      useInterviewSessionStore.setState({
        currentInterviewTurnIndex: 5,
        interviewPhase: "listening",
        interviewError: "previous error",
        isPaused: true,
        pauseReason: "manual_pause",
        takeoverModalOpen: true,
        wsTicket: "ticket-abc",
      });
    });

    expect(useInterviewSessionStore.getState().currentInterviewTurnIndex).toBe(5);

    act(() => useInterviewSessionStore.getState().resetInterviewSession());

    const state = useInterviewSessionStore.getState();
    expect(state.currentInterviewTurnIndex).toBe(0);
    expect(state.interviewPhase).toBe("idle");
    expect(state.interviewError).toBeNull();
    expect(state.isPaused).toBe(false);
    expect(state.pauseReason).toBeNull();
    expect(state.takeoverModalOpen).toBe(false);
    expect(state.wsTicket).toBeNull();
  });

  it("호출 후 액션 함수들은 여전히 사용 가능", () => {
    act(() => useInterviewSessionStore.getState().resetInterviewSession());
    const state = useInterviewSessionStore.getState();
    expect(typeof state.setPaused).toBe("function");
    expect(typeof state.setTakeoverModalOpen).toBe("function");
  });
});

describe("useInterviewSessionStore — selector 안정성", () => {
  beforeEach(resetStore);

  it("동일 selector 가 동일 reference 반환 (참조 안정성)", () => {
    const isPaused1 = useInterviewSessionStore.getState().isPaused;
    const isPaused2 = useInterviewSessionStore.getState().isPaused;
    expect(isPaused1).toBe(isPaused2);
  });

  it("setPaused 호출 후 getState 가 새 값 반영", () => {
    expect(useInterviewSessionStore.getState().isPaused).toBe(false);
    act(() => useInterviewSessionStore.getState().setPaused(true, "user_idle"));
    expect(useInterviewSessionStore.getState().isPaused).toBe(true);
  });
});
