import { renderHook, act } from "@testing-library/react";
import { makeSseStreamMock, flushMicrotasks } from "@/test-utils";

const { stream, mock: openSseStreamMock } = makeSseStreamMock();

jest.mock("@/shared/api/sse", () => ({
  openSseStream: (...args: Parameters<typeof openSseStreamMock>) => openSseStreamMock(...args),
}));

import { useResumeAnalysisSse } from "../useResumeAnalysisSse";

describe("useResumeAnalysisSse — 구독 lifecycle", () => {
  beforeEach(() => {
    stream.reset();
    openSseStreamMock.mockClear();
  });

  it("enabled=false 면 openSseStream 호출 안 함", () => {
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: false }),
    );
    expect(openSseStreamMock).not.toHaveBeenCalled();
  });

  it("uuid 미정 (undefined) 이면 openSseStream 호출 안 함", () => {
    renderHook(() =>
      useResumeAnalysisSse({ uuid: undefined, enabled: true }),
    );
    expect(openSseStreamMock).not.toHaveBeenCalled();
  });

  it("enabled=true + uuid 있으면 SSE 스트림 열림 (정확한 URL)", () => {
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true }),
    );
    expect(openSseStreamMock).toHaveBeenCalledTimes(1);
    expect(stream.url).toBe("/sse/resumes/r-1/analysis-status/");
  });

  it("unmount 시 cancel 함수 호출", () => {
    const { unmount } = renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true }),
    );
    expect(stream.cancelCalled).toBe(false);
    unmount();
    expect(stream.cancelCalled).toBe(true);
  });

  it("uuid 변경 시 기존 cancel + 새 스트림 생성", () => {
    const { rerender } = renderHook(
      (props: { uuid: string }) =>
        useResumeAnalysisSse({ uuid: props.uuid, enabled: true }),
      { initialProps: { uuid: "r-1" } },
    );
    expect(stream.url).toBe("/sse/resumes/r-1/analysis-status/");

    rerender({ uuid: "r-2" });
    expect(stream.url).toBe("/sse/resumes/r-2/analysis-status/");
    expect(openSseStreamMock).toHaveBeenCalledTimes(2);
  });
});

describe("useResumeAnalysisSse — status 이벤트 처리", () => {
  beforeEach(() => {
    stream.reset();
    openSseStreamMock.mockClear();
  });

  it("non-terminal status 이벤트 시 onStatus 호출, onTerminal 미호출", () => {
    const onStatus = jest.fn();
    const onTerminal = jest.fn();
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true, onStatus, onTerminal }),
    );

    act(() => stream.emit("status", {
      analysis_status: "in_progress",
      analysis_step: "embedding",
      updated_at: "2026-05-10T12:00:00Z",
    }));

    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(onTerminal).not.toHaveBeenCalled();
  });

  it("'completed' status 시 onStatus + onTerminal 둘 다 한 번씩 호출", () => {
    const onStatus = jest.fn();
    const onTerminal = jest.fn();
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true, onStatus, onTerminal }),
    );

    const event = {
      analysis_status: "completed" as const,
      analysis_step: "finalize" as const,
      updated_at: "2026-05-10T12:00:00Z",
    };

    act(() => stream.emit("status", event));

    expect(onStatus).toHaveBeenCalledWith(event);
    expect(onTerminal).toHaveBeenCalledWith(event);
  });

  it("'failed' status 시 onTerminal 호출", () => {
    const onTerminal = jest.fn();
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true, onTerminal }),
    );

    act(() => stream.emit("status", {
      analysis_status: "failed",
      analysis_step: "embedding",
      updated_at: null,
    }));

    expect(onTerminal).toHaveBeenCalledTimes(1);
  });

  it("terminal 도달 후 추가 status 이벤트엔 onTerminal 미중복 호출", () => {
    const onTerminal = jest.fn();
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true, onTerminal }),
    );

    act(() => stream.emit("status", {
      analysis_status: "completed",
      analysis_step: "finalize",
      updated_at: null,
    }));
    act(() => stream.emit("status", {
      analysis_status: "completed",
      analysis_step: "finalize",
      updated_at: null,
    }));

    expect(onTerminal).toHaveBeenCalledTimes(1);
  });

  it("terminal 도달 후 shouldReconnect=false 반환 (재연결 차단)", () => {
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true }),
    );

    expect(stream.triggerReconnectCheck()).toBe(true);

    act(() => stream.emit("status", {
      analysis_status: "completed",
      analysis_step: "finalize",
      updated_at: null,
    }));

    expect(stream.triggerReconnectCheck()).toBe(false);
  });
});

describe("useResumeAnalysisSse — error 이벤트 처리", () => {
  beforeEach(() => {
    stream.reset();
    openSseStreamMock.mockClear();
  });

  it("event='error' 시 onError 콜백 (백엔드 명시적 에러)", () => {
    const onError = jest.fn();
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true, onError }),
    );

    act(() => stream.emit("error", { message: "권한 없음" }));

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((onError.mock.calls[0][0] as Error).message).toBe("권한 없음");
  });

  it("event='error' 메시지 없으면 기본 메시지 사용", () => {
    const onError = jest.fn();
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true, onError }),
    );

    act(() => stream.emit("error", {}));

    expect((onError.mock.calls[0][0] as Error).message).toMatch(/받을 수 없어요/);
  });

  it("transport-level onError 콜백 (네트워크 끊김 등) → onError 호출", () => {
    const onError = jest.fn();
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true, onError }),
    );

    act(() => stream.emitError(new Error("network")));

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("terminal 이후 transport-level onError 는 무시 (중복 방지)", () => {
    const onError = jest.fn();
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true, onError }),
    );

    act(() => stream.emit("status", {
      analysis_status: "completed",
      analysis_step: "finalize",
      updated_at: null,
    }));

    act(() => stream.emitError(new Error("late network error")));

    expect(onError).not.toHaveBeenCalled();
  });

  it("backend error 이후엔 transport onError 무시 (terminalFired=true)", () => {
    const onError = jest.fn();
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true, onError }),
    );

    act(() => stream.emit("error", { message: "오류" }));
    act(() => stream.emitError(new Error("transport")));

    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("useResumeAnalysisSse — 잘못된 data 처리", () => {
  beforeEach(() => {
    stream.reset();
    openSseStreamMock.mockClear();
  });

  it("data=null 이면 onStatus 미호출 (방어 코드)", () => {
    const onStatus = jest.fn();
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true, onStatus }),
    );

    act(() => stream.emit("status", null));

    expect(onStatus).not.toHaveBeenCalled();
  });

  it("data 가 object 가 아니면 무시 (string 등)", () => {
    const onStatus = jest.fn();
    renderHook(() =>
      useResumeAnalysisSse({ uuid: "r-1", enabled: true, onStatus }),
    );

    act(() => stream.emit("status", "not-an-object"));

    expect(onStatus).not.toHaveBeenCalled();
  });
});

describe("useResumeAnalysisSse — 콜백 ref 안정성 (재구독 방지)", () => {
  beforeEach(() => {
    stream.reset();
    openSseStreamMock.mockClear();
  });

  it("콜백 변경되어도 SSE 재연결 안 함 (deps: uuid + enabled 만)", async () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const { rerender } = renderHook(
      ({ cb }: { cb: jest.Mock }) =>
        useResumeAnalysisSse({ uuid: "r-1", enabled: true, onStatus: cb }),
      { initialProps: { cb: callback1 } },
    );

    expect(openSseStreamMock).toHaveBeenCalledTimes(1);

    rerender({ cb: callback2 });
    await flushMicrotasks();

    expect(openSseStreamMock).toHaveBeenCalledTimes(1);

    act(() => stream.emit("status", {
      analysis_status: "in_progress",
      analysis_step: "extract",
      updated_at: null,
    }));

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
