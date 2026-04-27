/** 다른 곳에서 인터뷰가 진행 중일 때 takeover 안내 + 강제 종료 버튼 모달. */
import { useState } from "react";
import { useInterviewSessionStore } from "@/features/interview-session/model/store";

interface SessionTakeoverModalProps {
  interviewSessionUuid: string;
}

export function SessionTakeoverModal({ interviewSessionUuid }: SessionTakeoverModalProps) {
  const open = useInterviewSessionStore((s) => s.takeoverModalOpen);
  const applyTakeover = useInterviewSessionStore((s) => s.applyTakeover);
  const setOpen = useInterviewSessionStore((s) => s.setTakeoverModalOpen);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const onTakeover = async () => {
    setBusy(true);
    setError(null);
    try {
      await applyTakeover(interviewSessionUuid);
    } catch {
      setError("강제 종료에 실패했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setBusy(false);
    }
  };

  const onCancel = () => {
    if (busy) return;
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="takeover-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="takeover-modal-title" className="text-lg font-bold text-gray-900">
          다른 곳에서 인터뷰가 진행 중입니다
        </h2>
        <p className="mt-3 text-sm text-gray-700">
          이 면접은 현재 다른 탭이나 기기에서 활성 상태입니다. 강제 종료하면 기존 진행이 중단되고
          여기에서 이어 진행할 수 있습니다.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onTakeover}
            disabled={busy}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? "처리 중..." : "강제 종료 후 시작"}
          </button>
        </div>
      </div>
    </div>
  );
}
