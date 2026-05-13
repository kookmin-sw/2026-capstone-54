import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  it("totalPages <= 1 → null 반환 (렌더 안 됨)", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();

    const { container: c2 } = render(
      <Pagination currentPage={1} totalPages={0} onPageChange={() => {}} />,
    );
    expect(c2.firstChild).toBeNull();
  });

  it("페이지 번호 1..totalPages 만큼 버튼 렌더 + 이전/다음 버튼", () => {
    render(<Pagination currentPage={2} totalPages={3} onPageChange={() => {}} />);

    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /이전/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /다음/ })).toBeInTheDocument();
  });

  it("currentPage=1 → 이전 버튼 disabled", () => {
    render(<Pagination currentPage={1} totalPages={3} onPageChange={() => {}} />);

    expect(screen.getByRole("button", { name: /이전/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /다음/ })).not.toBeDisabled();
  });

  it("currentPage=totalPages → 다음 버튼 disabled", () => {
    render(<Pagination currentPage={3} totalPages={3} onPageChange={() => {}} />);

    expect(screen.getByRole("button", { name: /이전/ })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /다음/ })).toBeDisabled();
  });

  it("페이지 번호 버튼 클릭 → onPageChange(p) 호출", async () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("이전 버튼 클릭 → onPageChange(currentPage - 1)", async () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole("button", { name: /이전/ }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("다음 버튼 클릭 → onPageChange(currentPage + 1)", async () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole("button", { name: /다음/ }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("currentPage 버튼은 강조 스타일 (다른 색 클래스)", () => {
    render(<Pagination currentPage={2} totalPages={3} onPageChange={() => {}} />);

    const current = screen.getByRole("button", { name: "2" });
    const other = screen.getByRole("button", { name: "1" });

    expect(current.className).toContain("bg-mefit-black");
    expect(other.className).not.toContain("bg-mefit-black");
  });

  it("className prop → 컨테이너에 클래스 병합", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={3} onPageChange={() => {}} className="my-custom" />,
    );
    expect((container.firstChild as HTMLElement).className).toContain("my-custom");
  });
});
