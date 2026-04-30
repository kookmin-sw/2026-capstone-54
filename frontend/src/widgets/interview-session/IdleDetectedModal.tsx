/** 장기 idle 감지 시 표시되는 모달. 계속 진행 / 종료 분기. */

interface IdleDetectedModalProps {
  open: boolean;
  onContinue: () => void;
  onFinish: () => void;
}

export function IdleDetectedModal({ open, onContinue, onFinish }: IdleDetectedModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#0b1420] border border-white/10 p-6 text-white">
        <h2 id="idle-modal-title" className="text-lg font-bold">활동이 감지되지 않습니다</h2>
        <p className="mt-3 text-sm text-slate-300">
          일정 시간 입력과 얼굴 인식이 없어 면접을 일시정지했습니다. 계속 진행하시겠습니까?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onFinish}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300"
          >
            종료
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white"
          >
            계속 진행
          </button>
        </div>
      </div>
    </div>
  );
}
