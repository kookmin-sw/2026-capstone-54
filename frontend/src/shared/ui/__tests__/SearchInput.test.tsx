import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "../SearchInput";

describe("SearchInput", () => {
  it("기본 렌더: input 태그 + 좌측 검색 아이콘 + default placeholder", () => {
    render(<SearchInput value="" onChange={() => {}} />);

    const input = screen.getByRole("textbox", { name: "검색" });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "검색...");
  });

  it("custom placeholder + ariaLabel 적용", () => {
    render(
      <SearchInput
        value=""
        onChange={() => {}}
        placeholder="키워드 입력"
        ariaLabel="키워드 검색"
      />,
    );

    expect(screen.getByPlaceholderText("키워드 입력")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "키워드 검색" })).toBeInTheDocument();
  });

  it("입력 → onChange(value) 호출", async () => {
    const onChange = jest.fn();
    render(<SearchInput value="" onChange={onChange} />);

    await userEvent.type(screen.getByRole("textbox"), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("value 가 비어있으면 지우기 버튼 미노출", () => {
    render(<SearchInput value="" onChange={() => {}} />);
    expect(screen.queryByRole("button", { name: "검색어 지우기" })).not.toBeInTheDocument();
  });

  it("value 가 있으면 지우기 X 버튼 노출", () => {
    render(<SearchInput value="React" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "검색어 지우기" })).toBeInTheDocument();
  });

  it("지우기 버튼 클릭 → onChange('') 호출", async () => {
    const onChange = jest.fn();
    render(<SearchInput value="abc" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "검색어 지우기" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("className → 외부 컨테이너에 클래스 병합", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} className="my-search" />,
    );
    expect((container.firstChild as HTMLElement).className).toContain("my-search");
  });

  it("autoFocus prop 전달 (input.autofocus 속성)", () => {
    render(<SearchInput value="" onChange={() => {}} autoFocus />);
    expect(screen.getByRole("textbox")).toHaveFocus();
  });
});
