import { render, screen, fireEvent, act } from "@testing-library/react";
import { InfoTooltip } from "../InfoTooltip";

describe("InfoTooltip", () => {
  it("기본 렌더: Info 아이콘 + 툴팁 텍스트 미노출 (초기 hover 없음)", () => {
    render(<InfoTooltip text="자세한 설명입니다" />);

    expect(screen.queryByText("자세한 설명입니다")).not.toBeInTheDocument();
  });

  it("mouseEnter → 툴팁 텍스트 노출", () => {
    const { container } = render(<InfoTooltip text="툴팁 내용" />);

    const wrapper = container.firstChild as HTMLElement;
    act(() => {
      fireEvent.mouseEnter(wrapper);
    });

    expect(screen.getByText(/툴팁 내용/)).toBeInTheDocument();
  });

  it("mouseLeave → 툴팁 미노출 복귀", () => {
    const { container } = render(<InfoTooltip text="hover only" />);
    const wrapper = container.firstChild as HTMLElement;

    act(() => {
      fireEvent.mouseEnter(wrapper);
    });
    expect(screen.getByText(/hover only/)).toBeInTheDocument();

    act(() => {
      fireEvent.mouseLeave(wrapper);
    });
    expect(screen.queryByText(/hover only/)).not.toBeInTheDocument();
  });

  it("className prop → 외부 span 에 클래스 병합", () => {
    const { container } = render(<InfoTooltip text="x" className="my-tip" />);
    expect((container.firstChild as HTMLElement).className).toContain("my-tip");
  });

  it("Info 아이콘 svg 존재 (lucide-react)", () => {
    const { container } = render(<InfoTooltip text="x" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
