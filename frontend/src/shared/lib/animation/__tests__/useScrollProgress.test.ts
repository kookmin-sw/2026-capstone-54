import { renderHook, act } from "@testing-library/react";
import { useScrollProgress } from "../useScrollProgress";

function setScrollGeometry(scrollHeight: number, innerHeight: number, scrollY: number): void {
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: scrollHeight,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: innerHeight,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "scrollY", {
    value: scrollY,
    writable: true,
    configurable: true,
  });
}

describe("useScrollProgress", () => {
  it("스크롤 가능 영역이 없으면 (scrollHeight <= innerHeight) → progress=0", () => {
    setScrollGeometry(500, 800, 0);
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);
  });

  it("scrollY=0 → progress=0", () => {
    setScrollGeometry(2000, 800, 0);
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);
  });

  it("scrollY=max/2 → progress=0.5", () => {
    setScrollGeometry(2000, 800, 600);
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBeCloseTo(0.5);
  });

  it("scrollY=max → progress=1", () => {
    setScrollGeometry(2000, 800, 1200);
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(1);
  });

  it("scrollY>max → progress=1 로 clamp", () => {
    setScrollGeometry(2000, 800, 9999);
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(1);
  });

  it("scrollY<0 → progress=0 으로 clamp", () => {
    setScrollGeometry(2000, 800, -100);
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);
  });

  it("scroll 이벤트 → progress 재계산", () => {
    setScrollGeometry(2000, 800, 0);
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 600, writable: true, configurable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBeCloseTo(0.5);
  });

  it("resize 이벤트 → progress 재계산 (innerHeight 변경)", () => {
    setScrollGeometry(2000, 800, 600);
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBeCloseTo(0.5);

    act(() => {
      Object.defineProperty(window, "innerHeight", { value: 1700, writable: true, configurable: true });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(1);
  });

  it("unmount → scroll/resize listener 해제 (이벤트 발생해도 갱신 안 됨)", () => {
    setScrollGeometry(2000, 800, 0);
    const { result, unmount } = renderHook(() => useScrollProgress());

    unmount();

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 1200, writable: true, configurable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(0);
  });
});
