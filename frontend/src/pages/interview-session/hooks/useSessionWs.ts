/** Interview-session WebSocket 연결 + eviction 처리 hook. */
import { useEffect, useRef } from "react";
import { InterviewSessionWsClient, WS_CLOSE_EVICTED } from "@/features/interview-session/api/sessionWs";
import { useInterviewSessionStore } from "@/features/interview-session/model/store";

interface UseSessionWsOptions {
  interviewSessionUuid: string;
  enabled: boolean;
}

export function useSessionWs({ interviewSessionUuid, enabled }: UseSessionWsOptions) {
  const wsTicket = useInterviewSessionStore((s) => s.wsTicket);
  const setTakeoverModalOpen = useInterviewSessionStore((s) => s.setTakeoverModalOpen);
  const clientRef = useRef<InterviewSessionWsClient | null>(null);

  useEffect(() => {
    if (!enabled || !interviewSessionUuid || !wsTicket) return;

    const client = new InterviewSessionWsClient({
      onClose: (code) => {
        if (code === WS_CLOSE_EVICTED) {
          setTakeoverModalOpen(true);
        }
      },
    });
    client.connect(interviewSessionUuid, wsTicket);
    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [interviewSessionUuid, wsTicket, enabled, setTakeoverModalOpen]);

  return clientRef;
}
