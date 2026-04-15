import { render, screen } from "@testing-library/react";
import { ResumeStatusBadge } from "../ResumeStatusBadge";

describe("ResumeStatusBadge", () => {
  it("processing 상태 라벨을 표시한다", () => {
    render(<ResumeStatusBadge status="processing" isActive={true} />);
    expect(screen.getByText("분석 중")).toBeInTheDocument();
  });

  it("completed 상태 라벨을 표시한다", () => {
    render(<ResumeStatusBadge status="completed" isActive={true} />);
    expect(screen.getByText("분석 완료")).toBeInTheDocument();
  });

  it("failed 상태 라벨을 표시한다", () => {
    render(<ResumeStatusBadge status="failed" isActive={true} />);
    expect(screen.getByText("분석 실패")).toBeInTheDocument();
  });

  it("isActive=false이면 '비활성' 보조 배지가 함께 표시된다", () => {
    render(<ResumeStatusBadge status="completed" isActive={false} />);
    expect(screen.getByText("분석 완료")).toBeInTheDocument();
    expect(screen.getByText("비활성")).toBeInTheDocument();
  });

  it("isActive가 undefined면 비활성 배지가 없다", () => {
    render(<ResumeStatusBadge status="completed" />);
    expect(screen.queryByText("비활성")).toBeNull();
  });
});
