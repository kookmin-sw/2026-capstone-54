import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { interviewApi } from "@/features/interview-session";
import type { InterviewSessionListItem, InterviewAnalysisReportStatus } from "@/features/interview-session";
import { Pagination } from "@/shared/ui/Pagination";
import { openSseStream } from "@/shared/api/sse";
import { SessionCard } from "./SessionCard";

export function InterviewResultsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<InterviewSessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingUuid, setGeneratingUuid] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasHiddenOlderSessions, setHasHiddenOlderSessions] = useState(false);

  const sseStreamsRef = useRef<Map<string, () => void>>(new Map());

  const fetchPage = async (page: number) => {
    setLoading(true); setError(null);
    try {
      const data = await interviewApi.getMyInterviews(page);
      setSessions(data.results);
      setTotalPages(data.totalPagesCount);
      setTotalCount(data.count);
      setHasHiddenOlderSessions(Boolean(data.hasHiddenOlderSessions));
    } catch { setError("목록을 불러오지 못했습니다."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPage(currentPage); }, [currentPage]);

  useEffect(() => () => { sseStreamsRef.current.forEach((c) => c()); sseStreamsRef.current.clear(); }, []);

  // SSE for report status
  useEffect(() => {
    sessions.forEach((s) => {
      const watching = s.reportStatus === "generating" || s.reportStatus === "pending";
      if (!watching || sseStreamsRef.current.has(s.uuid)) return;

      const terminalFlag = { done: false };
      const cancel = openSseStream(
        `/sse/interviews/${s.uuid}/report-status/`,
        (event, data) => {
          if (event !== "status") return;
          const newStatus = (data as { interview_analysis_report_status: string }).interview_analysis_report_status as InterviewAnalysisReportStatus;
          setSessions((prev) => prev.map((item) => item.uuid === s.uuid ? { ...item, reportStatus: newStatus } : item));
          if (newStatus === "completed" || newStatus === "failed") {
            terminalFlag.done = true;
            sseStreamsRef.current.get(s.uuid)?.();
            sseStreamsRef.current.delete(s.uuid);
          }
        },
        {
          shouldReconnect: () => !terminalFlag.done,
          onError: () => { terminalFlag.done = true; },
        },
      );
      sseStreamsRef.current.set(s.uuid, cancel);
    });
  }, [sessions]);

  const handleGenerateReport = async (uuid: string) => {
    setGeneratingUuid(uuid);
    try {
      await interviewApi.generateReport(uuid);
      setSessions((prev) => prev.map((s) => s.uuid === uuid ? { ...s, reportStatus: "pending" as InterviewAnalysisReportStatus } : s));
    } catch { setError("리포트 생성에 실패했습니다."); }
    finally { setGeneratingUuid(null); }
  };

  return (
    <div>
      <div className="w-full px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.4px] uppercase text-[#0991B2] bg-[#E6F7FA] py-1 px-3 rounded-full mb-2.5">📊 분석</div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-black tracking-[-0.8px] text-[#0A0A0A] leading-[1.1]">면접 결과</h1>
        <p className="text-sm text-[#6B7280] mt-1.5">
          지금까지 진행한 면접 세션과 분석 리포트를 확인하세요.
          {totalCount > 0 && ` (총 ${totalCount}개)`}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm mb-5">{error}</div>
      )}

      {!loading && hasHiddenOlderSessions && (
        <div className="bg-[#FFF7ED] border border-[#FED7AA] text-[#9A3412] rounded-xl p-4 text-sm mb-5">
          Free 플랜에서는 최근 7일의 면접 세션만 조회할 수 있습니다. 전체 이력을 보려면 Pro 플랜으로 업그레이드하세요.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#0991B2]" /></div>
      ) : sessions.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center shadow-sm">
          <p className="text-[#6B7280] mb-4">아직 진행한 면접이 없습니다.</p>
          <button onClick={() => navigate("/interview/setup")} className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] border-none cursor-pointer py-3 px-6 rounded-lg shadow-sm transition-opacity hover:opacity-85"><Plus size={14} /> 면접 시작하기</button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <SessionCard
                key={s.uuid}
                session={s}
                isGenerating={generatingUuid === s.uuid}
                onContinue={(uuid) => window.open(`/interview/precheck/${uuid}`, "_blank")}
                onViewReport={(uuid) => navigate(`/interview/session/${uuid}/report`)}
                onGenerateReport={handleGenerateReport}
              />
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-6" />
        </>
      )}
      </div>
    </div>
  );
}
