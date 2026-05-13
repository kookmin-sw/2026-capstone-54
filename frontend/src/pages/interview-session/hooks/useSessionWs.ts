/** Interview-session WebSocket 연결 + eviction / pause / resume / heartbeat 처리 hook. */
import { useEffect, useRef } from "react";
import { InterviewSessionWsClient, WS_CLOSE_EVICTED } from "@/features/interview-session/api/sessionWs";
import { useInterviewSessionStore } from "@/features/interview-session/model/store";
import { usePageVisibility } from "@/features/interview-session/lib/usePageVisibility";

interface UseSessionWsOptions {
  interviewSessionUuid: string;
  enabled: boolean;
}

const HEARTBEAT_INTERVAL_MS = 30_000;

export function useSessionWs({ interviewSessionUuid, enabled }: UseSessionWsOptions) {
  const wsTicket = useInterviewSessionStore((s) => s.wsTicket);
  const setTakeoverModalOpen = useInterviewSessionStore((s) => s.setTakeoverModalOpen);
  const setPaused = useInterviewSessionStore((s) => s.setPaused);
  const clientRef = useRef<InterviewSessionWsClient | null>(null);
  const visible = usePageVisibility();

  useEffect(() => {
    if (!enabled || !interviewSessionUuid || !wsTicket) return;

    // StrictMode dev double-mount 또는 cleanup 후 도달하는 stale onClose 무시 가드.
    // ws1 cleanup → ws2 connect → server broadcast eviction 이 ws1 의 onclose 로 도달해도
    // 이미 cleanup 된 effect 의 setTakeoverModalOpen 호출을 차단한다.
    let isCurrent = true;

    const client = new InterviewSessionWsClient({
      onMessage: (data) => {
        if (!isCurrent) return;
        const messageType = data.type;
        if (messageType === "pause_ack") {
          setPaused(true, (data.reason as string | undefined) ?? null);
        } else if (messageType === "resume_ack") {
          setPaused(false, null);
        }
      },
      onClose: (code) => {
        if (!isCurrent) return;
        if (code === WS_CLOSE_EVICTED) {
          setTakeoverModalOpen(true);
        }
      },
    });
    client.connect(interviewSessionUuid, wsTicket);
    clientRef.current = client;

    return () => {
      isCurrent = false;
      client.disconnect();
      clientRef.current = null;
    };
  }, [interviewSessionUuid, wsTicket, enabled, setTakeoverModalOpen, setPaused]);

  useEffect(() => {
    if (!enabled || !clientRef.current) return;

    if (!visible) {
      clientRef.current.sendPause("user_left_window");
      setPaused(true, "user_left_window");
    }
  }, [visible, enabled, setPaused]);

  useEffect(() => {
    if (!enabled || !visible) return;

    const id = setInterval(() => {
      clientRef.current?.sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(id);
  }, [enabled, visible]);

  return clientRef;
}
