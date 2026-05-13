const mockGetReport = jest.fn();
const mockOpenSse = jest.fn();

jest.mock("../../../api/interviewApi", () => ({
  interviewApi: {
    getInterviewAnalysisReport: (...args: unknown[]) => mockGetReport(...args),
  },
}));

jest.mock("@/shared/api/sse", () => ({
  openSseStream: (...args: unknown[]) => mockOpenSse(...args),
}));

import { startReportPolling, stopReportStream, reportSseCancelRef } from "../reportStream";

interface CapturedSse {
  path: string;
  onEvent: (event: string, data: unknown) => void;
  options: { shouldReconnect?: () => boolean; onError?: (e: Error) => void };
}

let captured: CapturedSse | null = null;
const cancelMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  captured = null;
  cancelMock.mockClear();
  reportSseCancelRef.cancel = null;

  mockOpenSse.mockImplementation((path: string, onEvent: CapturedSse["onEvent"], options: CapturedSse["options"]) => {
    captured = { path, onEvent, options };
    return cancelMock;
  });
});

describe("startReportPolling — 초기 REST 스냅샷", () => {
  it("getInterviewAnalysisReport 호출 + isReportPolling true", async () => {
    mockGetReport.mockResolvedValue({ interviewAnalysisReportStatus: "in_progress" });
    const set = jest.fn();

    startReportPolling(set, "s1");
    await Promise.resolve();
    await Promise.resolve();

    expect(set).toHaveBeenNthCalledWith(1, { isReportPolling: true });
    expect(mockGetReport).toHaveBeenCalledWith("s1");
  });

  it("status='completed' (terminal) → SSE 구독 안 함 + polling false", async () => {
    mockGetReport.mockResolvedValue({ interviewAnalysisReportStatus: "completed" });
    const set = jest.fn();

    startReportPolling(set, "s1");
    await Promise.resolve();
    await Promise.resolve();

    expect(mockOpenSse).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({ isReportPolling: false });
  });

  it("status='failed' (terminal) → SSE 구독 안 함", async () => {
    mockGetReport.mockResolvedValue({ interviewAnalysisReportStatus: "failed" });
    const set = jest.fn();

    startReportPolling(set, "s1");
    await Promise.resolve();
    await Promise.resolve();

    expect(mockOpenSse).not.toHaveBeenCalled();
  });

  it("status='in_progress' → SSE 구독 시작 + report-status URL", async () => {
    mockGetReport.mockResolvedValue({ interviewAnalysisReportStatus: "in_progress" });
    const set = jest.fn();

    startReportPolling(set, "s9");
    await Promise.resolve();
    await Promise.resolve();

    expect(mockOpenSse).toHaveBeenCalledTimes(1);
    expect(captured?.path).toBe("/sse/interviews/s9/report-status/");
  });

  it("getInterviewAnalysisReport 실패 → isReportPolling false", async () => {
    mockGetReport.mockRejectedValue(new Error("fail"));
    const set = jest.fn();

    startReportPolling(set, "s1");
    await Promise.resolve();
    await Promise.resolve();

    expect(set).toHaveBeenCalledWith({ isReportPolling: false });
  });
});

describe("subscribeToReportStream — SSE status 처리", () => {
  it("status 이벤트 → interviewAnalysisReport.status 업데이트 (기존 report 있을 때)", async () => {
    mockGetReport.mockResolvedValue({ interviewAnalysisReportStatus: "in_progress" });
    const set = jest.fn();
    startReportPolling(set, "s1");
    await Promise.resolve();
    await Promise.resolve();

    captured!.onEvent("status", { interview_analysis_report_status: "in_progress" });
    const lastCall = set.mock.calls[set.mock.calls.length - 1][0];
    expect(typeof lastCall).toBe("function");
    const result = lastCall({
      interviewAnalysisReport: { interviewAnalysisReportStatus: "in_progress", other: "x" },
    });
    expect(result.interviewAnalysisReport.interviewAnalysisReportStatus).toBe("in_progress");
  });

  it("status 'completed' (terminal) → cancel + final getReport + polling false", async () => {
    mockGetReport.mockResolvedValue({ interviewAnalysisReportStatus: "in_progress" });
    const set = jest.fn();
    startReportPolling(set, "s1");
    await Promise.resolve();
    await Promise.resolve();

    mockGetReport.mockResolvedValueOnce({ interviewAnalysisReportStatus: "completed", finalData: true });

    captured!.onEvent("status", { interview_analysis_report_status: "completed" });
    expect(cancelMock).toHaveBeenCalled();

    await Promise.resolve();
    await Promise.resolve();

    expect(set).toHaveBeenCalledWith({
      interviewAnalysisReport: expect.objectContaining({ interviewAnalysisReportStatus: "completed" }),
      isReportPolling: false,
    });
  });

  it("event !== 'status' → 무시", async () => {
    mockGetReport.mockResolvedValue({ interviewAnalysisReportStatus: "in_progress" });
    const set = jest.fn();
    startReportPolling(set, "s1");
    await Promise.resolve();
    await Promise.resolve();

    const callsBefore = set.mock.calls.length;
    captured!.onEvent("error", { message: "x" });
    expect(set.mock.calls.length).toBe(callsBefore);
  });

  it("SSE shouldReconnect: terminal 전 → true / 후 → false", async () => {
    mockGetReport.mockResolvedValue({ interviewAnalysisReportStatus: "in_progress" });
    const set = jest.fn();
    startReportPolling(set, "s1");
    await Promise.resolve();
    await Promise.resolve();

    expect(captured!.options.shouldReconnect?.()).toBe(true);

    mockGetReport.mockResolvedValueOnce({ interviewAnalysisReportStatus: "completed" });
    captured!.onEvent("status", { interview_analysis_report_status: "completed" });

    expect(captured!.options.shouldReconnect?.()).toBe(false);
  });

  it("SSE onError → isReportPolling false", async () => {
    mockGetReport.mockResolvedValue({ interviewAnalysisReportStatus: "in_progress" });
    const set = jest.fn();
    startReportPolling(set, "s1");
    await Promise.resolve();
    await Promise.resolve();

    captured!.options.onError?.(new Error("ws fail"));
    expect(set).toHaveBeenCalledWith({ isReportPolling: false });
  });
});

describe("stopReportStream", () => {
  it("reportSseCancelRef.cancel 있음 → 호출 + null 로 리셋", () => {
    reportSseCancelRef.cancel = cancelMock;
    stopReportStream();
    expect(cancelMock).toHaveBeenCalled();
    expect(reportSseCancelRef.cancel).toBeNull();
  });

  it("reportSseCancelRef.cancel=null → no-op", () => {
    reportSseCancelRef.cancel = null;
    expect(() => stopReportStream()).not.toThrow();
  });
});
