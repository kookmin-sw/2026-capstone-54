import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OptionCard } from "../OptionCard";

describe("OptionCard", () => {
  it("기본: title 표시 + selected=false 회색 border", () => {
    const { container } = render(
      <OptionCard selected={false} onClick={() => {}} title="옵션 A" />,
    );

    expect(screen.getByText("옵션 A")).toBeInTheDocument();
    expect((container.firstChild as HTMLElement).className).toContain("border-mefit-gray-200");
  });

  it("selected=true → primary border + primary-light bg", () => {
    const { container } = render(
      <OptionCard selected onClick={() => {}} title="선택됨" />,
    );

    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain("border-mefit-primary");
    expect(node.className).toContain("bg-mefit-primary-light");
  });

  it("클릭 → onClick 호출", async () => {
    const onClick = jest.fn();
    render(<OptionCard selected={false} onClick={onClick} title="x" />);

    await userEvent.click(screen.getByText("x"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled=true → cursor-not-allowed + opacity-45 + onClick 미호출", async () => {
    const onClick = jest.fn();
    const { container } = render(
      <OptionCard selected={false} disabled onClick={onClick} title="x" />,
    );

    const node = container.firstChild as HTMLElement;
    expect(node.className).toContain("cursor-not-allowed");
    expect(node.className).toContain("opacity-45");

    await userEvent.click(node);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("icon + badge → 상단에 둘 다 표시", () => {
    render(
      <OptionCard
        selected={false}
        onClick={() => {}}
        title="x"
        icon={<span data-testid="icon">📌</span>}
        badge={<span data-testid="badge">NEW</span>}
      />,
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByTestId("badge")).toBeInTheDocument();
  });

  it("description 제공 → 설명 표시", () => {
    render(
      <OptionCard
        selected={false}
        onClick={() => {}}
        title="x"
        description="옵션 설명"
      />,
    );
    expect(screen.getByText("옵션 설명")).toBeInTheDocument();
  });

  it("tags 배열 → 칩으로 모두 표시", () => {
    render(
      <OptionCard
        selected={false}
        onClick={() => {}}
        title="x"
        tags={["React", "TS"]}
      />,
    );

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TS")).toBeInTheDocument();
  });

  it("tags 빈 배열 → 칩 영역 미렌더", () => {
    const { container } = render(
      <OptionCard selected={false} onClick={() => {}} title="x" tags={[]} />,
    );
    expect(container.querySelector(".rounded-full")).toBeNull();
  });

  it("children 슬롯 → 카드 하단에 렌더", () => {
    render(
      <OptionCard selected={false} onClick={() => {}} title="x">
        <span data-testid="extra">추가 콘텐츠</span>
      </OptionCard>,
    );
    expect(screen.getByTestId("extra")).toBeInTheDocument();
  });

  it("className prop → 추가 클래스 병합", () => {
    const { container } = render(
      <OptionCard selected={false} onClick={() => {}} title="x" className="my-opt" />,
    );
    expect((container.firstChild as HTMLElement).className).toContain("my-opt");
  });
});
