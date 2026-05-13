import { Eye, Smile } from "lucide-react";
import type { VideoAnalysisResult } from "@/features/interview-session/api/types";
import type { InterviewQuestionFeedback } from "@/features/interview-session/api/types";

interface VideoAnalysisProps {
  summary?: VideoAnalysisResult | null;
  questionFeedbacks?: InterviewQuestionFeedback[];
}

function getGazeOverallBadge(ratio: number) {
  if (ratio < 0.15) return { label: "전체 안정", cls: "bg-[#DCFCE7] text-[#15803D]" };
  if (ratio < 0.30) return { label: "보통", cls: "bg-[#FDF6E3] text-[#E9B63B]" };
  return { label: "주의 필요", cls: "bg-red-50 text-red-600" };
}

function getGazeTurnStyle(count: number) {
  if (count < 5) return { label: "안정", barColor: "#0991B2", labelColor: "#0991B2" };
  if (count < 12) return { label: "불안정", barColor: "#F59E0B", labelColor: "#D97706" };
  return { label: "주의", barColor: "#EF4444", labelColor: "#DC2626" };
}

interface GazeBarChartProps {
  data: { turnNumber: number; count: number }[];
}

function GazeBarChart({ data }: GazeBarChartProps) {
  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartH = 96;
  const barW = 28;
  const gap = 14;
  const paddingLeft = 24;
  const paddingBottom = 20;
  const paddingTop = 16;
  const totalW = paddingLeft + data.length * (barW + gap) - gap + 8;
  const totalH = chartH + paddingBottom + paddingTop;

  const gridVals = [0, Math.round(maxCount * 0.5), maxCount];

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full" style={{ maxHeight: 148 }}>
      {/* grid lines */}
      {gridVals.map((val) => {
        const y = paddingTop + chartH - (val / maxCount) * chartH;
        return (
          <g key={val}>
            <line
              x1={paddingLeft} y1={y}
              x2={totalW} y2={y}
              stroke="rgba(0,0,0,.07)" strokeWidth="1" strokeDasharray="3 3"
            />
            <text
              x={paddingLeft - 4} y={y}
              textAnchor="end" dominantBaseline="middle"
              fontSize="8" fill="#9CA3AF"
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* bars */}
      {data.map((d, i) => {
        const style = getGazeTurnStyle(d.count);
        const barH = Math.max((d.count / maxCount) * chartH, 3);
        const x = paddingLeft + i * (barW + gap);
        const y = paddingTop + chartH - barH;

        return (
          <g key={d.turnNumber}>
            {/* bar background (track) */}
            <rect
              x={x} y={paddingTop}
              width={barW} height={chartH}
              rx="5" ry="5"
              fill="rgba(0,0,0,.04)"
            />
            {/* bar fill */}
            <rect
              x={x} y={y}
              width={barW} height={barH}
              rx="5" ry="5"
              fill={style.barColor}
              opacity="0.85"
            />
            {/* count label on top */}
            <text
              x={x + barW / 2} y={y - 5}
              textAnchor="middle" fontSize="9"
              fontWeight="700" fill={style.labelColor}
            >
              {d.count}
            </text>
            {/* Q label bottom */}
            <text
              x={x + barW / 2} y={paddingTop + chartH + 13}
              textAnchor="middle" fontSize="9"
              fill="#9CA3AF"
            >
              Q{d.turnNumber}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface ExpressionDistributionRowsProps {
  happy: number;
  neutral: number;
  negative: number;
}

function ExpressionDistributionRows({ happy, neutral, negative }: ExpressionDistributionRowsProps) {
  const items = [
    {
      key: "happy",
      label: "긍정",
      value: happy,
      comment: "미소를 유지해 호감 있는 인상을 주었습니다.",
      labelCls: "bg-[#DCFCE7] text-[#15803D]",
    },
    {
      key: "neutral",
      label: "무표정",
      value: neutral,
      comment: "차분하고 진지한 인상으로 신뢰감을 주었습니다.",
      labelCls: "text-[#6B7280] border border-gray-200",
    },
    {
      key: "negative",
      label: "부정",
      value: negative,
      comment: "긴장한 순간이 일부 있었으나 전반적으로 양호합니다.",
      labelCls: "text-[#E9B63B] border border-[#E9B63B]/20 bg-[#FDF6E3]",
    },
  ];
  const maxValue = Math.max(...items.map((i) => i.value));
  const highlightedKey = maxValue > 0 ? items.find((i) => i.value === maxValue)?.key : undefined;

  return (
    <div className="w-full space-y-1.5">
      {items.map((item) => {
        const isHighlight = item.key === highlightedKey;
        return (
          <div
            key={item.key}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
              isHighlight
                ? "bg-[#E6F7FA] border border-[rgba(9,145,178,0.15)]"
                : "bg-white border border-gray-100"
            }`}
          >
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${item.labelCls}`}>
              {item.label}
            </span>
            <p className={`flex-1 text-[12px] ${isHighlight ? "text-[#0E7490]" : "text-[#6B7280]"}`}>
              {item.comment}
            </p>
            <span className="text-[11px] text-[#6B7280] tabular-nums shrink-0">{item.value}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function VideoAnalysisSection({ summary, questionFeedbacks = [] }: VideoAnalysisProps) {
  const hasExprData = summary && summary.totalExpressionDistribution;
  const hasGazeData = summary && typeof summary.avgGazeDeviationRatio === "number";

  const happy = hasExprData ? Math.round(summary.totalExpressionDistribution.happy * 100) : 0;
  const neutral = hasExprData ? Math.round(summary.totalExpressionDistribution.neutral * 100) : 0;
  const negative = hasExprData ? Math.round(summary.totalExpressionDistribution.negative * 100) : 0;

  const gazeRatio = summary?.avgGazeDeviationRatio ?? 0;
  const gazeBadge = getGazeOverallBadge(gazeRatio);
  const gazeStablePct = Math.round((1 - gazeRatio) * 100);

  const turnGazeData = questionFeedbacks
    .filter((fb) => typeof fb.gazeDeviationCount === "number")
    .map((fb, i) => ({
      turnNumber: i + 1,
      count: fb.gazeDeviationCount ?? 0,
    }));

  const totalGazeCount = turnGazeData.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="report-card p-7">
      <p className="text-[15px] font-bold text-[#374151] mb-4">영상 분석 종합</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 표정 분포 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-start">
          <div className="flex items-center gap-2 w-full mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#E6F7FA] flex items-center justify-center shrink-0">
              <Smile size={16} className="text-[#0E7490]" />
            </div>
            <p className="text-[13px] font-semibold text-[#374151]">표정 분포</p>
            <span className={`ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              hasExprData ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F3F4F6] text-[#9CA3AF]"
            }`}>
              {hasExprData ? (happy + neutral >= 80 ? "우수" : happy + neutral >= 60 ? "양호" : "보통") : "—"}
            </span>
          </div>

          {hasExprData ? (
            <>
              <p className="text-[14px] font-bold text-[#1F2937] mb-1">
                {happy >= 30 ? "밝고 호감 있는 인상을 주었어요" : happy >= 15 ? "차분하고 안정적인 인상이에요" : "표정 변화가 적었어요"}
              </p>
              <p className="text-[12px] text-[#6B7280] leading-relaxed mb-3">
                긍정 표정 비율이 {happy}%로 {happy >= 30 ? "신뢰감과 친근함을 동시에 전달했습니다." : "안정적인 인상을 주었습니다."}
              </p>

              <div className="w-full mb-3">
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div className="bg-[#0991B2]" style={{ width: `${happy}%` }} />
                  <div className="bg-[#06B6D4]/40" style={{ width: `${neutral}%` }} />
                  <div className="bg-[#E5E7EB]" style={{ width: `${negative}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#0991B2]" />
                    <span className="text-[11px] text-[#6B7280]">긍정</span>
                    <span className="text-[11px] font-bold text-[#374151] ml-1">{happy}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#06B6D4]/40" />
                    <span className="text-[11px] text-[#6B7280]">무표정</span>
                    <span className="text-[11px] font-bold text-[#374151] ml-1">{neutral}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#E5E7EB]" />
                    <span className="text-[11px] text-[#6B7280]">부정</span>
                    <span className="text-[11px] font-bold text-[#374151] ml-1">{negative}%</span>
                  </div>
                </div>
              </div>

              <ExpressionDistributionRows happy={happy} neutral={neutral} negative={negative} />
            </>
          ) : (
            <div className="flex items-center justify-center py-8 w-full">
              <p className="text-[12px] text-[#9CA3AF]">영상 분석 데이터가 준비되면 표정 분포가 표시됩니다.</p>
            </div>
          )}
        </div>

        {/* 시선 처리 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 flex flex-col items-start">
          <div className="flex items-center gap-2 w-full mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#E6F7FA] flex items-center justify-center shrink-0">
              <Eye size={16} className="text-[#0991B2]" />
            </div>
            <p className="text-[13px] font-semibold text-[#374151]">시선 처리</p>
            <span className={`ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              hasGazeData ? gazeBadge.cls : "bg-[#F3F4F6] text-[#9CA3AF]"
            }`}>
              {hasGazeData ? gazeBadge.label : "—"}
            </span>
          </div>

          {hasGazeData && turnGazeData.length > 0 ? (
            <>
              <p className="text-[14px] font-bold text-[#1F2937] mb-0.5">
                {gazeRatio < 0.15
                  ? "대부분 카메라를 잘 응시했어요"
                  : gazeRatio < 0.30
                  ? "시선이 가끔 이탈되었어요"
                  : "시선 이탈이 잦았어요"}
              </p>
              <p className="text-[12px] text-[#6B7280] leading-relaxed mb-4">
                정면 응시 {gazeStablePct}% · 총 이탈 {totalGazeCount}회
              </p>

              <div className="w-full">
                <GazeBarChart data={turnGazeData} />
              </div>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#0991B2]" />
                  <span className="text-[10px] text-[#6B7280]">안정 (5회 미만)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
                  <span className="text-[10px] text-[#6B7280]">불안정 (5–11회)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" />
                  <span className="text-[10px] text-[#6B7280]">주의 (12회 이상)</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8 w-full">
              <p className="text-[12px] text-[#9CA3AF]">영상 분석 데이터가 준비되면 시선 이탈 그래프가 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
