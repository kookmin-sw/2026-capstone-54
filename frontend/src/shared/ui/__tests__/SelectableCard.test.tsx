import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectableCard } from "../SelectableCard";

describe("SelectableCard", () => {
  it("기본: 미선택 상태 → 체크 표시 없음 + 회색 border", () => {
    const { container } = render(
      <SelectableCard selected={false} onClick={() => {}}>
        옵션 A
      </SelectableCard>,
    );

    expect(screen.getByText("옵션 A")).toBeInTheDocument();
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain("border-mefit-gray-200");
  });

  it("selected=true → 체크 아이콘 ✓ 표시 + primary border 색상", () => {
    const { container } = render(
      <SelectableCard selected onClick={() => {}}>
        옵션
      </SelectableCard>,
    );

    expect(screen.getByText("✓")).toBeInTheDocument();
    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain("border-mefit-primary");
    expect(node.className).toContain("bg-mefit-primary-light");
  });

  it("클릭 → onClick 호출", async () => {
    const onClick = jest.fn();
    render(
      <SelectableCard selected={false} onClick={onClick}>
        옵션
      </SelectableCard>,
    );

    await userEvent.click(screen.getByText("옵션"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled=true → cursor-not-allowed + onClick 미호출", async () => {
    const onClick = jest.fn();
    const { container } = render(
      <SelectableCard selected={false} disabled onClick={onClick}>
        옵션
      </SelectableCard>,
    );

    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain("cursor-not-allowed");
    expect(node.className).toContain("opacity-60");

    await userEvent.click(node);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("disabled + selected → 체크 아이콘 미표시 (disabled 우선)", () => {
    render(
      <SelectableCard selected disabled onClick={() => {}}>
        옵션
      </SelectableCard>,
    );

    expect(screen.queryByText("✓")).not.toBeInTheDocument();
  });

  it("className prop → 추가 클래스 병합", () => {
    const { container } = render(
      <SelectableCard selected={false} onClick={() => {}} className="my-card">
        x
      </SelectableCard>,
    );
    expect((container.firstChild as HTMLElement).className).toContain("my-card");
  });
});
