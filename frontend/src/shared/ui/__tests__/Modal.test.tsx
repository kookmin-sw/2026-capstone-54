import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../Modal";

beforeEach(() => {
  document.body.style.overflow = "";
});

describe("Modal — 마운트 / 언마운트", () => {
  it("open=false → 렌더 안 됨 (portal 미생성)", () => {
    render(<Modal open={false} onClose={() => {}} title="제목" />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("open=true → portal 로 dialog 렌더 + title/description 표시", () => {
    render(
      <Modal open onClose={() => {}} title="확인" description="진행하시겠어요?">
        내용
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("확인")).toBeInTheDocument();
    expect(screen.getByText(/진행하시겠어요/)).toBeInTheDocument();
    expect(screen.getByText("내용")).toBeInTheDocument();
  });

  it("open=true 시 onOpened 콜백 호출 (마운트 1 회)", () => {
    const onOpened = jest.fn();
    render(<Modal open onClose={() => {}} title="x" onOpened={onOpened} />);

    expect(onOpened).toHaveBeenCalledTimes(1);
  });

  it("open=true 시 body overflow='hidden' (scroll lock 획득)", () => {
    render(<Modal open onClose={() => {}} title="x" />);

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("unmount → body scroll lock 해제 (overflow 복구)", () => {
    const { unmount } = render(<Modal open onClose={() => {}} title="x" />);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("Modal — 닫기 인터랙션", () => {
  it("닫기 X 버튼 클릭 → onClose 호출", async () => {
    const onClose = jest.fn();
    render(<Modal open onClose={onClose} title="x" />);

    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("showCloseButton=false → X 버튼 미노출", () => {
    render(<Modal open onClose={() => {}} title="x" showCloseButton={false} />);
    expect(screen.queryByRole("button", { name: "닫기" })).not.toBeInTheDocument();
  });

  it("backdrop 클릭 → onClose 호출 (default)", async () => {
    const onClose = jest.fn();
    render(<Modal open onClose={onClose} title="x" />);

    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismissOnBackdrop=false → backdrop 클릭해도 onClose 미호출", async () => {
    const onClose = jest.fn();
    render(<Modal open onClose={onClose} title="x" dismissOnBackdrop={false} />);

    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    await userEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ESC 키 → onClose 호출 (default)", () => {
    const onClose = jest.fn();
    render(<Modal open onClose={onClose} title="x" />);

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismissOnEsc=false → ESC 눌러도 onClose 미호출", () => {
    const onClose = jest.fn();
    render(<Modal open onClose={onClose} title="x" dismissOnEsc={false} />);

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("Modal — body / footer / sticky slots", () => {
  it("title 만 있고 children/stickyTop 없음 → body 영역 미렌더 (divider 생략)", () => {
    const { container } = render(<Modal open onClose={() => {}} title="확인" />);
    const body = container.querySelector(".overflow-y-auto");
    expect(body).toBeNull();
  });

  it("footer prop 제공 → footer 영역 렌더", () => {
    render(
      <Modal open onClose={() => {}} title="x" footer={<button>확인</button>}>
        내용
      </Modal>,
    );

    expect(screen.getByRole("button", { name: "확인" })).toBeInTheDocument();
  });

  it("stickyTop 만 제공 → sticky 슬롯 + body 영역 렌더", () => {
    render(
      <Modal open onClose={() => {}} title="x" stickyTop={<div>검색바</div>} />,
    );

    expect(screen.getByText("검색바")).toBeInTheDocument();
  });
});

describe("Modal — 중첩 scroll lock", () => {
  it("두 Modal 동시에 open → 첫 번째 닫혀도 두 번째가 lock 유지", () => {
    const { rerender, unmount } = render(
      <>
        <Modal open onClose={() => {}} title="m1" />
        <Modal open onClose={() => {}} title="m2" />
      </>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <>
        <Modal open={false} onClose={() => {}} title="m1" />
        <Modal open onClose={() => {}} title="m2" />
      </>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
