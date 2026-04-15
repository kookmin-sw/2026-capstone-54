import { render, screen } from "@testing-library/react";
import { AnalysisProgress } from "../AnalysisProgress";

describe("AnalysisProgress", () => {
  it("completed 상태이면 완료 메시지를 표시한다", () => {
    render(<AnalysisProgress status="completed" step="done" />);
    expect(screen.getByText(/분석이 완료되었어요/)).toBeInTheDocument();
  });

  it("failed 상태이면 실패 메시지를 표시한다", () => {
    render(<AnalysisProgress status="failed" step="done" />);
    expect(screen.getByText(/분석에 실패했어요/)).toBeInTheDocument();
  });

  it("processing 상태이면 현재 step 라벨과 진행 바를 표시한다", () => {
    const { container } = render(<AnalysisProgress status="processing" step="analyzing" />);
    expect(screen.getByText(/내용을 분석하고 있어요/)).toBeInTheDocument();
    // 진행 바가 있는지 확인
    expect(container.querySelector("div.h-1.rounded-full")).toBeTruthy();
  });

  it("pending 상태일 때도 로딩 스피너/라벨이 나타난다", () => {
    render(<AnalysisProgress status="pending" step="queued" />);
    expect(screen.getByText(/대기열에 들어갔어요/)).toBeInTheDocument();
  });
});
