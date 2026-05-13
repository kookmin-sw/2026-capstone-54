import { render } from "@testing-library/react";
import { CompanyIcon } from "../CompanyIcon";

describe("CompanyIcon", () => {
  it("기본 렌더: Building 아이콘 svg + 둥근 배경 컨테이너", () => {
    const { container } = render(<CompanyIcon seed="acme" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("rounded-lg");
    expect(wrapper.querySelector("svg")).toBeInTheDocument();
  });

  it("같은 seed → 같은 색상 (해시 결정성)", () => {
    const { container: c1, unmount } = render(<CompanyIcon seed="company-1" />);
    const bg1 = (c1.firstChild as HTMLElement).style.background;
    unmount();

    const { container: c2 } = render(<CompanyIcon seed="company-1" />);
    const bg2 = (c2.firstChild as HTMLElement).style.background;

    expect(bg1).toBe(bg2);
  });

  it("다른 seed → 다른 팔레트 가능성 있음 (8 팔레트 중 다른 색)", () => {
    const palettes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const { container, unmount } = render(<CompanyIcon seed={`co-${i}`} />);
      palettes.add((container.firstChild as HTMLElement).style.background);
      unmount();
    }
    expect(palettes.size).toBeGreaterThan(1);
  });

  it("seed 미지정 (default=0) 도 안전하게 렌더", () => {
    const { container } = render(<CompanyIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it("size prop → svg width/height 에 반영", () => {
    const { container } = render(<CompanyIcon seed="x" size={24} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("24");
    expect(svg.getAttribute("height")).toBe("24");
  });

  it("number seed 도 처리 가능", () => {
    const { container } = render(<CompanyIcon seed={42} />);
    expect(container.firstChild).toBeTruthy();
  });
});
