import { renderHook, act } from "@testing-library/react";
import { useIdleDetector } from "../useIdleDetector";

describe("useIdleDetector", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-05-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("enabled=false → 시간이 흘러도 isIdle=false 유지 (interval 미설정)", () => {
    const { result } = renderHook(() =>
      useIdleDetector({ enabled: false, thresholdMs: 1000, faceVisible: false }),
    );

    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(result.current.isIdle).toBe(false);
  });

  it("enabled=true + threshold 경과 + faceVisible=false → isIdle=true", () => {
    const { result } = renderHook(() =>
      useIdleDetector({ enabled: true, thresholdMs: 2000, faceVisible: false }),
    );

    expect(result.current.isIdle).toBe(false);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.isIdle).toBe(true);
  });

  it("isIdle=true 상태에서 input 이벤트 발생 → 다음 tick 에 isIdle=false", () => {
    const { result } = renderHook(() =>
      useIdleDetector({ enabled: true, thresholdMs: 2000, faceVisible: false }),
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.isIdle).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("mousemove"));
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.isIdle).toBe(false);
  });

  it("faceVisible 토글 (true→false→true) → faceIdle 시간 갱신되어 threshold 미만 시 isIdle=false", () => {
    const { result, rerender } = renderHook(
      ({ fv }: { fv: boolean }) =>
        useIdleDetector({ enabled: true, thresholdMs: 2000, faceVisible: fv }),
      { initialProps: { fv: true } },
    );

    act(() => {
      jest.advanceTimersByTime(1500);
      window.dispatchEvent(new Event("mousemove"));
    });
    rerender({ fv: false });
    rerender({ fv: true });
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(result.current.isIdle).toBe(false);
  });

  it("resetIdle 호출 → isIdle=false 로 강제 복귀", () => {
    const { result } = renderHook(() =>
      useIdleDetector({ enabled: true, thresholdMs: 1000, faceVisible: false }),
    );

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.isIdle).toBe(true);

    act(() => result.current.resetIdle());
    expect(result.current.isIdle).toBe(false);
  });

  it("unmount → INPUT_EVENTS 리스너 해제 + interval clear", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() =>
      useIdleDetector({ enabled: true, thresholdMs: 1000, faceVisible: false }),
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("enabled prop 토글 → true 일 때만 idle 측정 (false 전환 시 isIdle 갱신 멈춤)", () => {
    const { result, rerender } = renderHook(
      ({ en }: { en: boolean }) =>
        useIdleDetector({ enabled: en, thresholdMs: 1000, faceVisible: false }),
      { initialProps: { en: true } },
    );

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(result.current.isIdle).toBe(true);

    rerender({ en: false });
    act(() => result.current.resetIdle());

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.isIdle).toBe(false);
  });
});
