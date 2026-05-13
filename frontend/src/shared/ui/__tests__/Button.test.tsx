import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../Button";

describe("Button", () => {
  it("기본 렌더: button 태그 + children 표시", () => {
    render(<Button>저장</Button>);

    const btn = screen.getByRole("button", { name: "저장" });
    expect(btn.tagName).toBe("BUTTON");
  });

  it("href 제공 시 anchor 태그로 렌더 (button 아닌 a)", () => {
    render(<Button href="/home">홈으로</Button>);

    const link = screen.getByRole("link", { name: "홈으로" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/home");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("onClick 핸들러: 클릭 시 호출", async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>클릭</Button>);

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled=true → 버튼 비활성화 + onClick 미호출", async () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>비활성</Button>);

    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loading=true → 버튼 disabled + 스피너 표시", () => {
    render(<Button loading>처리중</Button>);

    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.querySelector(".animate-spin-slow")).toBeInTheDocument();
  });

  it("variant 별로 다른 클래스 적용 (primary/secondary/outline/ghost/link)", () => {
    const variants = ["primary", "secondary", "outline", "ghost", "link"] as const;
    variants.forEach((v) => {
      const { unmount } = render(<Button variant={v}>{v}</Button>);
      const btn = screen.getByRole("button", { name: v });
      expect(btn.className).toMatch(/(bg-|border|underline|text-)/);
      unmount();
    });
  });

  it("size 별로 다른 padding 클래스 (sm/md/lg)", () => {
    const sizes: Array<{ size: "sm" | "md" | "lg"; padding: string }> = [
      { size: "sm", padding: "px-4" },
      { size: "md", padding: "px-6" },
      { size: "lg", padding: "px-8" },
    ];
    sizes.forEach(({ size, padding }) => {
      const { unmount } = render(<Button size={size}>{size}</Button>);
      expect(screen.getByRole("button").className).toContain(padding);
      unmount();
    });
  });

  it("fullWidth=true → w-full 클래스", () => {
    render(<Button fullWidth>full</Button>);
    expect(screen.getByRole("button").className).toContain("w-full");
  });

  it("className prop 으로 추가 클래스 병합", () => {
    render(<Button className="custom-class">x</Button>);
    expect(screen.getByRole("button").className).toContain("custom-class");
  });

  it("loading 상태에서 onClick 호출 안 됨 (disabled 동작)", async () => {
    const onClick = jest.fn();
    render(<Button loading onClick={onClick}>x</Button>);

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
