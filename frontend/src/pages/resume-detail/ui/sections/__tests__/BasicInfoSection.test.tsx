import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ParsedBasicInfo } from "@/features/resume";

const putBasicInfoMock = jest.fn();
const saveMock = jest.fn();

jest.mock("@/features/resume", () => ({
  resumeSectionsApi: {
    putBasicInfo: (...args: unknown[]) => putBasicInfoMock(...args),
  },
  useResumeSectionMutation: () => ({ isSaving: false, save: saveMock }),
}));

import { BasicInfoSection } from "../BasicInfoSection";

const VALUE: ParsedBasicInfo = {
  name: "홍길동",
  email: "hong@example.com",
  phone: "010-1234-5678",
  location: "서울",
};

describe("BasicInfoSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveMock.mockImplementation(async (args: { mutator: () => Promise<unknown>; onSuccess?: (v: unknown) => void }) => {
      const r = await args.mutator();
      args.onSuccess?.(r);
    });
    putBasicInfoMock.mockResolvedValue(VALUE);
  });

  it("읽기 모드: 4 필드 값을 모두 표시", () => {
    render(<BasicInfoSection resumeUuid="r-1" value={VALUE} onChange={() => {}} />);

    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("hong@example.com")).toBeInTheDocument();
    expect(screen.getByText("010-1234-5678")).toBeInTheDocument();
    expect(screen.getByText("서울")).toBeInTheDocument();
  });

  it("읽기 모드: null/undefined 필드는 '-' 로 표시", () => {
    const empty: ParsedBasicInfo = { name: null, email: undefined, phone: "", location: null };
    render(<BasicInfoSection resumeUuid="r-1" value={empty} onChange={() => {}} />);

    expect(screen.getAllByText("-").length).toBe(4);
  });

  it("편집 모드 진입 → 4 input 에 현재 value 동기화", async () => {
    render(<BasicInfoSection resumeUuid="r-1" value={VALUE} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));

    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(inputs).toHaveLength(4);
    expect(inputs[0].value).toBe("홍길동");
    expect(inputs[1].value).toBe("hong@example.com");
    expect(inputs[2].value).toBe("010-1234-5678");
    expect(inputs[3].value).toBe("서울");
  });

  it("저장 → putBasicInfo 가 4 필드 객체로 호출 + onChange + 편집 종료", async () => {
    const onChange = jest.fn();
    render(<BasicInfoSection resumeUuid="r-1" value={VALUE} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    await userEvent.clear(inputs[0]);
    await userEvent.type(inputs[0], "김철수");

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(putBasicInfoMock).toHaveBeenCalledWith("r-1", {
      name: "김철수",
      email: "hong@example.com",
      phone: "010-1234-5678",
      location: "서울",
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.calls[0][0].name).toBe("김철수");
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });

  it("저장 시 null 필드 → 빈 문자열로 전송 (??= ''포함)", async () => {
    const partial: ParsedBasicInfo = { name: "홍길동", email: null, phone: undefined, location: null };
    render(<BasicInfoSection resumeUuid="r-1" value={partial} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(putBasicInfoMock).toHaveBeenCalledWith("r-1", {
      name: "홍길동",
      email: "",
      phone: "",
      location: "",
    });
  });

  it("취소 → API 미호출, 편집 종료", async () => {
    const onChange = jest.fn();
    render(<BasicInfoSection resumeUuid="r-1" value={VALUE} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));

    expect(putBasicInfoMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });
});
