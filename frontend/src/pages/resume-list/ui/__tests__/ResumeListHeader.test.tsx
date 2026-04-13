import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResumeListHeader } from "../ResumeListHeader";

describe("ResumeListHeader", () => {
  it("총 개수를 강조 표시한다", () => {
    render(<ResumeListHeader totalCount={7} onAdd={() => {}} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/전체 이력서/)).toBeInTheDocument();
    expect(screen.getByText(/개/)).toBeInTheDocument();
  });

  it("추가 버튼 클릭 시 onAdd 콜백이 호출된다", async () => {
    const onAdd = jest.fn();
    render(<ResumeListHeader totalCount={0} onAdd={onAdd} />);

    const btn = screen.getByRole("button", { name: /이력서 추가하기/ });
    await userEvent.click(btn);

    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
