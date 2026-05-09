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
  return (
    <div>
      <div className="mb-6">
        <div className="text-[11px] font-bold tracking-[.1em] uppercase text-cyan-400 mb-2">STEP 3</div>
        <h2 className="text-[20px] font-black tracking-[-0.3px] mb-1">음성을 확인합니다</h2>
        <p className="text-[13px] text-slate-400">면접관 음성(TTS)과 답변 인식(STT)을 테스트합니다.</p>
      </div>

      <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
        {/* Left: TTS + STT tests */}
        <div className="flex flex-col gap-4">
          <TtsTestCard />
          <SttTestCard />
        </div>

        {/* Right: tips + summary + nav */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {[
              { t: "스피커 볼륨", d: "을 적절히 조절하세요." },
              { t: "음성 인식(STT)", d: "은 Chrome에서 가장 정확합니다." },
              { t: "이어폰/헤드셋", d: " 사용 시 더 정확한 인식이 가능합니다." },
            ].map((tip) => (
              <div key={tip.t} className="text-[12px] text-slate-400 bg-slate-800/40 border border-white/5 rounded-lg px-3 py-2">
                <strong className="text-slate-200">{tip.t}</strong>{tip.d}
              </div>
            ))}
          </div>

          {summaryItems && summaryItems.length > 0 && (
            <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4">
              <div className="text-[12px] font-bold text-slate-200 mb-2">점검 요약</div>
              {summaryItems.map((item) => (
                <div key={item.key} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-b-0">
                  <span className="text-[11px] text-slate-500">{item.key}</span>
                  <span className="text-[11px] font-bold text-slate-300">{item.val}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-auto">
            <button className="flex-1 py-3 rounded-xl font-bold text-[13px] text-slate-400 bg-transparent border border-white/10 hover:bg-white/5 transition-colors cursor-pointer" onClick={onBack}>← 이전</button>
            <button disabled={!allPassed || isCreating} onClick={onStart} className="flex-1 py-3 rounded-xl font-bold text-[13px] text-white bg-[#06B6D4] hover:bg-[#22D3EE] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              {isCreating ? "생성 중..." : "면접 시작 →"}
            </button>
          </div>
          {createError && <div className="text-[12px] text-red-400 mt-2">{createError}</div>}
        </div>
      </div>
    </div>
  );
}
