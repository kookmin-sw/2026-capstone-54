import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "../Textarea";

describe("Textarea", () => {
  it("기본 렌더 + placeholder", () => {
    render(<Textarea placeholder="입력하세요" />);
    expect(screen.getByPlaceholderText("입력하세요")).toBeInTheDocument();
  });

  it("label + helperText 표시", () => {
    render(<Textarea label="자기소개" helperText="500자까지" />);
    expect(screen.getByText("자기소개")).toBeInTheDocument();
    expect(screen.getByText("500자까지")).toBeInTheDocument();
  });

  it("error → border-mefit-danger + 메시지 표시", () => {
    render(<Textarea error="필수 입력" placeholder="x" />);
    expect(screen.getByPlaceholderText("x").className).toContain("border-mefit-danger");
    expect(screen.getByText(/필수 입력/)).toBeInTheDocument();
  });

  it("showCharCount + maxLength → '<n> / <max>' 표시", () => {
    render(<Textarea showCharCount maxLength={100} value="안녕하세요" onChange={() => {}} />);
    expect(screen.getByText("5 / 100")).toBeInTheDocument();
  });

  it("showCharCount=true 지만 maxLength 없음 → 카운트 미표시", () => {
    render(<Textarea showCharCount value="x" onChange={() => {}} />);
    expect(screen.queryByText(/\//)).not.toBeInTheDocument();
  });

  it("fullWidth=false → wrapper 빈 클래스", () => {
    const { container } = render(<Textarea fullWidth={false} placeholder="x" />);
    expect((container.firstChild as HTMLElement).className).toBe("");
  });

  it("controlled value/onChange 동작", async () => {
    const onChange = jest.fn();
    render(<Textarea value="초기" onChange={onChange} placeholder="x" />);

    const ta = screen.getByPlaceholderText("x") as HTMLTextAreaElement;
    expect(ta.value).toBe("초기");
    await userEvent.type(ta, "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("value 비-string (controlled) → charCount=0", () => {
    render(<Textarea showCharCount maxLength={100} value={undefined} onChange={() => {}} />);
    expect(screen.getByText("0 / 100")).toBeInTheDocument();
  });
});
