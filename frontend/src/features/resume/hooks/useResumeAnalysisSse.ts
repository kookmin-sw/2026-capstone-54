import { useEffect, useRef } from "react";
import { openSseStream } from "@/shared/api/sse";
import type { AnalysisStatus, AnalysisStep } from "../api/types";

/**
 * 특정 이력서의 분석 상태를 SSE 로 구독한다.
 *
 * - `enabled` 가 false 이면 아무것도 하지 않는다. 이미 완료/실패(terminal) 상태에선 호출부에서
 *   `enabled=false` 를 전달해 SSE 연결 자체를 일으키지 않는다.
 * - 서버가 `event: status` 를 push 하면 `onStatus` 가 호출된다.
 * - 상태가 "completed" / "failed" 에 도달하면 `onTerminal` 이 한 번 호출되고 재연결도 막힌다.
 * - 백엔드가 `event: error` 를 보내면 `onError` 가 호출된다 (인증·권한·not-found 등).
 * - 전송 오류(네트워크 끊김 등)는 `openSseStream` 쪽에서 자동으로 지수 백오프 재연결한다.
 *   재연결 한도를 넘기면 `onError` 가 호출된다.
 * - 컴포넌트 unmount / uuid 변경 / enabled=false 전환 시 기존 스트림을 abort 한다.
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
  onError?: (err: Error) => void;
}

const TERMINAL: AnalysisStatus[] = ["completed", "failed"];

export function useResumeAnalysisSse({
  uuid,
  enabled,
  onStatus,
  onTerminal,
  onError,
}: UseResumeAnalysisSseParams) {
  // 콜백을 ref 로 고정 — effect 가 매 렌더마다 재구독되지 않도록.
  const onStatusRef = useRef(onStatus);
  const onTerminalRef = useRef(onTerminal);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onStatusRef.current = onStatus;
    onTerminalRef.current = onTerminal;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!enabled || !uuid) return;

    let terminalFired = false;
    const cancel = openSseStream(
      `/sse/resumes/${uuid}/analysis-status/`,
      (event, data) => {
        if (!data || typeof data !== "object") return;

        if (event === "status") {
          const payload = data as ResumeAnalysisStatusEvent;
          onStatusRef.current?.(payload);
          if (!terminalFired && TERMINAL.includes(payload.analysis_status)) {
            terminalFired = true;
            onTerminalRef.current?.(payload);
          }
          return;
        }

        if (event === "error") {
          const msg = (data as { message?: string }).message ?? "이력서 분석 상태를 받을 수 없어요.";
          // 백엔드가 명시적으로 error 를 보낸 경우엔 재연결할 이유가 없으므로 terminal 로 간주.
          terminalFired = true;
          onErrorRef.current?.(new Error(msg));
        }
      },
      {
        shouldReconnect: () => !terminalFired,
        onError: (err) => {
          if (terminalFired) return;
          terminalFired = true;
          onErrorRef.current?.(err);
        },
      },
    );

    return () => cancel();
  }, [uuid, enabled]);
}
