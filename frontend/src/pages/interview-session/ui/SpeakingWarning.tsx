/** 연습 모드에서 STT 시작 전 음성이 감지되면 표시하는 경고. 3초간 유지된다. */
import { Mic } from "lucide-react";

interface SpeakingWarningProps {
  visible: boolean;
}

export function SpeakingWarning({ visible }: SpeakingWarningProps) {
  if (!visible) return null;

  return (
    <div className="w-full py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
      <p className="text-amber-400 text-[11px] font-semibold flex items-center justify-center gap-1.5">
        <Mic size={12} /> 음성이 감지되고 있어요. 위 버튼을 눌러 답변을 시작해주세요!
      </p>
    </div>
  );
}
