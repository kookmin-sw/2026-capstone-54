import { EyeOff } from "lucide-react";

interface ScreenSizeOverlayProps {
  screenWidth: number;
  screenHeight: number;
  onGoHome: () => void;
}

export function ScreenSizeOverlay({ screenWidth, screenHeight, onGoHome }: ScreenSizeOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9998] bg-[#111827] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-8 w-full max-w-[340px]">
          <div className="w-[80px] h-[80px] rounded-full bg-[#F9731620] flex items-center justify-center">
            <EyeOff size={36} stroke="#F97316" strokeWidth={2} />
          </div>
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-[22px] font-bold text-white">화면이 너무 작습니다</h2>
            <p className="text-[14px] text-[#9CA3AF] leading-relaxed">면접 세션은 최소 1024 x 768 이상의 화면에서만 이용할 수 있습니다.</p>
          </div>
          <div className="bg-[#1F2937] rounded-xl p-5 flex flex-col gap-2 w-full">
            <div className="flex justify-between">
              <span className="text-[12px] text-[#6B7280]">현재 화면 크기</span>
              <span className="text-[12px] font-semibold text-[#EF4444]">{screenWidth} x {screenHeight}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] text-[#6B7280]">최소 요구 크기</span>
              <span className="text-[12px] font-semibold text-[#22C55E]">1024 x 768</span>
            </div>
          </div>
          <button onClick={onGoHome} className="w-full h-12 rounded-[10px] bg-[#06B6D4] text-white font-semibold text-[14px] hover:bg-[#22D3EE] transition-colors">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
