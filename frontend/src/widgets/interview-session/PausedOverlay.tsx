/** 인터뷰 일시정지 안내 오버레이. 활성 탭 복귀 시 자동으로 사라진다. */
import { useInterviewSessionStore } from "@/features/interview-session/model/store";

const REASON_LABEL: Record<string, string> = {
  user_left_window: "다른 탭/창으로 이동했습니다",
  manual_pause: "수동으로 일시정지했습니다",
  heartbeat_timeout: "응답이 일정 시간 없어 일시정지했습니다",
  user_idle: "장시간 활동이 없어 일시정지했습니다",
};

export function PausedOverlay() {
  const isPaused = useInterviewSessionStore((s) => s.isPaused);
  const pauseReason = useInterviewSessionStore((s) => s.pauseReason);

  if (!isPaused) return null;

  const reasonText = (pauseReason && REASON_LABEL[pauseReason]) || "면접이 일시정지되었습니다";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 text-white"
    >
      <div className="rounded-2xl bg-[#0b1420] border border-white/10 px-8 py-6 text-center">
        <p className="text-base font-bold">면접 일시정지 중</p>
        <p className="mt-2 text-sm text-slate-300">{reasonText}</p>
        <p className="mt-3 text-xs text-slate-500">화면을 다시 활성화하면 자동으로 재개됩니다.</p>
      </div>
    </div>
  );
}
