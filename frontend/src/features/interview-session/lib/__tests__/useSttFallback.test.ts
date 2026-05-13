import { renderHook, act } from "@testing-library/react";
import { useSttFallback } from "../useSttFallback";

function clearWebSpeech(): void {
  delete (window as { SpeechRecognition?: unknown }).SpeechRecognition;
  delete (window as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
}

describe("useSttFallback — WebSpeech 미지원", () => {
  beforeEach(() => {
    clearWebSpeech();
  });

  it("초기 shouldFallback=true, recentErrorCount=0", () => {
    const { result } = renderHook(() => useSttFallback());
    expect(result.current.shouldFallback).toBe(true);
    expect(result.current.recentErrorCount).toBe(0);
  });

  it("recordSttError 호출해도 shouldFallback=true 유지 (capability 우선)", () => {
    const { result } = renderHook(() => useSttFallback());
    act(() => result.current.recordSttError());
    expect(result.current.recentErrorCount).toBe(1);
    expect(result.current.shouldFallback).toBe(true);
  });
});

describe("useSttFallback — WebSpeech 지원 (webkitSpeechRecognition)", () => {
  beforeEach(() => {
    clearWebSpeech();
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = function speechRecognitionStub() {};
  });

  afterEach(() => {
    clearWebSpeech();
  });

  it("초기 shouldFallback=false (errorCount=0)", () => {
    const { result } = renderHook(() => useSttFallback());
    expect(result.current.shouldFallback).toBe(false);
  });

  it("recordSttError 1 회 → shouldFallback=false (threshold 2 미달)", () => {
    const { result } = renderHook(() => useSttFallback());
    act(() => result.current.recordSttError());
    expect(result.current.recentErrorCount).toBe(1);
    expect(result.current.shouldFallback).toBe(false);
  });

  it("recordSttError 2 회 → shouldFallback=true (threshold 도달)", () => {
    const { result } = renderHook(() => useSttFallback());
    act(() => {
      result.current.recordSttError();
      result.current.recordSttError();
    });
    expect(result.current.recentErrorCount).toBe(2);
    expect(result.current.shouldFallback).toBe(true);
  });

  it("recordSttError 3 회 후 resetSttErrors → 0 으로 리셋", () => {
    const { result } = renderHook(() => useSttFallback());
    act(() => {
      result.current.recordSttError();
      result.current.recordSttError();
      result.current.recordSttError();
    });
    expect(result.current.recentErrorCount).toBe(3);
    expect(result.current.shouldFallback).toBe(true);

    act(() => result.current.resetSttErrors());
    expect(result.current.recentErrorCount).toBe(0);
    expect(result.current.shouldFallback).toBe(false);
  });

  it("recordSttError / resetSttErrors callback ref 안정성 (재렌더 시 동일 함수)", () => {
    const { result, rerender } = renderHook(() => useSttFallback());
    const record1 = result.current.recordSttError;
    const reset1 = result.current.resetSttErrors;

    rerender();

    expect(result.current.recordSttError).toBe(record1);
    expect(result.current.resetSttErrors).toBe(reset1);
  });
});

describe("useSttFallback — standard SpeechRecognition (vendor prefix 없음)", () => {
  beforeEach(() => {
    clearWebSpeech();
    (window as unknown as Record<string, unknown>).SpeechRecognition = function speechRecognitionStub() {};
  });

  afterEach(() => {
    clearWebSpeech();
  });

  it("표준 API 만 있어도 isWebSpeechAvailable=true 로 인식", () => {
    const { result } = renderHook(() => useSttFallback());
    expect(result.current.shouldFallback).toBe(false);
  });
});
