import { AlertTriangle } from "lucide-react";

interface FinishConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function FinishConfirmModal({ onConfirm, onCancel }: FinishConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#1F2937] rounded-2xl p-8 w-full max-w-[420px] mx-4 shadow-2xl flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
          <AlertTriangle size={28} className="text-amber-400" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-bold text-white mb-2">면접을 중단하시겠습니까?</h3>
          <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
            면접 목록에서 언제든 이어서 진행할 수 있지만,
            <br />
            끝까지 완료하지 않으면 <strong className="text-amber-400">스트릭이 기록되지 않습니다.</strong>
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-[13px] text-white bg-slate-600 hover:bg-slate-500 transition-colors"
          >
            계속 진행
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold text-[13px] text-white bg-red-500 hover:bg-red-400 transition-colors"
          >
            면접 종료
          </button>
        </div>
      </div>
    </div>
  );
}
