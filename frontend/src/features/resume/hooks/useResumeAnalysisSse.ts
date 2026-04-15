import { useEffect, useRef } from "react";
import { openSseStream } from "@/shared/api/sse";
import type { AnalysisStatus, AnalysisStep } from "../api/types";

/**
 * 특정 이력서의 분석 상태를 SSE 로 구독한다.
 *
 * - `enabled` 가 false 이면 아무것도 하지 않는다 (이미 완료/실패 상태에서는 구독 불필요).
 * - 서버가 "status" 이벤트를 push 하면 `onStatus` 가 호출된다.
 * - 상태가 "completed" 또는 "failed" 에 도달하면 `onTerminal` 이 한 번 호출되고
 *   서버가 스트림을 종료하므로 자동으로 connection 도 닫힌다.
 * - 컴포넌트 unmount 또는 uuid/enabled 변경 시 기존 스트림을 abort 한다.
 */
export interface ResumeAnalysisStatusEvent {
  analysis_status: AnalysisStatus;
  analysis_step: AnalysisStep;
  updated_at: string | null;
}

interface UseResumeAnalysisSseParams {
  uuid: string | undefined;
  enabled: boolean;
  onStatus?: (evt: ResumeAnalysisStatusEvent) => void;
  onTerminal?: (evt: ResumeAnalysisStatusEvent) => void;
}

const TERMINAL: AnalysisStatus[] = ["completed", "failed"];

export function useResumeAnalysisSse({
  uuid,
  enabled,
  onStatus,
  onTerminal,
}: UseResumeAnalysisSseParams) {
  // onStatus/onTerminal 을 effect 의 deps 로 쓰면 매 렌더마다 재구독되므로 ref 로 고정
  const onStatusRef = useRef(onStatus);
  const onTerminalRef = useRef(onTerminal);

  useEffect(() => {
    onStatusRef.current = onStatus;
    onTerminalRef.current = onTerminal;
  });

  useEffect(() => {
    if (!enabled || !uuid) return;

    let terminalFired = false;
    const cancel = openSseStream(
      `/sse/resumes/${uuid}/analysis-status/`,
      (event, data) => {
        if (event !== "status" || !data || typeof data !== "object") return;
        const payload = data as ResumeAnalysisStatusEvent;
        onStatusRef.current?.(payload);
        if (!terminalFired && TERMINAL.includes(payload.analysis_status)) {
          terminalFired = true;
          onTerminalRef.current?.(payload);
        }
      },
    );

    return () => cancel();
  }, [uuid, enabled]);
}
