import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "../Chip";

describe("Chip", () => {
  it("기본 렌더: button 태그 + children + selected 미지정 시 aria-pressed=true 아님", () => {
    render(<Chip>프론트엔드</Chip>);

    const chip = screen.getByRole("button", { name: /프론트엔드/ });
    expect(chip.tagName).toBe("BUTTON");
    expect(chip).not.toHaveAttribute("aria-pressed", "true");
  });

  it("selected=true → aria-pressed=true + primary 색상 클래스", () => {
    render(<Chip selected>선택됨</Chip>);

    const chip = screen.getByRole("button", { name: /선택됨/ });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(chip.className).toContain("bg-mefit-primary-light");
  });

  it("onClick 핸들러 → 클릭 시 호출", async () => {
    const onClick = jest.fn();
    render(<Chip onClick={onClick}>x</Chip>);

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("icon prop → emoji/아이콘 표시", () => {
    render(<Chip icon="🎨">디자인</Chip>);
    expect(screen.getByText("🎨")).toBeInTheDocument();
    expect(screen.getByText("디자인")).toBeInTheDocument();
  });

  it("onRemove → × 제거 버튼 노출 + 클릭 시 stopPropagation (parent onClick 미호출)", async () => {
    const onClick = jest.fn();
    const onRemove = jest.fn();
    render(
      <Chip onClick={onClick} onRemove={onRemove}>
        태그
      </Chip>,
    );

    const removeBtn = screen.getByRole("button", { name: "제거" });
    await userEvent.click(removeBtn);

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("onRemove 미지정 → 제거 버튼 미노출", () => {
    render(<Chip>plain</Chip>);
    expect(screen.queryByRole("button", { name: "제거" })).not.toBeInTheDocument();
  });

  it("className prop → 추가 클래스 병합", () => {
    render(<Chip className="custom-chip">x</Chip>);
    expect(screen.getByRole("button", { name: "x" }).className).toContain("custom-chip");
  });
});
