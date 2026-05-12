import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoachMarks, type CoachMarkStep } from "../CoachMarks";

const STEPS: CoachMarkStep[] = [
  { id: "s1", title: "1단계", description: "첫 번째 단계 안내", targetSelector: "#target-1" },
  { id: "s2", title: "2단계", description: "두 번째 단계 안내", targetSelector: "#target-2" },
  { id: "s3", title: "3단계", description: "마지막 단계 안내", targetSelector: "#target-3" },
];

function installTargets(): void {
  document.body.innerHTML = `
    <div id="target-1" style="position:absolute;top:10px;left:10px;width:100px;height:50px;"></div>
    <div id="target-2" style="position:absolute;top:100px;left:100px;width:100px;height:50px;"></div>
    <div id="target-3" style="position:absolute;top:200px;left:200px;width:100px;height:50px;"></div>
  `;
}

beforeEach(() => {
  installTargets();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("CoachMarks — 마운트 / 언마운트", () => {
  it("open=false → 렌더 안 됨", () => {
    render(<CoachMarks steps={STEPS} open={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("open=true → portal 로 dialog + 첫 step 표시", () => {
    render(<CoachMarks steps={STEPS} open onClose={() => {}} />);

    expect(screen.getByRole("dialog", { name: /Coach Marks/ })).toBeInTheDocument();
    expect(screen.getByText("1단계")).toBeInTheDocument();
    expect(screen.getByText("첫 번째 단계 안내")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("steps 빈 배열 → currentStepData 없음 → 미렌더", () => {
    render(<CoachMarks steps={[]} open onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("CoachMarks — uncontrolled 네비게이션", () => {
  it("Next 버튼 → 다음 step 으로 진행", async () => {
    render(<CoachMarks steps={STEPS} open onClose={() => {}} />);

    const buttons = Array.from(document.querySelectorAll("button"));
    const nextBtn = buttons.find((b) => b.querySelector(".lucide-arrow-right") !== null)!;
    await userEvent.click(nextBtn);

    expect(screen.getByText("2단계")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("마지막 step + Next → onComplete + onClose 호출", async () => {
    const onClose = jest.fn();
    const onComplete = jest.fn();
    render(
      <CoachMarks
        steps={STEPS}
        open
        onClose={onClose}
        onComplete={onComplete}
        currentStep={STEPS.length - 1}
        onStepChange={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /완료/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /완료/ }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("건너뛰기 버튼 → onComplete + onClose 호출", async () => {
    const onClose = jest.fn();
    const onComplete = jest.fn();
    render(
      <CoachMarks steps={STEPS} open onClose={onClose} onComplete={onComplete} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /건너뛰기/ }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("닫기 X 버튼 → onClose 호출 (onComplete 호출 안 함)", async () => {
    const onClose = jest.fn();
    const onComplete = jest.fn();
    render(
      <CoachMarks steps={STEPS} open onClose={onClose} onComplete={onComplete} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Close coach marks/ }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("CoachMarks — controlled 네비게이션", () => {
  it("controlled mode: currentStep prop 으로 단계 전환", () => {
    const { rerender } = render(
      <CoachMarks
        steps={STEPS}
        open
        onClose={() => {}}
        currentStep={0}
        onStepChange={() => {}}
      />,
    );
    expect(screen.getByText("1단계")).toBeInTheDocument();

    rerender(
      <CoachMarks
        steps={STEPS}
        open
        onClose={() => {}}
        currentStep={1}
        onStepChange={() => {}}
      />,
    );
    expect(screen.getByText("2단계")).toBeInTheDocument();
  });

  it("controlled mode + Next → onStepChange(idx+1) 호출", async () => {
    const onStepChange = jest.fn();
    render(
      <CoachMarks
        steps={STEPS}
        open
        onClose={() => {}}
        currentStep={0}
        onStepChange={onStepChange}
      />,
    );

    const nextBtn = Array.from(document.querySelectorAll("button"))
      .find((b) => b.querySelector(".lucide-arrow-right") !== null)!;
    await userEvent.click(nextBtn);

    expect(onStepChange).toHaveBeenCalledWith(1);
  });

  it("controlled mode + Previous (step > 0) → onStepChange(idx-1)", async () => {
    const onStepChange = jest.fn();
    render(
      <CoachMarks
        steps={STEPS}
        open
        onClose={() => {}}
        currentStep={1}
        onStepChange={onStepChange}
      />,
    );

    const prevBtn = Array.from(document.querySelectorAll("button"))
      .find((b) => b.querySelector(".lucide-arrow-left") !== null)!;
    await userEvent.click(prevBtn);

    expect(onStepChange).toHaveBeenCalledWith(0);
  });
});

describe("CoachMarks — 키보드 네비게이션", () => {
  it("ArrowRight → 다음 step", () => {
    render(<CoachMarks steps={STEPS} open onClose={() => {}} />);

    act(() => {
      fireEvent.keyDown(document, { key: "ArrowRight" });
    });

    expect(screen.getByText("2단계")).toBeInTheDocument();
  });

  it("ArrowLeft (step > 0) → 이전 step", async () => {
    render(<CoachMarks steps={STEPS} open onClose={() => {}} />);

    act(() => {
      fireEvent.keyDown(document, { key: "ArrowRight" });
    });
    expect(screen.getByText("2단계")).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: "ArrowLeft" });
    });
    expect(screen.getByText("1단계")).toBeInTheDocument();
  });

  it("ESC → onClose 호출 (dismissOnEsc=true default)", () => {
    const onClose = jest.fn();
    render(<CoachMarks steps={STEPS} open onClose={onClose} />);

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismissOnEsc=false → ESC 눌러도 onClose 미호출", () => {
    const onClose = jest.fn();
    render(
      <CoachMarks steps={STEPS} open onClose={onClose} dismissOnEsc={false} />,
    );

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("CoachMarks — 백드롭", () => {
  it("dismissOnBackdrop=true (default) vs false → backdrop div 개수 차이", () => {
    const { unmount } = render(
      <CoachMarks steps={STEPS} open onClose={() => {}} dismissOnBackdrop />,
    );
    const withBackdrop = document.querySelectorAll('div[aria-hidden="true"].absolute.inset-0').length;
    unmount();

    render(
      <CoachMarks steps={STEPS} open onClose={() => {}} dismissOnBackdrop={false} />,
    );
    const withoutBackdrop = document.querySelectorAll('div[aria-hidden="true"].absolute.inset-0').length;

    expect(withBackdrop).toBe(withoutBackdrop + 1);
  });
});
