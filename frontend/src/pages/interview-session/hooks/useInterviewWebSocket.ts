import { useRef } from "react";
import { interviewApi } from "@/features/interview-session";

export function useInterviewWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);

  const connect = async (uuid: string) => {
    try {
      const { ticket } = await interviewApi.getWsTicket();
      wsRef.current = new WebSocket(interviewApi.buildWsUrl(uuid, ticket));
      wsRef.current.onerror = () => console.warn("WebSocket 연결 오류");
    } catch { console.warn("WebSocket 티켓 발급 실패"); }
  };

  const close = () => {
    wsRef.current?.close();
    wsRef.current = null;
  };

  return { wsRef, connect, close };
}
