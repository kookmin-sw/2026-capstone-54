import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusCard } from "../StatusCard";

const OPTIONS = [
  { value: "planned", icon: <span data-testid="icon-planned">📅</span>, label: "지원 예정", desc: "곧 지원할 예정" },
  { value: "applied", icon: <span data-testid="icon-applied">✅</span>, label: "지원 완료", desc: "이미 지원함" },
  { value: "rejected", icon: <span data-testid="icon-rejected">❌</span>, label: "탈락", desc: "결과가 좋지 않음" },
];

describe("StatusCard", () => {
  it("모든 option label / desc / icon 렌더 + button 역할", () => {
    render(<StatusCard options={OPTIONS} selected="planned" onSelect={() => {}} />);

    OPTIONS.forEach((opt) => {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
      expect(screen.getByText(opt.desc)).toBeInTheDocument();
    });
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("selected option → aria-pressed=true + primary border", () => {
    render(<StatusCard options={OPTIONS} selected="applied" onSelect={() => {}} />);

    const applied = screen.getByRole("button", { name: /지원 완료/ });
    expect(applied).toHaveAttribute("aria-pressed", "true");
    expect(applied.className).toContain("border-mefit-primary");

    const planned = screen.getByRole("button", { name: /지원 예정/ });
    expect(planned).toHaveAttribute("aria-pressed", "false");
    expect(planned.className).not.toContain("border-mefit-primary bg-mefit-primary-light");
  });

  it("버튼 클릭 → onSelect(value) 호출", async () => {
    const onSelect = jest.fn();
    render(<StatusCard options={OPTIONS} selected="planned" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: /탈락/ }));
    expect(onSelect).toHaveBeenCalledWith("rejected");
  });

  it("columns prop → 그리드 클래스 결정 (default=3 → grid-cols-3)", () => {
    const { container } = render(
      <StatusCard options={OPTIONS} selected="planned" onSelect={() => {}} />,
    );
    expect((container.firstChild as HTMLElement).className).toContain("grid-cols-3");
  });

  it("columns=2 → grid-cols-2", () => {
    const { container } = render(
      <StatusCard options={OPTIONS} selected="planned" onSelect={() => {}} columns={2} />,
    );
    expect((container.firstChild as HTMLElement).className).toContain("grid-cols-2");
  });

  it("columns=1 → grid-cols-1", () => {
    const { container } = render(
      <StatusCard options={OPTIONS} selected="planned" onSelect={() => {}} columns={1} />,
    );
    expect((container.firstChild as HTMLElement).className).toContain("grid-cols-1");
  });

  it("number value 도 지원 (제너릭 타입)", async () => {
    const numOptions = [
      { value: 1, icon: <span>a</span>, label: "L1", desc: "d1" },
      { value: 2, icon: <span>b</span>, label: "L2", desc: "d2" },
    ];
    const onSelect = jest.fn();
    render(<StatusCard options={numOptions} selected={1} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: /L2/ }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
