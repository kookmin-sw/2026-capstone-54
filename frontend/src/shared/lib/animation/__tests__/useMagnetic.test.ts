const mockGsapTo = jest.fn();
const mockKillTweensOf = jest.fn();
let mockReduced = false;

jest.mock("../gsap-config", () => ({
  gsap: {
    to: (...args: unknown[]) => mockGsapTo(...args),
    killTweensOf: (...args: unknown[]) => mockKillTweensOf(...args),
  },
}));

jest.mock("../useReducedMotion", () => ({
  useReducedMotion: () => mockReduced,
}));

import { renderHook } from "@testing-library/react";
import { useMagnetic } from "../useMagnetic";

function installMatchMedia(pointerFine: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    value: jest.fn().mockImplementation((q: string) => ({
      matches: q.includes("pointer: fine") ? pointerFine : false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
    writable: true,
    configurable: true,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockReduced = false;
  installMatchMedia(true);
});

describe("useMagnetic", () => {
  it("ref.current=null → effect 본문 미실행 (gsap.to 호출 없음)", () => {
    renderHook(() => useMagnetic<HTMLDivElement>());
    expect(mockGsapTo).not.toHaveBeenCalled();
  });

  it("reducedMotion=true → effect 본문 미실행 (listener 미설치)", () => {
    mockReduced = true;
    const { result } = renderHook(() => useMagnetic<HTMLDivElement>());
    const el = document.createElement("div");
    document.body.appendChild(el);
    result.current.current = el;

    el.dispatchEvent(new MouseEvent("mousemove", { clientX: 50, clientY: 50 }));
    expect(mockGsapTo).not.toHaveBeenCalled();

    document.body.removeChild(el);
  });

  it("pointer: fine 미지원 → listener 미설치", () => {
    installMatchMedia(false);
    const el = document.createElement("div");
    document.body.appendChild(el);
    const { result } = renderHook(() => useMagnetic<HTMLDivElement>());
    result.current.current = el;

    el.dispatchEvent(new MouseEvent("mousemove", { clientX: 50, clientY: 50 }));
    expect(mockGsapTo).not.toHaveBeenCalled();

    document.body.removeChild(el);
  });

  function setupEl(): HTMLDivElement {
    const el = document.createElement("div");
    Object.defineProperty(el, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 100, height: 50, right: 100, bottom: 50, x: 0, y: 0, toJSON: () => ({}) }),
    });
    document.body.appendChild(el);
    return el;
  }

  function attachAndTriggerEffect<P>(
    el: HTMLDivElement,
    opts: P | undefined,
  ): ReturnType<typeof renderHook> {
    mockReduced = true;
    const hook = renderHook(({ o }: { o: P | undefined }) =>
      useMagnetic<HTMLDivElement>(o as Parameters<typeof useMagnetic>[0]),
      { initialProps: { o: opts } as { o: P | undefined } },
    );
    (hook.result.current as { current: HTMLDivElement | null }).current = el;
    mockReduced = false;
    hook.rerender({ o: opts });
    return hook as unknown as ReturnType<typeof renderHook>;
  }

  it("정상 환경 + ref 부착 후 effect 재실행 → mousemove 핸들러 등록", () => {
    const el = setupEl();
    attachAndTriggerEffect(el, undefined);

    el.dispatchEvent(new MouseEvent("mousemove", { clientX: 60, clientY: 30 }));
    expect(mockGsapTo).toHaveBeenCalled();
    expect(mockGsapTo.mock.calls[0][0]).toBe(el);
    const props = mockGsapTo.mock.calls[0][1] as { x: number; y: number; scale: number };
    expect(typeof props.x).toBe("number");
    expect(typeof props.y).toBe("number");
    expect(props.scale).toBe(1.04);

    document.body.removeChild(el);
  });

  it("mouseleave → gsap.to 호출하여 원위치 복귀 (x:0, y:0, scale:1)", () => {
    const el = setupEl();
    attachAndTriggerEffect(el, undefined);

    el.dispatchEvent(new MouseEvent("mouseleave"));
    const leaveCall = mockGsapTo.mock.calls.find(
      (c) => (c[1] as { x: number }).x === 0 && (c[1] as { y: number }).y === 0,
    );
    expect(leaveCall).toBeDefined();
    expect((leaveCall![1] as { scale: number }).scale).toBe(1);

    document.body.removeChild(el);
  });

  it("커스텀 strength/scale/duration prop 전달", () => {
    const el = setupEl();
    attachAndTriggerEffect(el, { strength: 0.6, scale: 1.2, duration: 0.8 });

    el.dispatchEvent(new MouseEvent("mousemove", { clientX: 60, clientY: 30 }));
    const props = mockGsapTo.mock.calls[0][1] as { scale: number; duration: number };
    expect(props.scale).toBe(1.2);
    expect(props.duration).toBe(0.8);

    document.body.removeChild(el);
  });

  it("unmount → killTweensOf 호출", () => {
    const el = setupEl();
    const hook = attachAndTriggerEffect(el, undefined);

    hook.unmount();
    expect(mockKillTweensOf).toHaveBeenCalledWith(el);

    document.body.removeChild(el);
  });
});
