/** is_dirty 상태일 때 상단에 노출되는 경고 + 최종 저장 CTA. */

import { AlertTriangle, Loader2 } from "lucide-react";

interface DirtyBannerProps {
  isFinalizing: boolean;
  onFinalize: () => void;
}

export function DirtyBanner({ isFinalizing, onFinalize }: DirtyBannerProps) {
  return (
    <div className="mb-4 bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[13px] text-[#92400E]">
        <AlertTriangle size={16} />
        <span>
          섹션을 수정한 뒤 <strong>최종 저장</strong> 을 누르지 않으면 분석 결과가 최신이 아닐 수 있습니다.
        </span>
      </div>
      <button
        onClick={onFinalize}
        disabled={isFinalizing}
        className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-bold text-white bg-[#D97706] rounded px-3 py-2 hover:opacity-90 disabled:opacity-50"
      >
        {isFinalizing && <Loader2 size={12} className="animate-spin" />}
        최종 저장
      </button>
    </div>
  );
}
