import { render, screen } from "@testing-library/react";
import { Card } from "../Card";

describe("Card", () => {
  it("기본 렌더: children 표시 + bg-mefit-gray-50 + border + rounded-lg", () => {
    const { container } = render(<Card>내용</Card>);

    expect(screen.getByText("내용")).toBeInTheDocument();
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain("bg-mefit-gray-50");
    expect(node.className).toContain("border");
    expect(node.className).toContain("rounded-lg");
  });

  it("padding='md' (default) → p-[28px_24px]", () => {
    const { container } = render(<Card>x</Card>);
    expect((container.firstChild as HTMLElement).className).toContain("p-[28px_24px]");
  });

  it("padding='none' → padding 클래스 미적용", () => {
    const { container } = render(<Card padding="none">x</Card>);
    const cls = (container.firstChild as HTMLElement).className;
    expect(cls).not.toContain("p-[20px_16px]");
    expect(cls).not.toContain("p-[28px_24px]");
    expect(cls).not.toContain("p-[36px_32px]");
  });

  it("padding='sm' / 'lg' → 각각 다른 padding 클래스", () => {
    const { container: c1, unmount } = render(<Card padding="sm">x</Card>);
    expect((c1.firstChild as HTMLElement).className).toContain("p-[20px_16px]");
    unmount();

    const { container: c2 } = render(<Card padding="lg">x</Card>);
    expect((c2.firstChild as HTMLElement).className).toContain("p-[36px_32px]");
  });

  it("className prop → 추가 클래스 병합", () => {
    const { container } = render(<Card className="my-card">x</Card>);
    expect((container.firstChild as HTMLElement).className).toContain("my-card");
  });
});
