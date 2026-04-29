/** WebSpeech capability + recent error count 로 backend STT fallback 여부를 판단한다. */
import { useCallback, useState } from "react";
import { shouldFallbackToBackendStt } from "@/shared/lib/stt/sttCapability";

export function useSttFallback() {
  const [recentErrorCount, setRecentErrorCount] = useState(0);

  const recordSttError = useCallback(() => {
    setRecentErrorCount((c) => c + 1);
  }, []);

  const resetSttErrors = useCallback(() => {
    setRecentErrorCount(0);
  }, []);

  const shouldFallback = shouldFallbackToBackendStt({ recentErrorCount });

  return {
    shouldFallback,
    recordSttError,
    resetSttErrors,
    recentErrorCount,
  };
}
