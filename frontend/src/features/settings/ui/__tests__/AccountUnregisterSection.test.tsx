import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountUnregisterSection } from "../AccountUnregisterSection";

describe("AccountUnregisterSection", () => {
  it("'회원 탈퇴' 헤더 + 안내 + 탈퇴 버튼 표시", () => {
    render(<AccountUnregisterSection onDeleteAccount={() => {}} />);

    expect(screen.getByText("회원 탈퇴")).toBeInTheDocument();
    expect(screen.getByText(/되돌릴 수 없/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "탈퇴하기" })).toBeInTheDocument();
  });

  it("탈퇴 버튼 클릭 → onDeleteAccount 호출", async () => {
    const onDeleteAccount = jest.fn();
    render(<AccountUnregisterSection onDeleteAccount={onDeleteAccount} />);

    await userEvent.click(screen.getByRole("button", { name: "탈퇴하기" }));
    expect(onDeleteAccount).toHaveBeenCalledTimes(1);
  });

  it("위험 컬러 (DC2626) 클래스 적용", () => {
    render(<AccountUnregisterSection onDeleteAccount={() => {}} />);
    expect(screen.getByRole("button", { name: "탈퇴하기" }).className).toContain("DC2626");
  });
});
