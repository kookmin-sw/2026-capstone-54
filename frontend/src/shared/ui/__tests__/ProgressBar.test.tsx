import { render, screen } from "@testing-library/react";
import { ProgressBar } from "../ProgressBar";

function getBarFill(container: HTMLElement): HTMLElement {
  const fill = container.querySelector('[style*="width"]') as HTMLElement;
  if (!fill) throw new Error("ProgressBar fill 요소를 찾을 수 없습니다");
  return fill;
}

describe("ProgressBar", () => {
  it("value/max 비율로 width 계산 (50/100 → 50%)", () => {
    const { container } = render(<ProgressBar value={50} />);
    expect(getBarFill(container).style.width).toBe("50%");
  });

  it("max 지정 → value/max 로 비율 계산 (25/200 → 12.5%)", () => {
    const { container } = render(<ProgressBar value={25} max={200} />);
    expect(getBarFill(container).style.width).toBe("12.5%");
  });

  it("value > max → 100% 로 cap", () => {
    const { container } = render(<ProgressBar value={150} max={100} />);
    expect(getBarFill(container).style.width).toBe("100%");
  });

  it("value=0 → width=0%", () => {
    const { container } = render(<ProgressBar value={0} />);
    expect(getBarFill(container).style.width).toBe("0%");
  });

  it("showLabel=true + label 지정 → 라벨 + 퍼센트 표시", () => {
    render(<ProgressBar value={75} showLabel label="작성 완성도" />);

    expect(screen.getByText("작성 완성도")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("showLabel=true + label 미지정 → '진행률' default 라벨", () => {
    render(<ProgressBar value={30} showLabel />);

    expect(screen.getByText("진행률")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });

  it("showLabel=false (default) → 라벨 영역 미렌더", () => {
    render(<ProgressBar value={50} label="x" />);
    expect(screen.queryByText("x")).not.toBeInTheDocument();
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
  });

  it("height prop: sm vs md → 다른 높이 클래스", () => {
    const { container: c1, unmount } = render(<ProgressBar value={10} height="sm" />);
    expect(c1.querySelector(".h-\\[5px\\]")).toBeInTheDocument();
    unmount();

    const { container: c2 } = render(<ProgressBar value={10} height="md" />);
    expect(c2.querySelector(".h-\\[6px\\]")).toBeInTheDocument();
  });

  it("className → 외부 컨테이너에 클래스 병합", () => {
    const { container } = render(<ProgressBar value={50} className="my-bar" />);
    expect((container.firstChild as HTMLElement).className).toContain("my-bar");
  });

  it("퍼센트 표시는 반올림 (Math.round)", () => {
    render(<ProgressBar value={33} max={100} showLabel />);

    expect(screen.getByText("33%")).toBeInTheDocument();
  });
});
