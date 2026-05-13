/**
 * PDF 저장 전용 컴포넌트.
 * 화면에서는 CSS로 숨겨지고 (@media print 에서만 표시),
 * 역량 분석 카드 내부에 삽입되어 레이더 차트 대신 표시됩니다.
 *
 * 포함 내용:
 *  - #print-category-bars : 역량 분석 프로그레스 바 (레이더 차트 자리)
 *  - #print-strengths     : 강점 / 개선 영역
 *  - #print-audio         : 음성 분석 4개 지표 (2×2)
 *  - #print-video         : 영상 분석 (표정 분포 + 시선 처리)
 */

import type { InterviewAnalysisReport } from "@/features/interview-session";

interface Props {
  report: InterviewAnalysisReport;
}

// ── 배지 헬퍼 ──────────────────────────────────────────────
function spmBadge(spm: number) {
  if (spm === 0) return { label: "—", cls: "bg-[#F3F4F6] text-[#9CA3AF]" };
  if (spm >= 260 && spm <= 350) return { label: "적절해요", cls: "bg-[#DCFCE7] text-[#15803D]" };
  if (spm > 350) return { label: "빠릅니다", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
  return { label: "느립니다", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
}

function fillerBadge(ratio: number) {
  if (ratio < 0.05) return { label: "양호", cls: "bg-[#DCFCE7] text-[#15803D]" };
  if (ratio < 0.10) return { label: "보통", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
  return { label: "개선 필요", cls: "bg-red-50 text-red-600" };
}

function silenceBadge(ratio: number) {
  if (ratio < 0.20) return { label: "자연스러워요", cls: "bg-[#DCFCE7] text-[#15803D]" };
  if (ratio < 0.30) return { label: "조금 많음", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
  return { label: "너무 깁니다", cls: "bg-red-50 text-red-600" };
}

function volumeBadge(dbfs: number | null) {
  if (dbfs === null || dbfs === 0) return { label: "—", cls: "bg-[#F3F4F6] text-[#9CA3AF]" };
  if (dbfs >= -30 && dbfs <= -10) return { label: "안정적이에요", cls: "bg-[#DCFCE7] text-[#15803D]" };
  return { label: "불안정합니다", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
}

function gazeBadge(ratio: number) {
  if (ratio < 0.15) return { label: "전체 안정", cls: "bg-[#DCFCE7] text-[#15803D]" };
  if (ratio < 0.30) return { label: "보통", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
  return { label: "주의 필요", cls: "bg-red-50 text-red-600" };
}

function exprBadge(happy: number, neutral: number) {
  if (happy + neutral >= 80) return { label: "우수", cls: "bg-[#DCFCE7] text-[#15803D]" };
  if (happy + neutral >= 60) return { label: "양호", cls: "bg-[#DCFCE7] text-[#15803D]" };
  return { label: "보통", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
}

// ── 서브 컴포넌트 ──────────────────────────────────────────

function PrintCategoryBars({ report }: Props) {
  return (
    <div id="print-category-bars" className="w-full space-y-5">
      {report.categoryScores.map((cat, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <span className="text-[13px] font-semibold text-[#374151]">{cat.category}</span>
            <span className="text-[13px] font-bold text-[#0991B2] tabular-nums">{cat.score}</span>
          </div>
          <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-[#06B6D4] rounded-full" style={{ width: `${cat.score}%` }} />
          </div>
          <p className="text-[11px] text-[#6B7280] leading-relaxed">{cat.comment}</p>
        </div>
      ))}
    </div>
  );
}

function PrintStrengths({ report }: Props) {
  return (
    <div id="print-strengths" className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-[13px] font-semibold text-[#111827] mb-3">강점</p>
        <div className="space-y-3">
          {report.strengths.map((s, i) => (
            <div key={i} className="border-l-2 border-emerald-500 pl-3">
              <p className="text-[13px] font-semibold text-[#1F2937] mb-0.5">{s.title}</p>
              <p className="text-[12px] text-[#6B7280] leading-relaxed">{s.evidence}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-[#111827] mb-3">개선 영역</p>
        <div className="space-y-3">
          {report.improvementAreas.map((s, i) => (
            <div key={i} className="border-l-2 border-[#E9B63B] pl-3">
              <p className="text-[13px] font-semibold text-[#1F2937] mb-0.5">{s.title}</p>
              <p className="text-[12px] text-[#6B7280] leading-relaxed">{s.evidence}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrintAudio({ report }: Props) {
  const summary = report.audioAnalysisResult?.summary;
  const hasAudio = !!summary && (summary.avgSpeechRateSpm > 0 || summary.avgSilenceRatio > 0);
  const spBadge = spmBadge(hasAudio ? summary!.avgSpeechRateSpm : 0);
  const flRatio = summary?.totalFillerWordRatio ?? 0;
  const flBadge = fillerBadge(flRatio);
  const slRatio = summary?.avgSilenceRatio ?? 0;
  const slBadge = silenceBadge(slRatio);
  const dbfs = summary?.avgVolumeDbfs ?? null;
  const vlBadge = volumeBadge(dbfs);

  return (
    <div id="print-audio" className="mt-4">
      <p className="text-[13px] font-semibold text-[#111827] mb-2">음성 분석</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#F9FAFB] rounded-xl p-2 flex items-center gap-3 border border-gray-100">
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-[#4B5563]">말하기 속도</p>
            <p className="text-[11px] text-[#374151] tabular-nums">{hasAudio ? `${summary!.avgSpeechRateSpm} SPM` : "—"}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${spBadge.cls}`}>{spBadge.label}</span>
        </div>
        <div className="bg-[#F9FAFB] rounded-xl p-2 flex items-center gap-3 border border-gray-100">
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-[#4B5563]">필러워드</p>
            <p className="text-[11px] text-[#374151] tabular-nums">{hasAudio ? `${(flRatio * 100).toFixed(1)}%` : "—"}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${flBadge.cls}`}>{flBadge.label}</span>
        </div>
        <div className="bg-[#F9FAFB] rounded-xl p-2 flex items-center gap-3 border border-gray-100">
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-[#4B5563]">묵음 구간</p>
            <p className="text-[11px] text-[#374151] tabular-nums">{hasAudio ? `평균 ${(slRatio * 100).toFixed(0)}%` : "—"}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${slBadge.cls}`}>{slBadge.label}</span>
        </div>
        <div className="bg-[#F9FAFB] rounded-xl p-2 flex items-center gap-3 border border-gray-100">
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-[#4B5563]">목소리 크기</p>
            <p className="text-[11px] text-[#374151] tabular-nums">{hasAudio && dbfs !== 0 ? `${dbfs} dBFS` : "—"}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${vlBadge.cls}`}>{vlBadge.label}</span>
        </div>
      </div>
    </div>
  );
}

function PrintVideo({ report }: Props) {
  const vr = report.videoAnalysisResult;
  const hasExpr = !!vr?.totalExpressionDistribution;
  const hasGaze = !!vr && typeof vr.avgGazeDeviationRatio === "number";
  const happy = hasExpr ? Math.round(vr!.totalExpressionDistribution.happy * 100) : 0;
  const neutral = hasExpr ? Math.round(vr!.totalExpressionDistribution.neutral * 100) : 0;
  const negative = hasExpr ? Math.round(vr!.totalExpressionDistribution.negative * 100) : 0;
  const gazeRatio = vr?.avgGazeDeviationRatio ?? 0;
  const gazeStablePct = Math.round((1 - gazeRatio) * 100);
  const gzBadge = gazeBadge(gazeRatio);
  const epBadge = hasExpr ? exprBadge(happy, neutral) : { label: "—", cls: "bg-[#F3F4F6] text-[#9CA3AF]" };

  return (
    <div id="print-video" className="mt-4">
      <p className="text-[13px] font-semibold text-[#111827] mb-2">영상 분석</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#F9FAFB] rounded-xl p-2 border border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold text-[#4B5563]">표정 분포</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${epBadge.cls}`}>{epBadge.label}</span>
          </div>
          {hasExpr ? (
            <>
              <div className="flex h-2 rounded-full overflow-hidden mb-1">
                <div className="bg-[#0991B2]" style={{ width: `${happy}%` }} />
                <div className="bg-[#06B6D4]/40" style={{ width: `${neutral}%` }} />
                <div className="bg-[#E5E7EB]" style={{ width: `${negative}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-[#6B7280]">
                <span>긍정 <b className="text-[#374151]">{happy}%</b></span>
                <span>무표정 <b className="text-[#374151]">{neutral}%</b></span>
                <span>부정 <b className="text-[#374151]">{negative}%</b></span>
              </div>
            </>
          ) : (
            <p className="text-[10px] text-[#9CA3AF]">데이터 없음</p>
          )}
        </div>
        <div className="bg-[#F9FAFB] rounded-xl p-2 flex items-center gap-3 border border-gray-100">
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-[#4B5563]">시선 처리</p>
            <p className="text-[11px] text-[#374151] tabular-nums">{hasGaze ? `정면 유지 ${gazeStablePct}%` : "—"}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${hasGaze ? gzBadge.cls : "bg-[#F3F4F6] text-[#9CA3AF]"}`}>
            {hasGaze ? gzBadge.label : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 메인 export ────────────────────────────────────────────

/**
 * 역량 분석 카드의 좌측(레이더 차트 자리)에 삽입되는 인쇄 전용 컨텐츠.
 * `slot="left"` : 역량 프로그레스 바
 */
export function PrintLeftSlot({ report }: Props) {
  return <PrintCategoryBars report={report} />;
}

/**
 * 역량 분석 카드의 우측(프로그레스 바 자리)에 삽입되는 인쇄 전용 컨텐츠.
 * `slot="right"` : 강점/개선 + 음성 분석 + 영상 분석
 */
export function PrintRightSlot({ report }: Props) {
  return (
    <>
      <PrintStrengths report={report} />
      <PrintAudio report={report} />
      <PrintVideo report={report} />
    </>
  );
}
