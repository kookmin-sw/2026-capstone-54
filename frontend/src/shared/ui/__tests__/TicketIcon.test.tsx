import { render, screen, fireEvent, act } from "@testing-library/react";
import { TicketIcon } from "../TicketIcon";

describe("TicketIcon", () => {
  it("count 숫자 표시", () => {
    render(<TicketIcon count={42} type="daily" />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("type='daily' → green 색상 (#059669 bg #D1FAE5)", () => {
    const { container } = render(<TicketIcon count={1} type="daily" />);
    const iconBox = container.querySelector("[style*='background-color']") as HTMLElement;
    expect(iconBox.style.backgroundColor).toBe("rgb(209, 250, 229)");
  });

  it("type='bonus' → violet 색상 (#7C3AED bg #EDE9FE)", () => {
    const { container } = render(<TicketIcon count={1} type="bonus" />);
    const iconBox = container.querySelector("[style*='background-color']") as HTMLElement;
    expect(iconBox.style.backgroundColor).toBe("rgb(237, 233, 254)");
  });

  it("size prop → svg width/height 반영", () => {
    const { container } = render(<TicketIcon count={1} type="daily" size={24} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("24");
    expect(svg.getAttribute("height")).toBe("24");
  });

  it("초기 → 툴팁 미노출", () => {
    render(<TicketIcon count={1} type="daily" />);
    expect(screen.queryByText(/매일/)).not.toBeInTheDocument();
  });

  it("mouseEnter → daily 툴팁 (dailyAmount 포함)", () => {
    const { container } = render(<TicketIcon count={1} type="daily" dailyAmount={5} />);
    const hover = container.querySelector("[class*='cursor-help']")!.parentElement!;

    act(() => fireEvent.mouseEnter(hover));
    expect(screen.getByText(/매일 5개씩/)).toBeInTheDocument();
  });

  it("mouseEnter type='daily' + dailyAmount 미지정 → 기본 daily 메시지", () => {
    const { container } = render(<TicketIcon count={1} type="daily" />);
    const hover = container.querySelector("[class*='cursor-help']")!.parentElement!;

    act(() => fireEvent.mouseEnter(hover));
    expect(screen.getByText(/매일 충전/)).toBeInTheDocument();
  });

  it("mouseEnter type='bonus' → BONUS_TOOLTIP", () => {
    const { container } = render(<TicketIcon count={1} type="bonus" />);
    const hover = container.querySelector("[class*='cursor-help']")!.parentElement!;

    act(() => fireEvent.mouseEnter(hover));
    expect(screen.getByText(/구입하거나 보상/)).toBeInTheDocument();
  });

  it("mouseLeave → 툴팁 미노출 복귀", () => {
    const { container } = render(<TicketIcon count={1} type="daily" />);
    const hover = container.querySelector("[class*='cursor-help']")!.parentElement!;

    act(() => fireEvent.mouseEnter(hover));
    expect(screen.getByText(/매일/)).toBeInTheDocument();

    act(() => fireEvent.mouseLeave(hover));
    expect(screen.queryByText(/매일/)).not.toBeInTheDocument();
  });
});
