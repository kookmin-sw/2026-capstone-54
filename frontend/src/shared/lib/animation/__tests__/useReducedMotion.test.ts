import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "../useReducedMotion";

interface MockMediaQueryList {
  matches: boolean;
  listeners: Set<(e: { matches: boolean }) => void>;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  dispatch: (matches: boolean) => void;
}

function installMatchMedia(initialMatches: boolean): MockMediaQueryList {
  const mql: MockMediaQueryList = {
    matches: initialMatches,
    listeners: new Set(),
    addEventListener: jest.fn((event: string, cb: (e: { matches: boolean }) => void) => {
      if (event === "change") mql.listeners.add(cb);
    }),
    removeEventListener: jest.fn((event: string, cb: (e: { matches: boolean }) => void) => {
      if (event === "change") mql.listeners.delete(cb);
    }),
    dispatch(matches: boolean) {
      mql.matches = matches;
      mql.listeners.forEach((cb) => cb({ matches }));
    },
  };
  Object.defineProperty(window, "matchMedia", {
    value: jest.fn().mockReturnValue(mql),
    writable: true,
    configurable: true,
  });
  return mql;
}

describe("useReducedMotion", () => {
  it("초기 matchMedia.matches=false → reduced=false", () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("초기 matchMedia.matches=true → reduced=true", () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("change 이벤트로 matches=true → reduced=true 로 업데이트", () => {
    const mql = installMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => mql.dispatch(true));

    expect(result.current).toBe(true);
  });

  it("change 이벤트로 matches=false → reduced=false 로 업데이트", () => {
    const mql = installMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());

    act(() => mql.dispatch(false));

    expect(result.current).toBe(false);
  });

  it("unmount → removeEventListener 호출 (listener 해제)", () => {
    const mql = installMatchMedia(false);
    const { unmount } = renderHook(() => useReducedMotion());

    expect(mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    expect(mql.listeners.size).toBe(0);
  });
});
