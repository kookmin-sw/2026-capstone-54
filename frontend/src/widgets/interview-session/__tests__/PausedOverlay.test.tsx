import { render, screen, fireEvent } from "@testing-library/react";

const mockSetPaused = jest.fn();
let mockState = {
  isPaused: false as boolean,
  pauseReason: null as string | null,
  setPaused: mockSetPaused,
};

jest.mock("@/features/interview-session/model/store", () => ({
  useInterviewSessionStore: <T,>(selector: (s: typeof mockState) => T): T => selector(mockState),
}));

import { PausedOverlay } from "../PausedOverlay";

describe("PausedOverlay", () => {
  beforeEach(() => {
    mockSetPaused.mockClear();
    mockState = { isPaused: false, pauseReason: null, setPaused: mockSetPaused };
  });

  it("isPaused=false 일 때 렌더되지 않는다", () => {
    const { container } = render(<PausedOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it("isPaused=true 일 때 reason 별 메시지 + '이어서 하기' 버튼 표시", () => {
    mockState = { isPaused: true, pauseReason: "user_left_window", setPaused: mockSetPaused };
    render(<PausedOverlay />);
    expect(screen.getByText("다른 탭/창으로 이동했습니다")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이어서 하기" })).toBeInTheDocument();
  });

  it("user_idle reason 일 때 '장시간 활동이 없어' 메시지", () => {
    mockState = { isPaused: true, pauseReason: "user_idle", setPaused: mockSetPaused };
    render(<PausedOverlay />);
    expect(screen.getByText("장시간 활동이 없어 일시정지했습니다")).toBeInTheDocument();
  });

  it("'이어서 하기' 클릭 시 onResume 콜백 + setPaused(false, null) 호출", () => {
    mockState = { isPaused: true, pauseReason: "user_left_window", setPaused: mockSetPaused };
    const onResume = jest.fn();
    render(<PausedOverlay onResume={onResume} />);

    fireEvent.click(screen.getByRole("button", { name: "이어서 하기" }));

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(mockSetPaused).toHaveBeenCalledWith(false, null);
  });

  it("onResume 없이도 클릭 시 setPaused(false, null) 호출", () => {
    mockState = { isPaused: true, pauseReason: "manual_pause", setPaused: mockSetPaused };
    render(<PausedOverlay />);

    fireEvent.click(screen.getByRole("button", { name: "이어서 하기" }));

    expect(mockSetPaused).toHaveBeenCalledWith(false, null);
  });
});
