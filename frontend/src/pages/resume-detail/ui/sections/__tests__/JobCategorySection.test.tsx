import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ResumeJobCategory } from "@/features/resume";

const putJobCategoryMock = jest.fn();
const saveMock = jest.fn();

jest.mock("@/features/resume", () => ({
  resumeSectionsApi: {
    putJobCategory: (...args: unknown[]) => putJobCategoryMock(...args),
  },
  useResumeSectionMutation: () => ({ isSaving: false, save: saveMock }),
}));

import { JobCategorySection } from "../JobCategorySection";

const CATEGORY: ResumeJobCategory = { uuid: "c-1", name: "IT/개발", emoji: "💻" };

describe("JobCategorySection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveMock.mockImplementation(async (args: { mutator: () => Promise<unknown>; onSuccess?: (v: unknown) => void }) => {
      const r = await args.mutator();
      args.onSuccess?.(r);
    });
    putJobCategoryMock.mockResolvedValue({ category: CATEGORY });
  });

  it("읽기 모드: value=null → '(미설정)'", () => {
    render(<JobCategorySection resumeUuid="r-1" value={null} onChange={() => {}} />);

    expect(screen.getByText(/미설정/)).toBeInTheDocument();
  });

  it("읽기 모드: value 있음 → emoji + name 표시", () => {
    render(<JobCategorySection resumeUuid="r-1" value={CATEGORY} onChange={() => {}} />);

    expect(screen.getByText(/💻/)).toBeInTheDocument();
    expect(screen.getByText(/IT\/개발/)).toBeInTheDocument();
  });

  it("편집 진입 → select 노출, value?.name 으로 초기 선택", async () => {
    render(<JobCategorySection resumeUuid="r-1" value={CATEGORY} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("IT/개발");
  });

  it("저장 → putJobCategory(name) 호출 + 응답 category 로 onChange", async () => {
    const onChange = jest.fn();
    render(<JobCategorySection resumeUuid="r-1" value={null} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    await userEvent.selectOptions(select, "마케팅");

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(putJobCategoryMock).toHaveBeenCalledWith("r-1", "마케팅");
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(CATEGORY));
  });

  it("'(미설정)' 옵션 선택 → 빈 문자열로 API 호출", async () => {
    putJobCategoryMock.mockResolvedValueOnce({ category: null });
    const onChange = jest.fn();
    render(<JobCategorySection resumeUuid="r-1" value={CATEGORY} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    await userEvent.selectOptions(select, "");

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(putJobCategoryMock).toHaveBeenCalledWith("r-1", "");
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null));
  });

  it("취소 → API 미호출, 편집 종료", async () => {
    const onChange = jest.fn();
    render(<JobCategorySection resumeUuid="r-1" value={CATEGORY} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));

    expect(putJobCategoryMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
