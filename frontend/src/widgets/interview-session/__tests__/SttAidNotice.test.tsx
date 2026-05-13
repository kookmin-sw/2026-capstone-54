import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SttAidNotice } from "../SttAidNotice";

beforeEach(() => {
  localStorage.clear();
});

describe("SttAidNotice", () => {
  it("초기 (dismissed 아님) → 안내 표시 + 확인 버튼", () => {
    render(<SttAidNotice />);

    expect(screen.getByText(/실시간 자막은 보조/)).toBeInTheDocument();
    expect(screen.getByText(/별도 분석/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "확인" })).toBeInTheDocument();
  });

  it("localStorage 에 dismissed='1' 있음 → 렌더 안 함", () => {
    localStorage.setItem("stt_aid_notice_dismissed", "1");
    const { container } = render(<SttAidNotice />);
    expect(container.firstChild).toBeNull();
  });

  it("확인 버튼 클릭 → localStorage 저장 + 렌더 사라짐", async () => {
    render(<SttAidNotice />);

    await userEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(localStorage.getItem("stt_aid_notice_dismissed")).toBe("1");
    expect(screen.queryByText(/실시간 자막/)).not.toBeInTheDocument();
  });

  it("role='status' (a11y 살아있는 영역)", () => {
    render(<SttAidNotice />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
