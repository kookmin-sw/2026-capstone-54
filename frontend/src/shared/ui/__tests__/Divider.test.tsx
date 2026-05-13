import { render } from "@testing-library/react";
import { Divider } from "../Divider";

describe("Divider", () => {
  it("기본 spacing='md' → my-7 + h-px + bg-mefit-gray-200", () => {
    const { container } = render(<Divider />);
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain("h-px");
    expect(node.className).toContain("bg-mefit-gray-200");
    expect(node.className).toContain("my-7");
  });

  it("spacing='sm' → my-4", () => {
    const { container } = render(<Divider spacing="sm" />);
    expect((container.firstChild as HTMLElement).className).toContain("my-4");
  });

  it("spacing='lg' → my-10", () => {
    const { container } = render(<Divider spacing="lg" />);
    expect((container.firstChild as HTMLElement).className).toContain("my-10");
  });

  it("className prop → 추가 클래스 병합", () => {
    const { container } = render(<Divider className="custom-divider" />);
    expect((container.firstChild as HTMLElement).className).toContain("custom-divider");
  });
});
