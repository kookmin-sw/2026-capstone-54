import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toggle } from "../Toggle";

describe("Toggle", () => {
  it("label + description 렌더", () => {
    render(<Toggle checked={false} onChange={() => {}} label="알림 받기" description="이메일로 발송됩니다" />);

    expect(screen.getByText("알림 받기")).toBeInTheDocument();
    expect(screen.getByText("이메일로 발송됩니다")).toBeInTheDocument();
  });

  it("label/description 없음 → 좌측 영역 미렌더 (체크박스만)", () => {
    const { container } = render(<Toggle checked={false} onChange={() => {}} />);
    expect(container.querySelector(".flex-1")).toBeNull();
  });

  it("checked=true → 트랙 색상 primary + 썸 translate-x-5", () => {
    const { container } = render(<Toggle checked onChange={() => {}} label="x" />);

    const checkbox = container.querySelector("input[type='checkbox']") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    const track = container.querySelector(".bg-mefit-primary");
    expect(track).toBeInTheDocument();
    const thumb = container.querySelector(".translate-x-5");
    expect(thumb).toBeInTheDocument();
  });

  it("checked=false → 트랙 gray-200 + 썸 translate-x-0", () => {
    const { container } = render(<Toggle checked={false} onChange={() => {}} label="x" />);
    expect(container.querySelector(".bg-mefit-gray-200")).toBeInTheDocument();
    expect(container.querySelector(".translate-x-0")).toBeInTheDocument();
  });

  it("클릭 → onChange(반대값) 호출", async () => {
    const onChange = jest.fn();
    render(<Toggle checked={false} onChange={onChange} label="x" />);

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    await userEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("disabled=true → checkbox.disabled=true", () => {
    render(<Toggle checked={false} onChange={() => {}} label="x" disabled />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("label aria-label 로 label 전달 (a11y)", () => {
    render(<Toggle checked={false} onChange={() => {}} label="알림" />);
    expect(screen.getByLabelText("알림")).toBeInTheDocument();
  });
});
