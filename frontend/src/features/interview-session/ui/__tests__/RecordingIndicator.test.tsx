import { render, screen, act } from "@testing-library/react";
import { RecordingIndicator } from "../RecordingIndicator";

describe("RecordingIndicator", () => {
  let nowSpy: jest.SpyInstance;
  let currentMockTime: number;

  beforeEach(() => {
    jest.useFakeTimers();
    currentMockTime = 1_000_000;
    nowSpy = jest.spyOn(Date, "now").mockImplementation(() => currentMockTime);
  });

  afterEach(() => {
    nowSpy.mockRestore();
    jest.useRealTimers();
  });

  it("isRecording=false 일 때 렌더되지 않는다", () => {
    const { container } = render(<RecordingIndicator isRecording={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("isRecording=true 일 때 REC + 00:00 시작", () => {
    render(<RecordingIndicator isRecording={true} />);
    expect(screen.getByText("REC")).toBeInTheDocument();
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("1초마다 타이머 증가 (REC 상태)", () => {
    render(<RecordingIndicator isRecording={true} />);
    expect(screen.getByText("00:00")).toBeInTheDocument();

    act(() => {
      currentMockTime += 1000;
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("00:01")).toBeInTheDocument();

    act(() => {
      currentMockTime += 4000;
      jest.advanceTimersByTime(4000);
    });
    expect(screen.getByText("00:05")).toBeInTheDocument();
  });

  it("isPaused=true 가 되면 PAUSED 라벨로 변경되고 타이머 멈춤", () => {
    const { rerender } = render(<RecordingIndicator isRecording={true} />);

    act(() => {
      currentMockTime += 3000;
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByText("00:03")).toBeInTheDocument();
    expect(screen.getByText("REC")).toBeInTheDocument();

    rerender(<RecordingIndicator isRecording={true} isPaused={true} />);
    expect(screen.getByText("PAUSED")).toBeInTheDocument();

    act(() => {
      currentMockTime += 5000;
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByText("00:03")).toBeInTheDocument();
  });

  it("isPaused 해제 시 paused 시간 제외하고 이어서 카운트", () => {
    const { rerender } = render(<RecordingIndicator isRecording={true} />);

    act(() => {
      currentMockTime += 2000;
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText("00:02")).toBeInTheDocument();

    rerender(<RecordingIndicator isRecording={true} isPaused={true} />);
    act(() => {
      currentMockTime += 10_000;
      jest.advanceTimersByTime(10_000);
    });
    expect(screen.getByText("00:02")).toBeInTheDocument();

    rerender(<RecordingIndicator isRecording={true} isPaused={false} />);
    act(() => {
      currentMockTime += 1000;
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("00:03")).toBeInTheDocument();
    expect(screen.getByText("REC")).toBeInTheDocument();
  });

  it("isRecording=false 로 전환 시 모든 ref 리셋", () => {
    const { rerender } = render(<RecordingIndicator isRecording={true} />);

    act(() => {
      currentMockTime += 5000;
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByText("00:05")).toBeInTheDocument();

    rerender(<RecordingIndicator isRecording={false} />);

    rerender(<RecordingIndicator isRecording={true} />);
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });
});
