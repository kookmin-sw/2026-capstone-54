import { renderHook, act } from "@testing-library/react";
import { openSseStream } from "@/shared/api/sse";
import {
  useUserJobDescriptionScrapingSse,
  type UserJobDescriptionCollectionStatusEvent,
} from "../useUserJobDescriptionScrapingSse";

jest.mock("@/shared/api/sse", () => ({
  openSseStream: jest.fn(),
}));

const mockOpenSseStream = openSseStream as jest.MockedFunction<typeof openSseStream>;

describe("useUserJobDescriptionScrapingSse", () => {
  let capturedOnEvent: (event: string, data: unknown) => void;
  let capturedShouldReconnect: () => boolean;
  let mockCancel: jest.Mock;

  beforeEach(() => {
    mockCancel = jest.fn();
    mockOpenSseStream.mockImplementation((_path, onEvent, options) => {
      capturedOnEvent = onEvent;
      capturedShouldReconnect = options?.shouldReconnect ?? (() => false);
      return mockCancel;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("disabled: enabled=false이면 openSseStream을 호출하지 않는다", () => {
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "test-uuid", enabled: false }),
    );
    expect(mockOpenSseStream).not.toHaveBeenCalled();
  });

  it("enabled_calls_stream: enabled=true + uuid이면 올바른 URL로 openSseStream을 호출한다", () => {
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "abc-123", enabled: true }),
    );
    expect(mockOpenSseStream).toHaveBeenCalledWith(
      "/sse/user-job-descriptions/abc-123/collection-status/",
      expect.any(Function),
      expect.any(Object),
    );
  });

  it("onStatus_callback: status 이벤트 수신 시 onStatus 콜백을 호출한다", () => {
    const onStatus = jest.fn();
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "abc-123", enabled: true, onStatus }),
    );

    const payload: UserJobDescriptionCollectionStatusEvent = {
      collection_status: "in_progress",
      updated_at: null,
    };
    act(() => {
      capturedOnEvent("status", payload);
    });

    expect(onStatus).toHaveBeenCalledWith(payload);
    expect(onStatus).toHaveBeenCalledTimes(1);
  });

  it("onTerminal_callback: done status 수신 시 onTerminal 콜백이 1회 호출된다", () => {
    const onStatus = jest.fn();
    const onTerminal = jest.fn();
    renderHook(() =>
      useUserJobDescriptionScrapingSse({
        uuid: "abc-123",
        enabled: true,
        onStatus,
        onTerminal,
      }),
    );

    const payload: UserJobDescriptionCollectionStatusEvent = {
      collection_status: "done",
      updated_at: "2024-01-01T00:00:00Z",
    };
    act(() => {
      capturedOnEvent("status", payload);
    });

    expect(onTerminal).toHaveBeenCalledWith(payload);
    expect(onTerminal).toHaveBeenCalledTimes(1);

    // 동일한 terminal 이벤트를 다시 받아도 onTerminal은 다시 호출되지 않는다
    act(() => {
      capturedOnEvent("status", payload);
    });
    expect(onTerminal).toHaveBeenCalledTimes(1);
  });

  it("onTerminal_callback: error status 수신 시에도 onTerminal 콜백이 호출된다", () => {
    const onTerminal = jest.fn();
    renderHook(() =>
      useUserJobDescriptionScrapingSse({
        uuid: "abc-123",
        enabled: true,
        onTerminal,
      }),
    );

    const payload: UserJobDescriptionCollectionStatusEvent = {
      collection_status: "error",
      updated_at: null,
    };
    act(() => {
      capturedOnEvent("status", payload);
    });

    expect(onTerminal).toHaveBeenCalledWith(payload);
    expect(onTerminal).toHaveBeenCalledTimes(1);
  });

  it("no_reconnect_after_terminal: terminal 이후 shouldReconnect가 false를 반환한다", () => {
    renderHook(() =>
      useUserJobDescriptionScrapingSse({ uuid: "abc-123", enabled: true }),
    );

    // terminal 발생 전: 재연결 허용
    expect(capturedShouldReconnect()).toBe(true);

    // terminal event 발생
    act(() => {
      capturedOnEvent("status", { collection_status: "done", updated_at: null });
    });

    // terminal 이후: 재연결 불허
    expect(capturedShouldReconnect()).toBe(false);
  });
});
