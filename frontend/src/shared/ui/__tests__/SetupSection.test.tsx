import { render, screen } from "@testing-library/react";
import { SetupSection } from "../SetupSection";

describe("SetupSection", () => {
  it("eyebrow + title + children 렌더", () => {
    render(
      <SetupSection eyebrow="STEP 1" title="기본 정보">
        <div data-testid="form">폼 내용</div>
      </SetupSection>,
    );

    expect(screen.getByText("STEP 1")).toBeInTheDocument();
    expect(screen.getByText("기본 정보")).toBeInTheDocument();
    expect(screen.getByTestId("form")).toBeInTheDocument();
  });

  it("description 제공 → 설명 표시", () => {
    render(
      <SetupSection eyebrow="x" title="x" description="자세한 안내문">
        <span />
      </SetupSection>,
    );
    expect(screen.getByText("자세한 안내문")).toBeInTheDocument();
  });

  it("description 미지정 → 설명 영역 미렌더", () => {
    const { container } = render(
      <SetupSection eyebrow="x" title="x">
        <span />
      </SetupSection>,
    );
    expect(container.querySelectorAll("div.text-sm.text-mefit-gray-500")).toHaveLength(0);
  });

  it("eyebrow 는 uppercase + primary 색상 클래스 적용", () => {
    render(
      <SetupSection eyebrow="단계 1" title="x">
        <span />
      </SetupSection>,
    );
    const eyebrow = screen.getByText("단계 1");
    expect(eyebrow.className).toContain("uppercase");
    expect(eyebrow.className).toContain("text-mefit-primary");
  });

  it("className prop → 외부 컨테이너에 추가 클래스 병합", () => {
    const { container } = render(
      <SetupSection eyebrow="x" title="x" className="my-setup">
        <span />
      </SetupSection>,
    );
    expect((container.firstChild as HTMLElement).className).toContain("my-setup");
  });
});
