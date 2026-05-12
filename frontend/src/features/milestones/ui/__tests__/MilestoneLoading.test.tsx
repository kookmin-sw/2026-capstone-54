import { render, screen } from "@testing-library/react";
import { MilestoneLoading } from "../MilestoneLoading";

describe("MilestoneLoading", () => {
  it("'마일스톤' 헤더 + skeleton 3 개 표시", () => {
    const { container } = render(<MilestoneLoading />);

    expect(screen.getByText("마일스톤")).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
  });

  it("revealed=true → sk-rv-in 클래스 추가", () => {
    const { container } = render(<MilestoneLoading revealed />);
    expect((container.firstChild as HTMLElement).className).toContain("sk-rv-in");
  });

  it("revealed=false (default) → sk-rv-in 클래스 미적용", () => {
    const { container } = render(<MilestoneLoading />);
    expect((container.firstChild as HTMLElement).className).not.toContain("sk-rv-in");
  });

  it("transitionDelay style=150ms 적용", () => {
    const { container } = render(<MilestoneLoading />);
    expect((container.firstChild as HTMLElement).style.transitionDelay).toBe("150ms");
  });
});
