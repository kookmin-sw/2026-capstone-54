import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("기본 렌더: children 표시 + inline-flex 컨테이너", () => {
    render(<Badge>완료</Badge>);

    const badge = screen.getByText("완료");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.className).toContain("inline-flex");
  });

  it("variant 6종 모두 클래스 적용 (default/success/warning/error/info/primary)", () => {
    const variants: Array<"default" | "success" | "warning" | "error" | "info" | "primary"> = [
      "default", "success", "warning", "error", "info", "primary",
    ];
    variants.forEach((v) => {
      const { unmount } = render(<Badge variant={v}>{v}</Badge>);
      const node = screen.getByText(v);
      expect(node.className.length).toBeGreaterThan(0);
      unmount();
    });
  });

  it("size sm vs md → 다른 padding 클래스", () => {
    const { unmount: u1 } = render(<Badge size="sm">sm</Badge>);
    expect(screen.getByText("sm").className).toContain("px-2.5");
    u1();

    render(<Badge size="md">md</Badge>);
    expect(screen.getByText("md").className).toContain("px-3");
  });

  it("style prop → 인라인 스타일로 전달", () => {
    render(<Badge style={{ marginLeft: "8px" }}>x</Badge>);

    expect(screen.getByText("x")).toHaveStyle({ marginLeft: "8px" });
  });

  it("className prop → 추가 클래스 병합", () => {
    render(<Badge className="custom-badge">x</Badge>);
    expect(screen.getByText("x").className).toContain("custom-badge");
  });
});
