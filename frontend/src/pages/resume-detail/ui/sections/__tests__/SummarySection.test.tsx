import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const putSummaryMock = jest.fn();
const saveMock = jest.fn();

jest.mock("@/features/resume", () => ({
  resumeSectionsApi: {
    putSummary: (...args: unknown[]) => putSummaryMock(...args),
  },
  useResumeSectionMutation: () => ({
    isSaving: false,
    save: saveMock,
  }),
}));

import { SummarySection } from "../SummarySection";

describe("SummarySection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveMock.mockImplementation(async (args: { onSuccess?: () => void; mutator: () => Promise<unknown> }) => {
      await args.mutator();
      args.onSuccess?.();
    });
    putSummaryMock.mockResolvedValue(undefined);
  });

  it("초기 (read 모드): value 가 그대로 표시되고 textarea 미노출", () => {
    render(<SummarySection resumeUuid="r-1" value="경력 요약 내용" onChange={() => {}} />);

    expect(screen.getByText("경력 요약 내용")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("value 가 빈 문자열이면 안내 문구 표시", () => {
    render(<SummarySection resumeUuid="r-1" value="" onChange={() => {}} />);

    expect(screen.getByText(/요약이 없습니다/)).toBeInTheDocument();
  });

  it("편집 버튼 클릭 → 편집 모드 + textarea 에 현재 value 동기화", async () => {
    render(<SummarySection resumeUuid="r-1" value="원본 요약" onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe("원본 요약");
  });

  it("textarea 입력 → draft 갱신 (저장 시 변경된 draft 사용)", async () => {
    const onChange = jest.fn();
    render(<SummarySection resumeUuid="r-1" value="원본" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "수정된 요약");

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(putSummaryMock).toHaveBeenCalledWith("r-1", "수정된 요약");
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("수정된 요약"));
  });

  it("저장 성공 → onChange 호출 + 편집 모드 종료 (textarea 사라짐)", async () => {
    const onChange = jest.fn();
    render(<SummarySection resumeUuid="r-1" value="원본" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    await waitFor(() => expect(screen.queryByRole("textbox")).not.toBeInTheDocument());
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("취소 버튼 클릭 → onChange 미호출 + 편집 종료", async () => {
    const onChange = jest.fn();
    render(<SummarySection resumeUuid="r-1" value="원본" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(putSummaryMock).not.toHaveBeenCalled();
  });
});
