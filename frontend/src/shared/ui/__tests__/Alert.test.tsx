import { render, screen } from "@testing-library/react";
import { Alert } from "../Alert";

describe("Alert", () => {
  it("기본 렌더: role='alert' + children 표시", () => {
    render(<Alert>저장되었습니다</Alert>);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("저장되었습니다");
  });

  it("variant 별로 다른 색상 클래스 적용 (info/success/warning/error)", () => {
    const variants: Array<{ v: "info" | "success" | "warning" | "error"; bg: string }> = [
      { v: "info", bg: "bg-mefit-success-light" },
      { v: "success", bg: "bg-mefit-success-light" },
      { v: "warning", bg: "bg-mefit-warning-light" },
      { v: "error", bg: "bg-mefit-danger-light" },
    ];
    variants.forEach(({ v, bg }) => {
      const { unmount } = render(<Alert variant={v}>{v}</Alert>);
      expect(screen.getByRole("alert").className).toContain(bg);
      unmount();
    });
  });

  it("className prop → 추가 클래스 병합", () => {
    render(<Alert className="custom-cls">x</Alert>);
    expect(screen.getByRole("alert").className).toContain("custom-cls");
  });

  it("variant 미지정 시 default=info", () => {
    render(<Alert>default</Alert>);
    expect(screen.getByRole("alert").className).toContain("bg-mefit-success-light");
  });
});
