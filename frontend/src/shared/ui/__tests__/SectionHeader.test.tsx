import { render, screen } from "@testing-library/react";
import { SectionHeader } from "../SectionHeader";

describe("SectionHeader", () => {
  it("title 만 → 헤더 텍스트 표시", () => {
    render(<SectionHeader title="기본 정보" />);

    expect(screen.getByText("기본 정보")).toBeInTheDocument();
  });

  it("icon 제공 → 아이콘 span 표시", () => {
    render(<SectionHeader icon={<span data-testid="icon">🎨</span>} title="제목" />);

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("제목")).toBeInTheDocument();
  });

  it("description 제공 → 설명 텍스트 표시 (ml-9 들여쓰기)", () => {
    render(<SectionHeader title="x" description="자세한 설명입니다" />);

    const desc = screen.getByText("자세한 설명입니다");
    expect(desc).toBeInTheDocument();
    expect(desc.className).toContain("ml-9");
  });

  it("description 미지정 → 설명 영역 미렌더", () => {
    const { container } = render(<SectionHeader title="x" />);
    expect(container.querySelector("p")).toBeNull();
  });

  it("children 슬롯 렌더 (액션 영역)", () => {
    render(
      <SectionHeader title="x">
        <button data-testid="action">버튼</button>
      </SectionHeader>,
    );
    expect(screen.getByTestId("action")).toBeInTheDocument();
  });

  it("icon 미지정 → 아이콘 span 미노출 (icon shrink-0 span 없음)", () => {
    const { container } = render(<SectionHeader title="x" />);
    const spans = container.querySelectorAll(".shrink-0");
    expect(spans.length).toBe(0);
  });
});
