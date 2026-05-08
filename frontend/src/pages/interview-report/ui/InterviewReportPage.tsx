import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Download } from "lucide-react";
import { useInterviewSessionStore, recordingApi, interviewApi } from "@/features/interview-session";
import type { RecordingItem, BehaviorAnalysis } from "@/features/interview-session";
import { RadarChart } from "./RadarChart";
import { ScoreGauge } from "./ScoreGauge";
import { StrengthsImprovements } from "./StrengthsImprovements";
import { QuestionFeedbackList } from "./QuestionFeedbackList";
import { InterviewOverview } from "./InterviewOverview";
import { AudioAnalysisSection } from "./AudioAnalysisSection";
import { VideoAnalysisSection } from "./VideoAnalysisSection";
import { GRADE_BADGE } from "./constants";

const SECTIONS = [
  { id: "overview", label: "면접 개요" },
  { id: "summary", label: "종합 평가" },
  { id: "capabilities", label: "역량 분석" },
  { id: "strengths-section", label: "강점 · 개선" },
  { id: "audio-section", label: "음성 분석" },
  { id: "video-section", label: "영상 분석" },
  { id: "feedback-section", label: "질문별 피드백" },
];

export function InterviewReportPage() {
  const { interviewSessionUuid } = useParams<{ interviewSessionUuid: string }>();
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [behaviorAnalyses, setBehaviorAnalyses] = useState<BehaviorAnalysis[]>([]);
  const [activeSection, setActiveSection] = useState("overview");

  const {
    interviewTurns, interviewAnalysisReport, isReportPolling,
    loadInterviewSession, loadInterviewTurns, startReportPolling, resetInterviewSession,
  } = useInterviewSessionStore();

  useEffect(() => {
    if (!interviewSessionUuid) return;
    resetInterviewSession();
    loadInterviewSession(interviewSessionUuid);
    loadInterviewTurns(interviewSessionUuid);
    startReportPolling(interviewSessionUuid);
    recordingApi.list(interviewSessionUuid).then(setRecordings).catch(() => {});
    interviewApi.getBehaviorAnalyses(interviewSessionUuid).then(setBehaviorAnalyses).catch(() => {});
  }, [interviewSessionUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [interviewAnalysisReport]);

  const turnAnswerMap = Object.fromEntries(interviewTurns.map((t) => [t.id, t.answer]));
  const report = interviewAnalysisReport;
  const isCompleted = report?.interviewAnalysisReportStatus === "completed";
  const isFailed = report?.interviewAnalysisReportStatus === "failed";
  const isPending = !report || report.interviewAnalysisReportStatus === "pending" || report.interviewAnalysisReportStatus === "generating";

  const gradeBadge = GRADE_BADGE[report?.overallGrade ?? ""] ?? GRADE_BADGE.Average;

  return (
    <div className="report-page min-h-screen bg-[#F8F9FA] antialiased">
      {/* Mesh background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 60% 50% at 10% 30%, rgba(9,145,178,.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 90% 10%, rgba(6,182,212,.14) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 80% 80%, rgba(9,145,178,.10) 0%, transparent 50%)"
        }} />
      </div>

      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-[16px] saturate-[160%] bg-[#F8F9FA]/90 border-b border-gray-100/80 h-14 flex items-center px-5">
        <div className="max-w-[1280px] mx-auto w-full flex items-center justify-between">
          <Link to="/interview/results" className="flex items-center gap-1.5 text-[13px] text-[#9CA3AF] hover:text-[#374151] transition-colors no-underline">
            <ArrowLeft size={15} strokeWidth={1.8} />
            면접 목록
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#4B5563]">면접 분석 리포트</span>
            {isCompleted && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[13px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                분석 완료
              </span>
            )}
          </div>
          <Link to="/interview/setup" className="flex items-center gap-1.5 bg-[#0991B2] hover:bg-[#0E7490] text-white text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-colors no-underline">
            <Download size={13} />
            pdf저장이 들어갈 곳~.~
          </Link>
        </div>
      </nav>

      {/* Layout */}
      <div className="max-w-[1280px] mx-auto px-5 pt-14 flex gap-6">
        {/* Side Nav */}
        {isCompleted && (
          <aside className="hidden lg:block w-[176px] shrink-0 pt-8">
            <nav className="sticky top-20 space-y-0.5">
              {SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[12px] transition-colors text-left ${
                    activeSection === id
                      ? "text-[#0991B2] bg-[#E6F7FA] font-semibold"
                      : "text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6]"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    activeSection === id ? "bg-[#0991B2] opacity-100" : "bg-current opacity-50"
                  }`} />
                  {label}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 pb-24 space-y-4 pt-8">
          {/* 페이지 제목 */}
          {isCompleted && report && (
            <div className="mb-2">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[13px] font-semibold text-[#0991B2] bg-[#E6F7FA] px-2.5 py-0.5 rounded-full border border-[rgba(9,145,178,0.15)]">AI 분석 완료</span>
                <span className="text-[13px] text-[#9CA3AF]">
                  {report.interviewDate ? new Date(report.interviewDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) : ""}
                </span>
              </div>
              <h1 className="text-[22px] font-bold text-[#111827]">면접 분석 리포트</h1>
            </div>
          )}

          {isPending && (
            <div className="report-card p-10 text-center mt-8">
              <Loader2 className="w-12 h-12 animate-spin text-[#0991B2] mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-2">리포트를 생성하고 있어요</h2>
              <p className="text-sm text-[#6B7280]">AI가 면접 내용을 분석하고 있습니다. 잠시만 기다려주세요.</p>
              {isReportPolling && <div className="mt-4 text-[11px] text-[#9CA3AF]">자동으로 새로고침 중...</div>}
            </div>
          )}

          {isFailed && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center mt-8">
              <p className="text-red-600 font-bold mb-2">리포트 생성에 실패했습니다</p>
              <p className="text-sm text-red-400">{report?.errorMessage || "알 수 없는 오류가 발생했습니다."}</p>
            </div>
          )}

          {isCompleted && report && (
            <>
              {/* 면접 개요 */}
              <section id="overview" className="scroll-mt-20">
                <InterviewOverview report={report} />
              </section>

              {/* 종합 평가 */}
              <section id="summary" className="scroll-mt-20">
                <div className="report-card-hi p-7">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[15px] font-bold text-[#374151]">종합 평가</p>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${gradeBadge.bg} ${gradeBadge.text}`}>
                      {gradeBadge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="shrink-0">
                      <ScoreGauge score={report.overallScore ?? 0} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#4B5563] leading-relaxed mb-3">
                        {[report.overallComment, report.audioAnalysisComment, report.videoAnalysisComment].filter(Boolean).join(" ")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {report.durationSeconds && report.durationSeconds > 0 && (
                          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] bg-[#F9FAFB] px-2.5 py-1 rounded-lg border border-gray-100">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0991B2" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>
                            평균 답변시간 <span className="font-semibold text-[#374151]">{Math.floor(report.durationSeconds / (report.totalQuestions || 1) / 60)}분 {Math.floor((report.durationSeconds / (report.totalQuestions || 1)) % 60)}초</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] bg-[#F9FAFB] px-2.5 py-1 rounded-lg border border-gray-100">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          총 질문 <span className="font-semibold text-[#374151]">{report.totalQuestions}문항</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 역량 분석 */}
              {report.categoryScores.length > 0 && (
                <section id="capabilities" className="scroll-mt-20">
                  <div className="report-card p-8">
                    <p className="text-[15px] font-bold text-[#374151] mb-5">역량 분석</p>
                    <div className="flex flex-col sm:flex-row items-stretch gap-8">
                      <div className="w-full sm:w-1/3 shrink-0 flex items-center justify-center overflow-hidden">
                        <RadarChart scores={report.categoryScores} />
                      </div>
                      <div className="flex-1 w-full flex flex-col justify-center space-y-5 sm:border-l sm:border-gray-100 sm:pl-8">
                        {report.categoryScores.map((cat, i) => (
                          <div key={i}>
                            <div className="flex justify-between mb-1">
                              <span className="text-[13px] font-semibold text-[#374151]">{cat.category}</span>
                              <span className="text-[13px] font-bold text-[#0991B2] tabular-nums">{cat.score}</span>
                            </div>
                            <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden mb-2">
                              <div
                                className="h-full bg-[#06B6D4] rounded-full transition-all duration-700"
                                style={{ width: `${cat.score}%` }}
                              />
                            </div>
                            <p className="text-[11px] text-[#6B7280] leading-relaxed">{cat.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 강점 / 개선 */}
              <section id="strengths-section" className="scroll-mt-20">
                <StrengthsImprovements strengths={report.strengths} improvements={report.improvementAreas} />
              </section>

              {/* 음성 분석 종합 */}
              <section id="audio-section" className="scroll-mt-20">
                <AudioAnalysisSection
                  audioAnalysisResult={report.audioAnalysisResult}
                />
              </section>

              {/* 영상 분석 종합 */}
              <section id="video-section" className="scroll-mt-20">
                <VideoAnalysisSection
                  summary={report.videoAnalysisResult}
                  questionFeedbacks={report.questionFeedbacks}
                />
              </section>

              {/* 질문별 피드백 */}
              <section id="feedback-section" className="scroll-mt-20">
                <QuestionFeedbackList
                  feedbacks={report.questionFeedbacks}
                  turnAnswerMap={turnAnswerMap}
                  recordings={recordings}
                  behaviorAnalyses={behaviorAnalyses}
                  interviewTurns={interviewTurns}
                />
              </section>

              {/* Footer actions */}
              <div className="flex gap-3 justify-center flex-wrap pt-4">
                <Link to="/interview/setup" className="inline-flex items-center gap-2 text-[13px] font-bold text-white bg-[#0991B2] hover:bg-[#0E7490] rounded-xl py-3 px-8 no-underline transition-colors">다시 면접하기 →</Link>
                <Link to="/interview/results" className="inline-flex items-center gap-2 text-[13px] font-bold text-[#374151] border border-[#E5E7EB] bg-white rounded-xl py-3 px-8 no-underline hover:bg-[#F9FAFB] transition-colors">← 면접 결과 목록</Link>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
