import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "../Input";

describe("Input", () => {
  it("기본 렌더: input 태그 + placeholder/disabled passthrough", () => {
    render(<Input placeholder="이메일" disabled />);

    const input = screen.getByPlaceholderText("이메일");
    expect(input.tagName).toBe("INPUT");
    expect(input).toBeDisabled();
  });

  it("label 표시 + required asterisk", () => {
    render(<Input label="비밀번호" required />);

    expect(screen.getByText("비밀번호")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("label 미지정 → label 영역 미렌더", () => {
    render(<Input placeholder="x" />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("helperText 표시 (label 옆)", () => {
    render(<Input label="이메일" helperText="회사 이메일을 사용하세요" />);

    expect(screen.getByText("회사 이메일을 사용하세요")).toBeInTheDocument();
  });

  it("icon 제공 → 좌측 아이콘 표시 + input 에 pl-11 클래스", () => {
    render(<Input icon={<span data-testid="icon">📧</span>} placeholder="x" />);

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("x").className).toContain("pl-11");
  });

  it("error 메시지 → 빨간 border-mefit-danger + error 텍스트 표시", () => {
    render(<Input error="필수 항목입니다" placeholder="x" />);

    const input = screen.getByPlaceholderText("x");
    expect(input.className).toContain("border-mefit-danger");
    expect(screen.getByText(/필수 항목입니다/)).toBeInTheDocument();
  });

  it("error 없음 → border-mefit-danger 클래스 미적용", () => {
    render(<Input placeholder="x" />);
    expect(screen.getByPlaceholderText("x").className).not.toContain("border-mefit-danger");
  });

  it("fullWidth=true (default) → wrapper 에 w-full 클래스", () => {
    const { container } = render(<Input placeholder="x" />);
    expect((container.firstChild as HTMLElement).className).toContain("w-full");
  });

  it("fullWidth=false → wrapper 빈 클래스", () => {
    const { container } = render(<Input fullWidth={false} placeholder="x" />);
    expect((container.firstChild as HTMLElement).className).toBe("");
  });

  it("value/onChange 동기화 (controlled input)", async () => {
    const onChange = jest.fn();
    render(<Input value="initial" onChange={onChange} placeholder="x" />);

    const input = screen.getByPlaceholderText("x") as HTMLInputElement;
    expect(input.value).toBe("initial");

    await userEvent.type(input, "a");
    expect(onChange).toHaveBeenCalled();
  });
});
