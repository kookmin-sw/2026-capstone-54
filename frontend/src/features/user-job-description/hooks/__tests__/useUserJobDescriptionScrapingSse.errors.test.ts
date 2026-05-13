import { renderHook, act } from "@testing-library/react";
import { makeSseStreamMock } from "@/test-utils";

const { stream, mock: openSseStreamMock } = makeSseStreamMock();

jest.mock("@/shared/api/sse", () => ({
  openSseStream: (...args: Parameters<typeof openSseStreamMock>) => openSseStreamMock(...args),
}));

import { useUserJobDescriptionScrapingSse } from "../useUserJobDescriptionScrapingSse";

describe("useUserJobDescriptionScrapingSse — 에러 경로 (기존 테스트 보강)", () => {
  beforeEach(() => {
    stream.reset();
    openSseStreamMock.mockClear();
  });

  it("event='error' + data.message 있음 → 해당 message 로 Error", () => {
    const onError = jest.fn();
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "j-1", enabled: true, onError }),
    );

    act(() => stream.emit("error", { message: "사이트 차단됨" }));

    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0][0] as Error).message).toBe("사이트 차단됨");
  });

  it("event='error' + data 가 string 이면 그 문자열을 메시지로 사용", () => {
    const onError = jest.fn();
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "j-1", enabled: true, onError }),
    );

    act(() => stream.emit("error", "직접 에러 문자열"));

    expect((onError.mock.calls[0][0] as Error).message).toBe("직접 에러 문자열");
  });

  it("event='error' + data=null → 기본 메시지", () => {
    const onError = jest.fn();
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "j-1", enabled: true, onError }),
    );

    act(() => stream.emit("error", null));

    expect((onError.mock.calls[0][0] as Error).message).toMatch(/받을 수 없어요/);
  });

  it("event='error' 발생 후 shouldReconnect=false (재연결 차단)", () => {
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "j-1", enabled: true }),
    );

    expect(stream.triggerReconnectCheck()).toBe(true);

    act(() => stream.emit("error", { message: "err" }));

    expect(stream.triggerReconnectCheck()).toBe(false);
  });

  it("transport-level onError → onError 콜백 호출", () => {
    const onError = jest.fn();
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "j-1", enabled: true, onError }),
    );

    act(() => stream.emitError(new Error("network down")));

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect((onError.mock.calls[0][0] as Error).message).toBe("network down");
  });

  it("terminal (done) 이후 transport onError 무시 (중복 방지)", () => {
    const onError = jest.fn();
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "j-1", enabled: true, onError }),
    );

    act(() => stream.emit("status", { collection_status: "done", updated_at: null }));

    act(() => stream.emitError(new Error("late")));

    expect(onError).not.toHaveBeenCalled();
  });

  it("terminal status 이후에도 backend 'error' event 는 별도로 처리됨 (가드 없음)", () => {
    const onError = jest.fn();
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "j-1", enabled: true, onError }),
    );

    act(() => stream.emit("status", { collection_status: "error", updated_at: null }));
    act(() => stream.emit("error", { message: "추가 에러" }));

    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0][0] as Error).message).toBe("추가 에러");
  });
});

describe("useUserJobDescriptionScrapingSse — status 이벤트 추가 케이스", () => {
  beforeEach(() => {
    stream.reset();
    openSseStreamMock.mockClear();
  });

  it("'error' collection_status 도 terminal 로 인정 → onTerminal 호출", () => {
    const onTerminal = jest.fn();
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "j-1", enabled: true, onTerminal }),
    );

    act(() => stream.emit("status", { collection_status: "error", updated_at: null }));

    expect(onTerminal).toHaveBeenCalledTimes(1);
  });

  it("data=null 인 status 는 무시 (방어 코드)", () => {
    const onStatus = jest.fn();
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "j-1", enabled: true, onStatus }),
    );

    act(() => stream.emit("status", null));

    expect(onStatus).not.toHaveBeenCalled();
  });
});

describe("useUserJobDescriptionScrapingSse — 콜백 ref 안정성", () => {
  beforeEach(() => {
    stream.reset();
    openSseStreamMock.mockClear();
  });

  it("콜백만 변경되어도 SSE 재연결 안 함 (deps: uuid + enabled 만)", () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const { rerender } = renderHook(
      ({ cb }: { cb: jest.Mock }) =>
        useUserJobDescriptionScrapingSse({ uuid: "j-1", enabled: true, onStatus: cb }),
      { initialProps: { cb: cb1 } },
    );

    expect(openSseStreamMock).toHaveBeenCalledTimes(1);
    rerender({ cb: cb2 });
    expect(openSseStreamMock).toHaveBeenCalledTimes(1);

    act(() => stream.emit("status", { collection_status: "in_progress", updated_at: null }));
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});
