import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationToggle } from "../NotificationToggle";

describe("NotificationToggle", () => {
  it("title + desc 렌더", () => {
    render(<NotificationToggle title="이메일" desc="마케팅 안내" checked={false} onClick={() => {}} />);
    expect(screen.getByText("이메일")).toBeInTheDocument();
    expect(screen.getByText("마케팅 안내")).toBeInTheDocument();
  });

  it("checked=true → 파란 배경 + 우측 슬라이드", () => {
    render(<NotificationToggle title="x" desc="y" checked onClick={() => {}} />);
    const btn = screen.getByRole("button", { name: "x" });
    expect(btn.className).toContain("bg-[#0991B2]");
    expect(btn.className).toContain("after:translate-x-[18px]");
  });

  it("checked=false → 회색 배경", () => {
    render(<NotificationToggle title="x" desc="y" checked={false} onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "x" }).className).toContain("bg-[#E5E7EB]");
  });

  it("버튼 클릭 → onClick 호출", async () => {
    const onClick = jest.fn();
    render(<NotificationToggle title="x" desc="y" checked={false} onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "x" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("aria-label=title 로 a11y 노출", () => {
    render(<NotificationToggle title="알림" desc="d" checked={false} onClick={() => {}} />);
    expect(screen.getByLabelText("알림")).toBeInTheDocument();
  });
});
