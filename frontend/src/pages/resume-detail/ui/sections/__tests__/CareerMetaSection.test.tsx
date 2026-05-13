import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const putCareerMetaMock = jest.fn();
const saveMock = jest.fn();

jest.mock("@/features/resume", () => ({
  resumeSectionsApi: {
    putCareerMeta: (...args: unknown[]) => putCareerMetaMock(...args),
  },
  useResumeSectionMutation: () => ({ isSaving: false, save: saveMock }),
}));

import { CareerMetaSection } from "../CareerMetaSection";

describe("CareerMetaSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveMock.mockImplementation(async (args: { mutator: () => Promise<unknown>; onSuccess?: () => void }) => {
      await args.mutator();
      args.onSuccess?.();
    });
    putCareerMetaMock.mockResolvedValue(undefined);
  });

  it("읽기 모드: years/months 모두 null → '(미입력)'", () => {
    render(<CareerMetaSection resumeUuid="r-1" years={null} months={null} onChange={() => {}} />);

    expect(screen.getByText(/미입력/)).toBeInTheDocument();
  });

  it("읽기 모드: years 만 있음 → 'Xy 0개월'", () => {
    render(<CareerMetaSection resumeUuid="r-1" years={3} months={null} onChange={() => {}} />);

    expect(screen.getByText("3년 0개월")).toBeInTheDocument();
  });

  it("읽기 모드: months 만 있음 → '0년 X개월'", () => {
    render(<CareerMetaSection resumeUuid="r-1" years={null} months={6} onChange={() => {}} />);

    expect(screen.getByText("0년 6개월")).toBeInTheDocument();
  });

  it("편집 진입 → number input 2 개에 years/months 동기화", async () => {
    render(<CareerMetaSection resumeUuid="r-1" years={3} months={6} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));

    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe("3");
    expect(inputs[1].value).toBe("6");
  });

  it("저장 → putCareerMeta(years, months) 호출 + onChange + 편집 종료", async () => {
    const onChange = jest.fn();
    render(<CareerMetaSection resumeUuid="r-1" years={null} months={null} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    await userEvent.type(inputs[0], "5");
    await userEvent.type(inputs[1], "3");

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(putCareerMetaMock).toHaveBeenCalledWith("r-1", 5, 3);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(5, 3));
  });

  it("빈 입력 → null 로 저장 (parseIntOrNull)", async () => {
    render(<CareerMetaSection resumeUuid="r-1" years={2} months={4} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    await userEvent.clear(inputs[0]);
    await userEvent.clear(inputs[1]);

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(putCareerMetaMock).toHaveBeenCalledWith("r-1", null, null);
  });

  it("months > 11 → validation 막힘, API 미호출", async () => {
    render(<CareerMetaSection resumeUuid="r-1" years={null} months={null} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    await userEvent.type(inputs[0], "3");
    await userEvent.type(inputs[1], "12");

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(putCareerMetaMock).not.toHaveBeenCalled();
  });

  it("취소 → API 미호출, 편집 종료", async () => {
    const onChange = jest.fn();
    render(<CareerMetaSection resumeUuid="r-1" years={2} months={4} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));

    expect(putCareerMetaMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
