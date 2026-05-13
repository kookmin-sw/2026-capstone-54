import { render, screen } from "@testing-library/react";
import { ResumeStatusBadge } from "../ResumeStatusBadge";

describe("ResumeStatusBadge", () => {
  it("processing 상태 라벨을 표시한다", () => {
    render(<ResumeStatusBadge status="processing" />);
    expect(screen.getByText("분석 중")).toBeInTheDocument();
  });

  it("completed 상태 라벨을 표시한다", () => {
    render(<ResumeStatusBadge status="completed" />);
    expect(screen.getByText("분석 완료")).toBeInTheDocument();
  });

  it("failed 상태 라벨을 표시한다", () => {
    render(<ResumeStatusBadge status="failed" />);
    expect(screen.getByText("분석 실패")).toBeInTheDocument();
  });

  it("pending 상태 라벨을 표시한다", () => {
    render(<ResumeStatusBadge status="pending" />);
    expect(screen.getByText("대기")).toBeInTheDocument();
  });
});
