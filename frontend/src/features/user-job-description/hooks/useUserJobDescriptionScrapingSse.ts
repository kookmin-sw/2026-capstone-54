import { useEffect, useRef } from "react";
import { openSseStream } from "@/shared/api/sse";
import type { JobDescriptionCollectionStatus } from "../api/types";

export interface UserJobDescriptionCollectionStatusEvent {
  collection_status: JobDescriptionCollectionStatus;
  updated_at: string | null;
}

interface UseUserJobDescriptionScrapingSseParams {
  uuid: string | undefined;
  enabled: boolean;
  onStatus?: (evt: UserJobDescriptionCollectionStatusEvent) => void;
  onTerminal?: (evt: UserJobDescriptionCollectionStatusEvent) => void;
  onError?: (err: Error) => void;
}

const TERMINAL: JobDescriptionCollectionStatus[] = ["done", "error"];

export function useUserJobDescriptionScrapingSse({
  uuid,
  enabled,
  onStatus,
  onTerminal,
  onError,
}: UseUserJobDescriptionScrapingSseParams) {
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
      `/sse/user-job-descriptions/${uuid}/collection-status/`,
      (event, data) => {
        if (!data || typeof data !== "object") return;
        if (event === "status") {
          const payload = data as UserJobDescriptionCollectionStatusEvent;
          onStatusRef.current?.(payload);
          if (!terminalFired && TERMINAL.includes(payload.collection_status)) {
            terminalFired = true;
            onTerminalRef.current?.(payload);
          }
          return;
        }
        if (event === "error") {
          const msg =
            (data as { message?: string }).message ??
            "채용공고 스크래핑 상태를 받을 수 없어요.";
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
