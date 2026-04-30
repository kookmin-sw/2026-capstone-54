/** 브라우저 WebSpeech STT 가용성 검사 헬퍼. */

export function isWebSpeechAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

export function shouldFallbackToBackendStt(options: { recentErrorCount: number }): boolean {
  if (!isWebSpeechAvailable()) return true;
  return options.recentErrorCount >= 2;
}
