import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { useInterviewSessionStore } from "@/features/interview-session";
import { RadarChart } from "./RadarChart";
import { ScoreGauge } from "./ScoreGauge";
import { StrengthsImprovements } from "./StrengthsImprovements";
import { QuestionFeedbackList } from "./QuestionFeedbackList";

const GRADE_COLOR: Record<string, string> = {
  Excellent: "text-[#059669]", Good: "text-[#0991B2]", Average: "text-[#D97706]",
  "Below Average": "text-[#DC2626]", Poor: "text-[#DC2626]",
};

const GRADE_KO: Record<string, string> = {
  Excellent: "우수", Good: "양호", Average: "보통", "Below Average": "미흡", Poor: "부족",
};

export function InterviewReportPage() {
  const { interviewSessionUuid } = useParams<{ interviewSessionUuid: string }>();

  const {
    interviewSession, interviewTurns, interviewAnalysisReport, isReportPolling,
    loadInterviewSession, loadInterviewTurns, startReportPolling, resetInterviewSession,
  } = useInterviewSessionStore();

  useEffect(() => {
    if (!interviewSessionUuid) return;
    resetInterviewSession();
    loadInterviewSession(interviewSessionUuid);
    loadInterviewTurns(interviewSessionUuid);
    startReportPolling(interviewSessionUuid);
  }, [interviewSessionUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const turnAnswerMap = Object.fromEntries(interviewTurns.map((t) => [t.id, t.answer]));
  const report = interviewAnalysisReport;
  const isCompleted = report?.interviewAnalysisReportStatus === "completed";
  const isFailed = report?.interviewAnalysisReportStatus === "failed";
  const isPending = !report || report.interviewAnalysisReportStatus === "pending" || report.interviewAnalysisReportStatus === "generating";

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Nav */}
      <nav className="sticky top-0 z-[200] bg-white/[.92] backdrop-blur-[20px] border-b border-[#E5E7EB] h-[60px] flex items-center px-6 gap-3">
        <Link to="/interview/results" className="flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#0A0A0A] no-underline">
          <ArrowLeft size={16} /> 면접 결과
        </Link>
        <span className="text-[#E5E7EB]">/</span>
        <span className="text-sm font-bold text-[#0A0A0A]">분석 리포트</span>
        <div className="flex-1" />
        <Link to="/interview/setup" className="text-[13px] font-bold text-white bg-[#0A0A0A] rounded-lg py-2 px-4 no-underline hover:opacity-85">새 면접 →</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-8 pb-16">
        {/* Header */}
        <div className="mb-6">
          <div className="text-[11px] font-bold tracking-[.1em] uppercase text-[#0991B2] mb-2">AI 면접 분석 리포트</div>
          <h1 className="text-[clamp(22px,3vw,32px)] font-black tracking-[-0.5px]">면접 분석 리포트</h1>
          {interviewSession && (
            <p className="text-sm text-[#6B7280] mt-1">
              {interviewSession.interviewSessionType === "followup" ? "꼬리질문형" : "전체 프로세스"} 면접
              {" · "}
              {{ friendly: "친근한", normal: "일반", pressure: "압박" }[interviewSession.interviewDifficultyLevel] ?? "일반"} 면접관
            </p>
          )}
        </div>

        {/* Pending */}
        {isPending && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center shadow-sm mb-6">
            <Loader2 className="w-12 h-12 animate-spin text-[#0991B2] mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">리포트를 생성하고 있어요</h2>
            <p className="text-sm text-[#6B7280]">AI가 면접 내용을 분석하고 있습니다. 잠시만 기다려주세요.</p>
            {isReportPolling && <div className="mt-4 text-[11px] text-[#9CA3AF]">자동으로 새로고침 중...</div>}
          </div>
        )}

        {/* Failed */}
        {isFailed && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-6">
            <p className="text-red-600 font-bold mb-2">리포트 생성에 실패했습니다</p>
            <p className="text-sm text-red-400">{report?.errorMessage || "알 수 없는 오류가 발생했습니다."}</p>
          </div>
        )}

        {/* Completed */}
        {isCompleted && report && (
          <>
            {/* Overall score */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm mb-4 flex flex-col sm:flex-row items-center gap-6">
              <div className="shrink-0 w-40"><ScoreGauge score={report.overallScore ?? 0} /></div>
              <div className="flex-1 text-center sm:text-left">
                <div className={`text-3xl font-black mb-1 ${GRADE_COLOR[report.overallGrade] ?? "text-[#6B7280]"}`}>
                  {report.overallGrade} <span className="text-lg font-bold">({GRADE_KO[report.overallGrade] ?? report.overallGrade})</span>
                </div>
                <p className="text-sm text-[#4B5563] leading-relaxed">{report.overallComment}</p>
              </div>
            </div>

            {/* Category scores */}
            {report.categoryScores.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm mb-4">
                <h2 className="text-[13px] font-bold mb-4">카테고리별 점수</h2>
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="w-full sm:w-64 shrink-0"><RadarChart scores={report.categoryScores} /></div>
                  <div className="flex-1 w-full flex flex-col gap-3">
                    {report.categoryScores.map((cat, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="font-semibold text-[#374151]">{cat.category}</span>
                          <span className="font-bold text-[#0A0A0A]">{cat.score}</span>
                        </div>
                        <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden mb-0.5">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${cat.score}%`, background: cat.score >= 80 ? "#059669" : cat.score >= 60 ? "#0991B2" : "#D97706" }} />
                        </div>
                        <p className="text-[11px] text-[#6B7280]">{cat.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <StrengthsImprovements strengths={report.strengths} improvements={report.improvementAreas} />
            <QuestionFeedbackList feedbacks={report.questionFeedbacks} turnAnswerMap={turnAnswerMap} />

            {/* CTA */}
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/interview/setup" className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] rounded-xl py-3 px-8 no-underline hover:opacity-85">다시 면접하기 →</Link>
              <Link to="/interview/results" className="inline-flex items-center gap-2 text-sm font-bold text-[#374151] border border-[#E5E7EB] bg-white rounded-xl py-3 px-8 no-underline hover:bg-[#F9FAFB]">← 면접 결과 목록</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
