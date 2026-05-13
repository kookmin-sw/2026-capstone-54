import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectFilter } from "../SelectFilter";

const OPTIONS = [
  { value: "all", label: "전체" },
  { value: "active", label: "진행 중" },
  { value: "done", label: "완료" },
];

describe("SelectFilter", () => {
  it("options 길이만큼 버튼 + label 표시", () => {
    render(<SelectFilter value="all" options={OPTIONS} onChange={() => {}} />);

    OPTIONS.forEach((o) => {
      expect(screen.getByRole("button", { name: o.label })).toBeInTheDocument();
    });
  });

  it("선택된 옵션 → 흰색 배경 + primary 텍스트 색상", () => {
    render(<SelectFilter value="active" options={OPTIONS} onChange={() => {}} />);

    const active = screen.getByRole("button", { name: "진행 중" });
    expect(active.className).toContain("bg-white");
    expect(active.className).toContain("text-[#0991B2]");

    const other = screen.getByRole("button", { name: "전체" });
    expect(other.className).toContain("bg-transparent");
  });

  it("버튼 클릭 → onChange(value) 호출", async () => {
    const onChange = jest.fn();
    render(<SelectFilter value="all" options={OPTIONS} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "완료" }));
    expect(onChange).toHaveBeenCalledWith("done");
  });

  it("이미 선택된 버튼 클릭 → onChange 호출 (별도 가드 없음)", async () => {
    const onChange = jest.fn();
    render(<SelectFilter value="all" options={OPTIONS} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "전체" }));
    expect(onChange).toHaveBeenCalledWith("all");
  });

  it("options 빈 배열 → 버튼 미렌더 (컨테이너만)", () => {
    const { container } = render(
      <SelectFilter value="" options={[]} onChange={() => {}} />,
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(container.firstChild).toBeTruthy();
  });
});
