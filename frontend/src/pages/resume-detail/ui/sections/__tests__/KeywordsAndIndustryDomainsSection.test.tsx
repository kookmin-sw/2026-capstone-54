import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const putKeywordsMock = jest.fn();
const putIndustryDomainsMock = jest.fn();
const saveMock = jest.fn();

jest.mock("@/features/resume", () => ({
  resumeSectionsApi: {
    putKeywords: (...args: unknown[]) => putKeywordsMock(...args),
    putIndustryDomains: (...args: unknown[]) => putIndustryDomainsMock(...args),
  },
  useResumeSectionMutation: () => ({ isSaving: false, save: saveMock }),
}));

import { KeywordsSection } from "../KeywordsSection";
import { IndustryDomainsSection } from "../IndustryDomainsSection";

interface CsvSectionCase {
  name: string;
  Component: typeof KeywordsSection | typeof IndustryDomainsSection;
  apiMock: jest.Mock;
}

const CASES: CsvSectionCase[] = [
  { name: "KeywordsSection", Component: KeywordsSection, apiMock: putKeywordsMock },
  { name: "IndustryDomainsSection", Component: IndustryDomainsSection, apiMock: putIndustryDomainsMock },
];

describe.each(CASES)("$name (CSV 변환 패턴)", ({ Component, apiMock }) => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveMock.mockImplementation(async (args: { mutator: () => Promise<unknown>; onSuccess?: () => void }) => {
      await args.mutator();
      args.onSuccess?.();
    });
    apiMock.mockResolvedValue(undefined);
  });

  it("읽기 모드: 빈 배열 → '(없음)' 안내", () => {
    render(<Component resumeUuid="r-1" value={[]} onChange={() => {}} />);

    expect(screen.getByText(/없음/)).toBeInTheDocument();
  });

  it("읽기 모드: 항목 배열 → chip 으로 모두 렌더", () => {
    render(<Component resumeUuid="r-1" value={["A", "B", "C"]} onChange={() => {}} />);

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("편집 진입 → input 에 CSV 형식 (', ' 조인) 으로 동기화", async () => {
    render(<Component resumeUuid="r-1" value={["React", "TypeScript"]} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("React, TypeScript");
  });

  it("CSV 입력 → split + trim + 빈 토큰 제거 후 API 호출", async () => {
    const onChange = jest.fn();
    render(<Component resumeUuid="r-1" value={[]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await userEvent.type(input, "React, TS , , Vue");

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(apiMock).toHaveBeenCalledWith("r-1", ["React", "TS", "Vue"]);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(["React", "TS", "Vue"]));
  });

  it("저장 후 편집 모드 자동 종료 (input 사라짐)", async () => {
    render(<Component resumeUuid="r-1" value={["A"]} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    await waitFor(() => expect(screen.queryByRole("textbox")).not.toBeInTheDocument());
  });

  it("취소 → API 미호출, 편집 종료", async () => {
    const onChange = jest.fn();
    render(<Component resumeUuid="r-1" value={["A"]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));

    expect(apiMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
