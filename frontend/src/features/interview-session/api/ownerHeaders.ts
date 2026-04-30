/** mutate API 요청에 첨부할 X-Session-Owner-* 헤더 빌더. store 의 ownerToken/ownerVersion 을 읽어 dict 반환. */
import { useInterviewSessionStore } from "../model/store";

export function ownerHeaders(): Record<string, string> {
  const state = useInterviewSessionStore.getState();
  if (!state.ownerToken || state.ownerVersion === null) return {};
  return {
    "X-Session-Owner-Token": state.ownerToken,
    "X-Session-Owner-Version": String(state.ownerVersion),
  };
}
