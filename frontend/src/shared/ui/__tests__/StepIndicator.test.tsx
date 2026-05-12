import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepIndicator } from "../StepIndicator";

const STEPS = [
  { label: "기본정보", state: "done" as const },
  { label: "경력", state: "active" as const },
  { label: "확인", state: "pending" as const },
];

describe("StepIndicator", () => {
  it("steps 길이만큼 버튼 + 라벨 렌더", () => {
    render(<StepIndicator steps={STEPS} />);

    expect(screen.getByText("기본정보")).toBeInTheDocument();
    expect(screen.getByText("경력")).toBeInTheDocument();
    expect(screen.getByText("확인")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("done 상태 → 체크 아이콘 (lucide Check), active/pending → 인덱스 숫자", () => {
    const { container } = render(<StepIndicator steps={STEPS} />);

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("onStepClick 제공 → 버튼 클릭 시 인덱스 콜백", async () => {
    const onStepClick = jest.fn();
    render(<StepIndicator steps={STEPS} onStepClick={onStepClick} />);

    await userEvent.click(screen.getByText("경력"));
    expect(onStepClick).toHaveBeenCalledWith(1);
  });

  it("onStepClick 미지정 → 버튼 disabled (cursor-default + 클릭해도 콜백 없음)", async () => {
    render(<StepIndicator steps={STEPS} />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((b) => expect(b).toBeDisabled());
  });

  it("done/active 사이 연결선은 done 색상, active/pending 사이는 pending 색상", () => {
    const { container } = render(<StepIndicator steps={STEPS} />);

    const lines = container.querySelectorAll(".flex-1.h-\\[1\\.5px\\]");
    expect(lines.length).toBe(2);
    expect((lines[0] as HTMLElement).className).toContain("bg-mefit-success");
    expect((lines[1] as HTMLElement).className).toContain("bg-mefit-gray-200");
  });

  it("dark=true → 다크 테마 색상 (slate-800 background)", () => {
    const { container } = render(<StepIndicator steps={STEPS} dark />);

    expect((container.firstChild as HTMLElement).className).toContain("bg-slate-800/60");
  });

  it("className prop → 컨테이너에 추가 클래스 병합", () => {
    const { container } = render(<StepIndicator steps={STEPS} className="my-stepper" />);
    expect((container.firstChild as HTMLElement).className).toContain("my-stepper");
  });
});
