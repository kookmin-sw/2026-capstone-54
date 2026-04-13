import { ParsedDataView, type ParsedData } from "@/features/resume";

interface ResumeParsedSectionProps {
  /** null 이면 분석 전 / 분석 진행 중. */
  data: ParsedData | null;
  /** true 이면 분석 진행 중 플레이스홀더를 감춘다(AnalysisProgress 가 대신 노출됨). */
  isProcessing: boolean;
}

/** AI 분석 결과 섹션. 분석이 끝난 경우에만 ParsedDataView 를 렌더한다. */
export function ResumeParsedSection({ data, isProcessing }: ResumeParsedSectionProps) {
  if (data) {
    return (
      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-6">
        <h2 className="text-[13px] font-extrabold text-[#0A0A0A] mb-4">AI 분석 결과</h2>
        <ParsedDataView data={data} />
      </div>
    );
  }

  if (isProcessing) return null;

  return (
    <div className="bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-lg p-8 text-center">
      <p className="text-[13px] text-[#9CA3AF]">분석이 완료되면 여기에 결과가 표시돼요.</p>
    </div>
  );
}
