import { render, screen } from "@testing-library/react";
import { StepLayout } from "../StepLayout";

describe("StepLayout", () => {
  it("title + description + left/right slots 렌더", () => {
    render(
      <StepLayout
        title="제목"
        description="설명"
        left={<div data-testid="left">좌측</div>}
        right={<div data-testid="right">우측</div>}
      />,
    );

    expect(screen.getByText("제목")).toBeInTheDocument();
    expect(screen.getByText("설명")).toBeInTheDocument();
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });

  it("stepLabel 제공 → 상단 라벨 표시", () => {
    render(
      <StepLayout
        stepLabel="STEP 1"
        title="x"
        description="x"
        left={<span />}
        right={<span />}
      />,
    );
    expect(screen.getByText("STEP 1")).toBeInTheDocument();
  });

  it("stepLabel 미지정 → 라벨 미렌더 (uppercase tracking 라벨 없음)", () => {
    const { container } = render(
      <StepLayout title="x" description="x" left={<span />} right={<span />} />,
    );
    expect(container.querySelectorAll(".uppercase")).toHaveLength(0);
  });

  it("두 컬럼 grid 컨테이너 (grid-cols-2)", () => {
    const { container } = render(
      <StepLayout title="x" description="x" left={<span />} right={<span />} />,
    );
    expect(container.querySelector(".grid-cols-2")).toBeInTheDocument();
  });

  it("커스텀 columnClassName 적용", () => {
    const { container } = render(
      <StepLayout
        title="x"
        description="x"
        left={<span />}
        right={<span />}
        columnClassName="custom-col"
      />,
    );
    const cols = container.querySelectorAll(".custom-col");
    expect(cols).toHaveLength(2);
  });
});
