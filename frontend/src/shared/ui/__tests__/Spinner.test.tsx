import { render } from "@testing-library/react";
import { Spinner } from "../Spinner";

describe("Spinner", () => {
  it("기본 크기 md 클래스 (w-[18px] h-[18px] border-2)", () => {
    const { container } = render(<Spinner />);
    const node = container.firstChild as HTMLElement;

    expect(node.className).toContain("w-[18px]");
    expect(node.className).toContain("h-[18px]");
    expect(node.className).toContain("border-2");
  });

  it("size='sm' → w-4 h-4 border-2", () => {
    const { container } = render(<Spinner size="sm" />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain("w-4");
    expect(node.className).toContain("h-4");
  });

  it("size='lg' → w-11 h-11 border-4", () => {
    const { container } = render(<Spinner size="lg" />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain("w-11");
    expect(node.className).toContain("h-11");
    expect(node.className).toContain("border-4");
  });

  it("animate-spin-slow 클래스 + rounded-full 항상 적용", () => {
    const { container } = render(<Spinner />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain("animate-spin-slow");
    expect(node.className).toContain("rounded-full");
  });

  it("className prop → 추가 클래스 병합", () => {
    const { container } = render(<Spinner className="ml-2" />);
    expect((container.firstChild as HTMLElement).className).toContain("ml-2");
  });
});
