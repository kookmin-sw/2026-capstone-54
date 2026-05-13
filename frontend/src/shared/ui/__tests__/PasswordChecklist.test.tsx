import { render, screen } from "@testing-library/react";
import { PasswordChecklist } from "../PasswordChecklist";

describe("PasswordChecklist", () => {
  it("5 개의 체크 항목 모두 렌더 (8자 이상/대문자/소문자/숫자/특수문자)", () => {
    render(<PasswordChecklist password="" />);

    expect(screen.getByText("8자 이상")).toBeInTheDocument();
    expect(screen.getByText("대문자")).toBeInTheDocument();
    expect(screen.getByText("소문자")).toBeInTheDocument();
    expect(screen.getByText("숫자")).toBeInTheDocument();
    expect(screen.getByText("특수문자")).toBeInTheDocument();
  });

  it("빈 password → 모든 항목 미충족 (회색 dot 아이콘)", () => {
    const { container } = render(<PasswordChecklist password="" />);

    const checkPaths = container.querySelectorAll('path[stroke="#059669"]');
    expect(checkPaths.length).toBe(0);

    const dots = container.querySelectorAll('circle[fill="#D1D5DB"]');
    expect(dots.length).toBe(5);
  });

  it("부분 충족 password ('abcd1234') → 길이/소문자/숫자만 met (3 개 체크, 2 개 미충족)", () => {
    const { container } = render(<PasswordChecklist password="abcd1234" />);

    const checkPaths = container.querySelectorAll('path[stroke="#059669"]');
    expect(checkPaths.length).toBe(3);

    const dots = container.querySelectorAll('circle[fill="#D1D5DB"]');
    expect(dots.length).toBe(2);
  });

  it("모든 조건 만족 password ('Abcd1234!') → 5 개 체크 아이콘", () => {
    const { container } = render(<PasswordChecklist password="Abcd1234!" />);

    const checkPaths = container.querySelectorAll('path[stroke="#059669"]');
    expect(checkPaths.length).toBe(5);

    const dots = container.querySelectorAll('circle[fill="#D1D5DB"]');
    expect(dots.length).toBe(0);
  });

  it("password=null/undefined 안전성 (?? '' fallback) → 모두 미충족", () => {
    const { container } = render(
      <PasswordChecklist password={null as unknown as string} />,
    );
    const dots = container.querySelectorAll('circle[fill="#D1D5DB"]');
    expect(dots.length).toBe(5);
  });
});
