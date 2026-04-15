import { render, screen } from "@testing-library/react";
import { ResumeStatsStrip } from "../ResumeStatsStrip";
import type { ResumeCountStats } from "@/features/resume";

describe("ResumeStatsStrip", () => {
  const count: ResumeCountStats = {
    total: 10,
    processing: 2,
    pending: 1,
    completed: 5,
    failed: 2,
  };

  it("전체 이력서 / 분석 완료 / 분석 중 / 분석 실패 항목을 렌더한다", () => {
    render(<ResumeStatsStrip count={count} />);
    expect(screen.getByText("전체 이력서")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("분석 완료")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("분석 중")).toBeInTheDocument();
    expect(screen.getByText("분석 실패")).toBeInTheDocument();
    expect(screen.queryByText("활성 이력서")).not.toBeInTheDocument();
  });

  it("'분석 중' 수치는 processing + pending 합계이다", () => {
    render(<ResumeStatsStrip count={count} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
