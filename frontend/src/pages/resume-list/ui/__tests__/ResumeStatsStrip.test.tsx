import { render, screen } from "@testing-library/react";
import { ResumeStatsStrip } from "../ResumeStatsStrip";
import type { ResumeCountStats } from "@/features/resume";

describe("ResumeStatsStrip", () => {
  // 각 카운트가 화면에서 unique 한 숫자로 매칭되도록 의도적으로 서로 다른 값을 사용한다.
  const count: ResumeCountStats = {
    total: 10,
    processing: 2,
    pending: 1,
    completed: 5,
    failed: 4,
  };

  it("전체 이력서 / 분석 완료 / 분석 중 / 분석 실패 항목과 값을 렌더한다", () => {
    render(<ResumeStatsStrip count={count} />);

    expect(screen.getByText("전체 이력서")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();

    expect(screen.getByText("분석 완료")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    expect(screen.getByText("분석 중")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // processing + pending

    expect(screen.getByText("분석 실패")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    expect(screen.queryByText("활성 이력서")).not.toBeInTheDocument();
  });

  it("'분석 중' 수치는 processing + pending 합계이다", () => {
    render(<ResumeStatsStrip count={count} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
