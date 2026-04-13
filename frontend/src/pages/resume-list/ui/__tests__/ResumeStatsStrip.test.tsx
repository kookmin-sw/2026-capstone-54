import { render, screen } from "@testing-library/react";
import { ResumeStatsStrip } from "../ResumeStatsStrip";
import type { ResumeCountStats, ResumeTypeStats } from "@/features/resume";

describe("ResumeStatsStrip", () => {
  const count: ResumeCountStats = {
    total: 10,
    processing: 2,
    pending: 1,
    completed: 5,
    failed: 2,
    active: 7,
    inactive: 3,
  };
  const type: ResumeTypeStats = { fileCount: 4, textCount: 6 };

  it("모든 통계 카드를 렌더한다", () => {
    render(<ResumeStatsStrip count={count} type={type} />);
    expect(screen.getByText("전체")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("분석 중")).toBeInTheDocument();
    expect(screen.getByText("분석 완료")).toBeInTheDocument();
    expect(screen.getByText("파일")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("텍스트")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("'분석 중' 수치는 processing + pending 합계이다", () => {
    render(<ResumeStatsStrip count={count} type={type} />);
    // 2 + 1 = 3
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
