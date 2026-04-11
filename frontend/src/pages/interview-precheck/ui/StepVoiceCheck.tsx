import { InfoTip } from "@/shared/ui/InfoTip";
import { StepLayout } from "@/shared/ui/StepLayout";
import { TtsTestCard } from "./TtsTestCard";
import { SttTestCard } from "./SttTestCard";

interface SummaryItem { key: string; val: string; }

interface StepVoiceCheckProps {
  practiceMode: string;
  allPassed: boolean;
  isCreating: boolean;
  createError: string | null;
  onStart: () => void;
  onBack: () => void;
  summaryItems?: SummaryItem[];
}

export function StepVoiceCheck({ allPassed, isCreating, createError, onStart, onBack, summaryItems }: StepVoiceCheckProps) {
  const navBtnCls = "flex-1 text-center py-[13px] rounded-lg font-bold text-[13px] cursor-pointer transition-all";

  return (
    <StepLayout
      stepLabel="STEP 3"
      title="음성을 확인합니다"
      description="면접관 음성(TTS)과 답변 인식(STT)을 테스트합니다."
      left={
        <>
          <TtsTestCard />
          <SttTestCard />
        </>
      }
      right={
        <>
          <div className="flex flex-col gap-2">
            <InfoTip icon="🔊" title="스피커 볼륨" description="을 적절히 조절하세요." />
            <InfoTip icon="🎙️" title="음성 인식(STT)" description="은 Chrome에서 가장 정확합니다." />
            <InfoTip icon="🎧" title="이어폰/헤드셋" description=" 사용 시 더 정확한 인식이 가능합니다." />
          </div>

          {summaryItems && summaryItems.length > 0 && (
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
              <div className="text-[12px] font-bold mb-2">점검 요약</div>
              {summaryItems.map((item) => (
                <div key={item.key} className="flex justify-between items-center py-1.5 border-b border-[#E5E7EB] last:border-b-0">
                  <span className="text-[11px] text-[#6B7280]">{item.key}</span>
                  <span className="text-[11px] font-bold">{item.val}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-auto">
            <button className={`${navBtnCls} text-[#6B7280] bg-transparent border border-[#E5E7EB] hover:bg-[#F9FAFB]`} onClick={onBack}>← 이전</button>
            <button disabled={!allPassed || isCreating} onClick={onStart} className={`${navBtnCls} text-white bg-[#0A0A0A] border-none shadow-[0_4px_6px_rgba(0,0,0,0.07)] hover:enabled:opacity-[.88] disabled:bg-[#D1D5DB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed`}>
              {isCreating ? "생성 중..." : "시작 →"}
            </button>
          </div>
          {createError && <div className="text-[12px] text-red-500 mt-2">{createError}</div>}
        </>
      }
    />
  );
}
