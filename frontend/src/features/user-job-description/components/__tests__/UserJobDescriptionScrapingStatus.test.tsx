import { render, screen, act } from "@testing-library/react";
import { openSseStream } from "@/shared/api/sse";
import { UserJobDescriptionScrapingStatus } from "../UserJobDescriptionScrapingStatus";

jest.mock("@/shared/api/sse", () => ({
  openSseStream: jest.fn(),
}));

const mockOpenSseStream = openSseStream as jest.MockedFunction<typeof openSseStream>;

describe("UserJobDescriptionScrapingStatus", () => {
  let capturedOnEvent: (event: string, data: unknown) => void;

  beforeEach(() => {
    mockOpenSseStream.mockImplementation((_path, onEvent) => {
      capturedOnEvent = onEvent;
      return jest.fn();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders_pending: initialStatus=pending이면 대기 중 표시를 렌더링한다", () => {
    render(
      <UserJobDescriptionScrapingStatus uuid="test-uuid" initialStatus="pending" />,
    );
    expect(screen.getByText("분석 대기 중...")).toBeInTheDocument();
  });

  it("renders_in_progress: initialStatus=in_progress이면 진행 중 표시를 렌더링한다", () => {
    render(
      <UserJobDescriptionScrapingStatus uuid="test-uuid" initialStatus="in_progress" />,
    );
    expect(screen.getByText("채용공고 분석 중...")).toBeInTheDocument();
  });

  it("renders_done: initialStatus=done이면 완료 표시를 렌더링하고 SSE 연결하지 않는다", () => {
    render(
      <UserJobDescriptionScrapingStatus uuid="test-uuid" initialStatus="done" />,
    );
    expect(screen.getByText("분석 완료")).toBeInTheDocument();
    expect(mockOpenSseStream).not.toHaveBeenCalled();
  });

  it("renders_error: initialStatus=error이면 실패 표시를 렌더링하고 SSE 연결하지 않는다", () => {
    render(
      <UserJobDescriptionScrapingStatus uuid="test-uuid" initialStatus="error" />,
    );
    expect(screen.getByText("분석 실패")).toBeInTheDocument();
    expect(mockOpenSseStream).not.toHaveBeenCalled();
  });

  it("updates_on_sse: SSE status 이벤트 수신 시 UI 상태가 업데이트된다", () => {
    render(
      <UserJobDescriptionScrapingStatus uuid="test-uuid" initialStatus="pending" />,
    );
    expect(screen.getByText("분석 대기 중...")).toBeInTheDocument();

    act(() => {
      capturedOnEvent("status", {
        collection_status: "in_progress",
        updated_at: null,
      });
    });

    expect(screen.getByText("채용공고 분석 중...")).toBeInTheDocument();
  });
});
