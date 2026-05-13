import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResumeListHeader } from "../ResumeListHeader";

describe("ResumeListHeader", () => {
  it("totalCount 숫자를 헤더에 표시", () => {
    render(<ResumeListHeader totalCount={12} searchQuery="" onSearchChange={() => {}} />);

    expect(screen.getByText(/전체 이력서/)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("검색 input + placeholder + aria-label", () => {
    render(<ResumeListHeader totalCount={0} searchQuery="" onSearchChange={() => {}} />);

    const input = screen.getByRole("textbox", { name: "이력서 검색" });
    expect(input).toHaveAttribute("placeholder", "이력서 제목 검색...");
  });

  it("searchQuery prop → input value 동기화", () => {
    render(<ResumeListHeader totalCount={5} searchQuery="신입" onSearchChange={() => {}} />);

    const input = screen.getByRole("textbox", { name: "이력서 검색" }) as HTMLInputElement;
    expect(input.value).toBe("신입");
  });

  it("타이핑 → onSearchChange(value) 호출", async () => {
    const onSearchChange = jest.fn();
    render(<ResumeListHeader totalCount={0} searchQuery="" onSearchChange={onSearchChange} />);

    await userEvent.type(screen.getByRole("textbox", { name: "이력서 검색" }), "a");
    expect(onSearchChange).toHaveBeenCalledWith("a");
  });

  it("totalCount=0 → '0' 표시", () => {
    render(<ResumeListHeader totalCount={0} searchQuery="" onSearchChange={() => {}} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
