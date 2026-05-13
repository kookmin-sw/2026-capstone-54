import { render } from "@testing-library/react";
import { ResumeTypeIcon } from "../ResumeTypeIcon";

describe("ResumeTypeIcon", () => {
  it("type='file' 이면 FileText 아이콘 (lucide) 렌더", () => {
    const { container } = render(<ResumeTypeIcon type="file" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.classList.toString()).toMatch(/lucide-file-text/i);
  });

  it("type='text' 이면 PencilLine 아이콘 렌더", () => {
    const { container } = render(<ResumeTypeIcon type="text" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.classList.toString()).toMatch(/lucide-pencil-line/i);
  });

  it("size prop 이 width/height 속성으로 전달됨", () => {
    const { container } = render(<ResumeTypeIcon type="file" size={32} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("32");
    expect(svg?.getAttribute("height")).toBe("32");
  });

  it("size 기본값은 16", () => {
    const { container } = render(<ResumeTypeIcon type="file" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("16");
  });

  it("className prop 이 SVG 에 적용됨", () => {
    const { container } = render(<ResumeTypeIcon type="text" className="custom-class" />);
    const svg = container.querySelector("svg");
    expect(svg?.classList.contains("custom-class")).toBe(true);
  });
});
