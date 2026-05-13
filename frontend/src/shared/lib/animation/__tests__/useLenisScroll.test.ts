const mockLenisOn = jest.fn();
const mockLenisOff = jest.fn();
const mockLenisRaf = jest.fn();
const mockLenisScrollTo = jest.fn();
const mockLenisDestroy = jest.fn();

interface MockLenis {
  on: jest.Mock;
  off: jest.Mock;
  raf: jest.Mock;
  scrollTo: jest.Mock;
  destroy: jest.Mock;
  scroll: number;
}

let lastLenis: MockLenis | null = null;
let constructedWith: Record<string, unknown> | null = null;

const MockLenisCtor = jest.fn((opts: Record<string, unknown>) => {
  constructedWith = opts;
  lastLenis = {
    on: mockLenisOn,
    off: mockLenisOff,
    raf: mockLenisRaf,
    scrollTo: mockLenisScrollTo,
    destroy: mockLenisDestroy,
    scroll: 0,
  };
  return lastLenis;
});

jest.mock("lenis", () => ({ __esModule: true, default: MockLenisCtor }));

const mockGsapTickerAdd = jest.fn();
const mockGsapTickerRemove = jest.fn();
const mockGsapTickerLag = jest.fn();
const mockRegisterGsapPlugins = jest.fn();
const mockScrollTriggerUpdate = jest.fn();

jest.mock("../gsap-config", () => ({
  gsap: {
    ticker: {
      add: (...a: unknown[]) => mockGsapTickerAdd(...a),
      remove: (...a: unknown[]) => mockGsapTickerRemove(...a),
      lagSmoothing: (...a: unknown[]) => mockGsapTickerLag(...a),
    },
  },
  registerGsapPlugins: () => mockRegisterGsapPlugins(),
  ScrollTrigger: { update: () => mockScrollTriggerUpdate() },
}));

let mockReduced = false;
jest.mock("../useReducedMotion", () => ({
  useReducedMotion: () => mockReduced,
}));

import { renderHook } from "@testing-library/react";
import { useLenisScroll } from "../useLenisScroll";

beforeEach(() => {
  jest.clearAllMocks();
  mockReduced = false;
  lastLenis = null;
  constructedWith = null;
});

describe("useLenisScroll — enabled / reduced 가드", () => {
  it("enabled=false → Lenis 생성 안 함 + gsap.ticker.add 호출 안 함", () => {
    renderHook(() => useLenisScroll({ enabled: false }));
    expect(MockLenisCtor).not.toHaveBeenCalled();
    expect(mockGsapTickerAdd).not.toHaveBeenCalled();
  });

  it("reducedMotion=true → Lenis 생성 안 함 (접근성 우선)", () => {
    mockReduced = true;
    renderHook(() => useLenisScroll({ enabled: true }));
    expect(MockLenisCtor).not.toHaveBeenCalled();
  });

  it("enabled=true + reduced=false → Lenis 인스턴스화 + registerGsapPlugins 호출", () => {
    renderHook(() => useLenisScroll());
    expect(mockRegisterGsapPlugins).toHaveBeenCalledTimes(1);
    expect(MockLenisCtor).toHaveBeenCalledTimes(1);
  });
});

describe("useLenisScroll — Lenis 옵션", () => {
  it("기본 duration=1.1, smoothWheel=true (pageSnapSelector 없을 때)", () => {
    renderHook(() => useLenisScroll());
    expect(constructedWith).toMatchObject({ duration: 1.1, smoothWheel: true });
  });

  it("custom duration 전달 + pageSnapSelector 있으면 smoothWheel=false", () => {
    document.body.innerHTML = `<section class="snap"></section>`;
    renderHook(() => useLenisScroll({ duration: 2, pageSnapSelector: ".snap" }));

    expect(constructedWith).toMatchObject({ duration: 2, smoothWheel: false });
  });

  it("LENIS_EASING easing 함수 전달 (t=1 → 1 근처)", () => {
    renderHook(() => useLenisScroll());
    const easing = constructedWith?.easing as (t: number) => number;
    expect(easing(1)).toBeCloseTo(1);
    expect(easing(0)).toBeCloseTo(0, 1);
  });
});

describe("useLenisScroll — gsap.ticker 통합", () => {
  it("ticker.add 호출 + lagSmoothing(0) 호출", () => {
    renderHook(() => useLenisScroll());
    expect(mockGsapTickerAdd).toHaveBeenCalledTimes(1);
    expect(mockGsapTickerLag).toHaveBeenCalledWith(0);
  });

  it("ticker tick 함수 호출 → lenis.raf(time*1000) 호출", () => {
    renderHook(() => useLenisScroll());
    const tick = mockGsapTickerAdd.mock.calls[0][0] as (time: number) => void;
    tick(0.5);
    expect(mockLenisRaf).toHaveBeenCalledWith(500);
  });

  it("lenis.on('scroll', cb) 호출 + cb → ScrollTrigger.update 트리거", () => {
    renderHook(() => useLenisScroll());
    expect(mockLenisOn).toHaveBeenCalledWith("scroll", expect.any(Function));

    const scrollCb = mockLenisOn.mock.calls[0][1] as () => void;
    scrollCb();
    expect(mockScrollTriggerUpdate).toHaveBeenCalled();
  });
});

describe("useLenisScroll — pageSnap wheel 처리", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section class="snap" style="position:absolute;top:0"></section>
      <section class="snap" style="position:absolute;top:800px"></section>
      <section class="snap" style="position:absolute;top:1600px"></section>
    `;
    // offsetTop 은 jsdom 에서 0 이므로 mock
    document.querySelectorAll<HTMLElement>(".snap").forEach((el, i) => {
      Object.defineProperty(el, "offsetTop", { value: i * 800, writable: true, configurable: true });
    });
    Object.defineProperty(window, "innerHeight", { value: 800, writable: true, configurable: true });
  });

  it("pageSnapSelector + sections 발견 → wheel listener 등록", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    renderHook(() => useLenisScroll({ pageSnapSelector: ".snap" }));

    expect(addSpy).toHaveBeenCalledWith(
      "wheel",
      expect.any(Function),
      expect.objectContaining({ passive: false, capture: true }),
    );
    addSpy.mockRestore();
  });

  it("sections 없음 → wheel listener 미등록", () => {
    document.body.innerHTML = "";
    const addSpy = jest.spyOn(window, "addEventListener");
    renderHook(() => useLenisScroll({ pageSnapSelector: ".missing" }));

    expect(addSpy).not.toHaveBeenCalledWith("wheel", expect.any(Function), expect.anything());
    addSpy.mockRestore();
  });
});

describe("useLenisScroll — cleanup", () => {
  it("unmount → gsap.ticker.remove + lenis.off + lenis.destroy 호출", () => {
    const { unmount } = renderHook(() => useLenisScroll());
    unmount();

    expect(mockGsapTickerRemove).toHaveBeenCalled();
    expect(mockLenisOff).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(mockLenisDestroy).toHaveBeenCalledTimes(1);
  });

  it("pageSnapSelector 사용 시 unmount → wheel listener 해제", () => {
    document.body.innerHTML = `<section class="snap"></section>`;
    Object.defineProperty(document.querySelector(".snap")!, "offsetTop", { value: 0, writable: true });

    const removeSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useLenisScroll({ pageSnapSelector: ".snap" }));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("wheel", expect.any(Function), expect.objectContaining({ capture: true }));
    removeSpy.mockRestore();
  });
});
