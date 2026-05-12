import { render, screen, act, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ParsedSkillGroup } from "@/features/resume";

const putSkillsMock = jest.fn();
const saveMock = jest.fn();

jest.mock("@/features/resume", () => ({
  resumeSectionsApi: {
    putSkills: (...args: unknown[]) => putSkillsMock(...args),
  },
  useResumeSectionMutation: () => ({ isSaving: false, save: saveMock }),
}));

import { SkillsSection } from "../SkillsSection";

const VALUE: ParsedSkillGroup = {
  technical: ["React", "TypeScript"],
  soft: ["커뮤니케이션"],
  tools: ["Figma", "Notion"],
  languages: [],
};

describe("SkillsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveMock.mockImplementation(async (args: { mutator: () => Promise<unknown>; onSuccess?: () => void }) => {
      await args.mutator();
      args.onSuccess?.();
    });
    putSkillsMock.mockResolvedValue(undefined);
  });

  it("읽기 모드: 항목이 있는 그룹만 표시, 빈 그룹 (languages) 은 hide", () => {
    render(<SkillsSection resumeUuid="r-1" value={VALUE} onChange={() => {}} />);

    expect(screen.getByText("기술")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("커뮤니케이션")).toBeInTheDocument();
    expect(screen.getByText("Figma")).toBeInTheDocument();
    expect(screen.queryByText("언어")).not.toBeInTheDocument();
  });

  it("편집 진입 → 4 input 모두 노출, 각 그룹의 CSV 동기화", async () => {
    render(<SkillsSection resumeUuid="r-1" value={VALUE} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));

    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(inputs).toHaveLength(4);
    expect(inputs[0].value).toBe("React, TypeScript");
    expect(inputs[1].value).toBe("커뮤니케이션");
    expect(inputs[2].value).toBe("Figma, Notion");
    expect(inputs[3].value).toBe("");
  });

  it("저장 → putSkills 가 4 그룹 객체 형태로 호출 + onChange", async () => {
    const onChange = jest.fn();
    render(<SkillsSection resumeUuid="r-1" value={VALUE} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    fireEvent.change(inputs[3], { target: { value: "Korean, English" } });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(putSkillsMock).toHaveBeenCalledWith("r-1", {
      technical: ["React", "TypeScript"],
      soft: ["커뮤니케이션"],
      tools: ["Figma", "Notion"],
      languages: ["Korean", "English"],
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  });

  it("그룹 input 비우기 → 빈 배열로 저장", async () => {
    render(<SkillsSection resumeUuid="r-1" value={VALUE} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    await userEvent.clear(inputs[0]);

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(putSkillsMock.mock.calls[0][1].technical).toEqual([]);
  });

  it("취소 → API 미호출, 편집 종료", async () => {
    const onChange = jest.fn();
    render(<SkillsSection resumeUuid="r-1" value={VALUE} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));

    expect(putSkillsMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
