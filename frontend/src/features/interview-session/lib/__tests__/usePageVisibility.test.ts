import { renderHook, act } from "@testing-library/react";
import { usePageVisibility } from "../usePageVisibility";

function setVisibilityState(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
}

function setHasFocus(value: boolean) {
  Object.defineProperty(document, "hasFocus", { value: () => value, configurable: true });
}

describe("usePageVisibility", () => {
  beforeEach(() => {
    setVisibilityState("visible");
    setHasFocus(true);
  });

  it("초기값은 true (visible + focused)", () => {
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);
  });

  it("초기 mount 시점에 document.hidden 이면 false", () => {
    setVisibilityState("hidden");
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(false);
  });

  it("window blur 이벤트 시 false 로 전환 (탭/창 포커스 이탈)", () => {
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);

    act(() => {
      setHasFocus(false);
      window.dispatchEvent(new Event("blur"));
    });
    expect(result.current).toBe(false);
  });

  it("window focus 이벤트 시 true 로 복귀 (visibility=visible & hasFocus=true)", () => {
    const { result } = renderHook(() => usePageVisibility());

    act(() => {
      setHasFocus(false);
      window.dispatchEvent(new Event("blur"));
    });
    expect(result.current).toBe(false);

    act(() => {
      setHasFocus(true);
      window.dispatchEvent(new Event("focus"));
    });
    expect(result.current).toBe(true);
  });

  it("visibilitychange (hidden) 시 false", () => {
    const { result } = renderHook(() => usePageVisibility());

    act(() => {
      setVisibilityState("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current).toBe(false);
  });

  it("pagehide 시 false", () => {
    const { result } = renderHook(() => usePageVisibility());

    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(result.current).toBe(false);
  });
});
