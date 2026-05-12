import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ParsedExperience } from "@/features/resume";

const addExperienceMock = jest.fn();
const updateExperienceMock = jest.fn();
const deleteExperienceMock = jest.fn();
const saveMock = jest.fn();

jest.mock("@/features/resume", () => ({
  resumeSectionsApi: {
    addExperience: (...a: unknown[]) => addExperienceMock(...a),
    updateExperience: (...a: unknown[]) => updateExperienceMock(...a),
    deleteExperience: (...a: unknown[]) => deleteExperienceMock(...a),
  },
  useResumeSectionMutation: () => ({ isSaving: false, save: saveMock }),
}));

import { ExperiencesSection } from "../ExperiencesSection";

const EXISTING: ParsedExperience = {
  uuid: "x-1",
  company: "Mefit",
  role: "Backend Engineer",
  period: "2023.03 - 2024.12",
  responsibilities: ["API 설계", "Celery 워커 운영"],
  highlights: ["MAU 30% 증가"],
};

describe("ExperiencesSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveMock.mockImplementation(async (args: { mutator: () => Promise<unknown>; onSuccess?: (v: unknown) => void }) => {
      const r = await args.mutator();
      args.onSuccess?.(r);
    });
    addExperienceMock.mockImplementation(async (_uuid: string, payload: Record<string, unknown>) => ({ uuid: "new-1", ...payload }));
    updateExperienceMock.mockImplementation(async (_uuid: string, _itemUuid: string, payload: Record<string, unknown>) => ({ uuid: EXISTING.uuid, ...payload }));
    deleteExperienceMock.mockResolvedValue(undefined);
  });

  it("items=[] + 추가 버튼 → 회사명 placeholder 가 있는 form 노출", async () => {
    render(<ExperiencesSection resumeUuid="r-1" items={[]} onChange={() => {}} />);

    expect(screen.queryByPlaceholderText("회사명")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /추가/ }));

    expect(screen.getByPlaceholderText("회사명")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("직함/직무")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/한 줄에 하나/)).toHaveLength(2);
  });

  it("items=[기존] → read view 에 company/role/period 표시 + responsibilities/highlights bullet 렌더", () => {
    render(<ExperiencesSection resumeUuid="r-1" items={[EXISTING]} onChange={() => {}} />);

    expect(screen.getByText("Mefit")).toBeInTheDocument();
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("2023.03 - 2024.12")).toBeInTheDocument();
    expect(screen.getByText(/주요 업무/)).toBeInTheDocument();
    expect(screen.getByText(/API 설계/)).toBeInTheDocument();
    expect(screen.getByText(/Celery 워커 운영/)).toBeInTheDocument();
    expect(screen.getByText(/주요 성과/)).toBeInTheDocument();
    expect(screen.getByText(/MAU 30% 증가/)).toBeInTheDocument();
  });

  it("신규 추가: empty form 입력 → addExperience(payload) with empty arrays + displayOrder=0", async () => {
    const onChange = jest.fn();
    render(<ExperiencesSection resumeUuid="r-1" items={[]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /추가/ }));
    await userEvent.type(screen.getByPlaceholderText("회사명"), "NewCo");

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(addExperienceMock).toHaveBeenCalledWith("r-1", {
      company: "NewCo",
      role: "",
      period: "",
      responsibilities: [],
      highlights: [],
      displayOrder: 0,
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.calls[0][0]).toHaveLength(1);
  });

  it("responsibilities/highlights textarea: 줄바꿈 → split + 빈 줄 filter 후 배열 전송", async () => {
    const onChange = jest.fn();
    render(<ExperiencesSection resumeUuid="r-1" items={[]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /추가/ }));
    await userEvent.type(screen.getByPlaceholderText("회사명"), "Acme");

    const textareas = screen.getAllByRole("textbox").filter((el) => el.tagName === "TEXTAREA") as HTMLTextAreaElement[];
    fireEvent.change(textareas[0], { target: { value: "업무 A\n업무 B\n\n업무 C" } });
    fireEvent.change(textareas[1], { target: { value: "성과 1\n\n성과 2" } });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    const payload = addExperienceMock.mock.calls[0][1];
    expect(payload.responsibilities).toEqual(["업무 A", "업무 B", "업무 C"]);
    expect(payload.highlights).toEqual(["성과 1", "성과 2"]);
  });

  it("편집 플로우: 기존 item 편집 클릭 → form 에 값 동기화 + 회사명 변경 후 저장 → updateExperience", async () => {
    const onChange = jest.fn();
    render(<ExperiencesSection resumeUuid="r-1" items={[EXISTING]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));

    const companyInput = screen.getByPlaceholderText("회사명") as HTMLInputElement;
    expect(companyInput.value).toBe("Mefit");
    await userEvent.clear(companyInput);
    await userEvent.type(companyInput, "Mefit Renamed");

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(updateExperienceMock).toHaveBeenCalledWith("r-1", EXISTING.uuid, {
      company: "Mefit Renamed",
      role: EXISTING.role,
      period: EXISTING.period,
      responsibilities: EXISTING.responsibilities,
      highlights: EXISTING.highlights,
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  });

  it("삭제 버튼 → deleteExperience + items 에서 제거", async () => {
    const onChange = jest.fn();
    render(<ExperiencesSection resumeUuid="r-1" items={[EXISTING]} onChange={onChange} />);

    const deleteBtn = screen
      .getAllByRole("button")
      .find((b) => b.className.includes("DC2626"))!;
    await act(async () => {
      await userEvent.click(deleteBtn);
    });

    expect(deleteExperienceMock).toHaveBeenCalledWith("r-1", EXISTING.uuid);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("uuid 없는 임시 item 의 삭제 버튼은 deleteExperience 호출 안 함 (guard)", async () => {
    const itemWithoutUuid: ParsedExperience = { ...EXISTING, uuid: undefined };
    const onChange = jest.fn();
    render(<ExperiencesSection resumeUuid="r-1" items={[itemWithoutUuid]} onChange={onChange} />);

    const deleteBtn = screen
      .getAllByRole("button")
      .find((b) => b.className.includes("DC2626"))!;
    await act(async () => {
      await userEvent.click(deleteBtn);
    });

    expect(deleteExperienceMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("추가 form 취소 → API 미호출 + form 닫힘", async () => {
    render(<ExperiencesSection resumeUuid="r-1" items={[]} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /추가/ }));
    expect(screen.getByPlaceholderText("회사명")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));

    expect(screen.queryByPlaceholderText("회사명")).not.toBeInTheDocument();
    expect(addExperienceMock).not.toHaveBeenCalled();
  });
});
