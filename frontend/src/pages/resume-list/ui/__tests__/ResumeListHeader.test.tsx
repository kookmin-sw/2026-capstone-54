import { render, screen } from "@testing-library/react";
import { ResumeListHeader } from "../ResumeListHeader";

const defaultProps = {
  totalCount: 7,
  searchQuery: "",
  onSearchChange: () => {},
};

describe("ResumeListHeader", () => {
  it("총 개수를 강조 표시한다", () => {
    render(<ResumeListHeader {...defaultProps} totalCount={7} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/전체 이력서/)).toBeInTheDocument();
    expect(screen.getByText(/개/)).toBeInTheDocument();
  });

  it("totalCount가 0일 때도 렌더링된다", () => {
    render(<ResumeListHeader {...defaultProps} totalCount={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("검색 인풋이 렌더링된다", () => {
    render(<ResumeListHeader {...defaultProps} />);
    expect(screen.getByRole("textbox", { name: "이력서 검색" })).toBeInTheDocument();
  });

  it("searchQuery 값이 인풋에 반영된다", () => {
    render(<ResumeListHeader {...defaultProps} searchQuery="프론트엔드" />);
    expect(screen.getByDisplayValue("프론트엔드")).toBeInTheDocument();
  });
});
