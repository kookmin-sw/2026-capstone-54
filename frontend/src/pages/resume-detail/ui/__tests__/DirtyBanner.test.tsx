import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DirtyBanner } from "../DirtyBanner";

describe("DirtyBanner", () => {
  it("기본 렌더: 경고 메시지 + 최종 저장 버튼 표시", () => {
    render(<DirtyBanner isFinalizing={false} onFinalize={() => {}} />);

    expect(screen.getByText(/최신이 아닐 수 있/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /최종 저장/ })).toBeInTheDocument();
  });

  it("isFinalizing=false → 버튼 활성화 + 로더 미표시", () => {
    const { container } = render(<DirtyBanner isFinalizing={false} onFinalize={() => {}} />);

    const btn = screen.getByRole("button", { name: /최종 저장/ });
    expect(btn).not.toBeDisabled();
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("isFinalizing=true → 버튼 disabled + 로더 표시", () => {
    const { container } = render(<DirtyBanner isFinalizing={true} onFinalize={() => {}} />);

    expect(screen.getByRole("button", { name: /최종 저장/ })).toBeDisabled();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("버튼 클릭 → onFinalize 호출", async () => {
    const onFinalize = jest.fn();
    render(<DirtyBanner isFinalizing={false} onFinalize={onFinalize} />);

    await userEvent.click(screen.getByRole("button", { name: /최종 저장/ }));
    expect(onFinalize).toHaveBeenCalledTimes(1);
  });

  it("isFinalizing=true 일 때 클릭 → onFinalize 미호출 (disabled 가드)", async () => {
    const onFinalize = jest.fn();
    render(<DirtyBanner isFinalizing={true} onFinalize={onFinalize} />);

    await userEvent.click(screen.getByRole("button", { name: /최종 저장/ }));
    expect(onFinalize).not.toHaveBeenCalled();
  });
});
