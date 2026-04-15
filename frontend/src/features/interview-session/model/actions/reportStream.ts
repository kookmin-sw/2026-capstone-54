/** 리포트 상태 구독: REST로 초기 스냅샷 → SSE로 실시간 업데이트 → 완료/실패 시 종료. */
import { interviewApi } from "../../api/interviewApi";
import { openSseStream } from "@/shared/api/sse";
import type { InterviewAnalysisReportStatus } from "../../api/types";
import type { InterviewSessionStore } from "../types";

type Set = (
  partial:
    | Partial<InterviewSessionStore>
    | ((s: InterviewSessionStore) => Partial<InterviewSessionStore>),
) => void;

// Module-level ref for the active SSE cancel function (one stream at a time)
export const reportSseCancelRef: { cancel: (() => void) | null } = { cancel: null };

function isDone(status: InterviewAnalysisReportStatus): boolean {
  return status === "completed" || status === "failed";
}

export function startReportPolling(set: Set, interviewSessionUuid: string) {
  set({ isReportPolling: true });

  interviewApi.getInterviewAnalysisReport(interviewSessionUuid)
    .then((report) => {
      set({ interviewAnalysisReport: report });
      if (isDone(report.interviewAnalysisReportStatus)) {
        set({ isReportPolling: false });
        return;
      }
      subscribeToReportStream(set, interviewSessionUuid);
    })
    .catch(() => set({ isReportPolling: false }));
}

function subscribeToReportStream(set: Set, interviewSessionUuid: string) {
  const cancel = openSseStream(
    `/sse/interviews/${interviewSessionUuid}/report-status/`,
    (event, data) => {
      if (event !== "status") return;
      const payload = data as { interview_analysis_report_status: InterviewAnalysisReportStatus };
      const newStatus = payload.interview_analysis_report_status;

      set((s) => ({
        interviewAnalysisReport: s.interviewAnalysisReport
          ? { ...s.interviewAnalysisReport, interviewAnalysisReportStatus: newStatus }
          : s.interviewAnalysisReport,
      }));

      if (isDone(newStatus)) {
        interviewApi.getInterviewAnalysisReport(interviewSessionUuid)
          .then((fresh) => set({ interviewAnalysisReport: fresh, isReportPolling: false }))
          .catch(() => set({ isReportPolling: false }));
        cancel();
        reportSseCancelRef.cancel = null;
      }
    },
    () => set({ isReportPolling: false }),
  );
  reportSseCancelRef.cancel = cancel;
}

export function stopReportStream() {
  if (reportSseCancelRef.cancel) {
    reportSseCancelRef.cancel();
    reportSseCancelRef.cancel = null;
  }
}
