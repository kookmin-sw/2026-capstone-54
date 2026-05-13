import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmModal } from "../ConfirmModal";

describe("ConfirmModal", () => {
  it("open=false → 렌더 안 됨", () => {
    render(
      <ConfirmModal
        open={false}
        title="확인"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("open=true → title/description/children + 확인/취소 버튼 표시", () => {
    render(
      <ConfirmModal
        open
        title="덮어쓸까요?"
        description="현재 작성중인 내용이 사라집니다."
        onConfirm={() => {}}
        onCancel={() => {}}
      >
        <span>추가 안내</span>
      </ConfirmModal>,
    );

    expect(screen.getByText("덮어쓸까요?")).toBeInTheDocument();
    expect(screen.getByText(/사라집니다/)).toBeInTheDocument();
    expect(screen.getByText("추가 안내")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "확인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
  });

  it("custom confirmLabel/cancelLabel 적용", () => {
    render(
      <ConfirmModal
        open
        title="x"
        confirmLabel="삭제"
        cancelLabel="유지"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "유지" })).toBeInTheDocument();
  });

  it("destructive=true → 빨간 confirm 버튼 색상 (bg-[#DC2626])", () => {
    render(
      <ConfirmModal
        open
        title="x"
        destructive
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "확인" }).className).toContain("bg-[#DC2626]");
  });

  it("destructive=false → 검정 confirm 버튼 색상 (bg-[#0A0A0A])", () => {
    render(
      <ConfirmModal
        open
        title="x"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "확인" }).className).toContain("bg-[#0A0A0A]");
  });

  it("취소 버튼 → onCancel 호출", async () => {
    const onCancel = jest.fn();
    render(<ConfirmModal open title="x" onConfirm={() => {}} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("X 버튼/ESC → onCancel 호출", () => {
    const onCancel = jest.fn();
    render(<ConfirmModal open title="x" onConfirm={() => {}} onCancel={onCancel} />);

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("확인 버튼 → onConfirm 호출 (async 지원)", async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(<ConfirmModal open title="x" onConfirm={onConfirm} onCancel={() => {}} />);

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "확인" }));
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("onConfirm 진행 중 두 번 클릭해도 1 회만 호출 (re-entry 가드)", async () => {
    let resolveFn: (() => void) | null = null;
    const onConfirm = jest.fn(
      () => new Promise<void>((res) => {
        resolveFn = res;
      }),
    );
    render(<ConfirmModal open title="x" onConfirm={onConfirm} onCancel={() => {}} />);

    const confirmBtn = screen.getByRole("button", { name: "확인" });

    await act(async () => {
      await userEvent.click(confirmBtn);
    });
    await act(async () => {
      await userEvent.click(confirmBtn);
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFn?.();
    });
  });

  it("onConfirm throw → onError 콜백 호출 + isConfirming 해제", async () => {
    const onError = jest.fn();
    const onConfirm = jest.fn().mockRejectedValue(new Error("boom"));
    render(
      <ConfirmModal
        open
        title="x"
        onConfirm={onConfirm}
        onCancel={() => {}}
        onError={onError}
      />,
    );

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "확인" }));
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "확인" })).not.toBeDisabled(),
    );
  });

  it("onConfirm throw + onError 미지정 → console.error fallback", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const onConfirm = jest.fn().mockRejectedValue(new Error("boom"));
    render(<ConfirmModal open title="x" onConfirm={onConfirm} onCancel={() => {}} />);

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "확인" }));
    });

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("ConfirmModal"), expect.any(Error));
    errSpy.mockRestore();
  });
});
