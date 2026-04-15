import { render, screen } from "@testing-library/react";
import { ResumeListHeader } from "../ResumeListHeader";

describe("ResumeListHeader", () => {
  it("총 개수를 강조 표시한다", () => {
    render(<ResumeListHeader totalCount={7} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/전체 이력서/)).toBeInTheDocument();
    expect(screen.getByText(/개/)).toBeInTheDocument();
  });

  it("totalCount가 0일 때도 렌더링된다", () => {
    render(<ResumeListHeader totalCount={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
