import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";

const addEducationMock = jest.fn();
const updateEducationMock = jest.fn();
const deleteEducationMock = jest.fn();

const addAwardMock = jest.fn();
const updateAwardMock = jest.fn();
const deleteAwardMock = jest.fn();

const addCertificationMock = jest.fn();
const updateCertificationMock = jest.fn();
const deleteCertificationMock = jest.fn();

const addProjectMock = jest.fn();
const updateProjectMock = jest.fn();
const deleteProjectMock = jest.fn();

const addLanguageSpokenMock = jest.fn();
const updateLanguageSpokenMock = jest.fn();
const deleteLanguageSpokenMock = jest.fn();

const saveMock = jest.fn();

jest.mock("@/features/resume", () => ({
  resumeSectionsApi: {
    addEducation: (...a: unknown[]) => addEducationMock(...a),
    updateEducation: (...a: unknown[]) => updateEducationMock(...a),
    deleteEducation: (...a: unknown[]) => deleteEducationMock(...a),
    addAward: (...a: unknown[]) => addAwardMock(...a),
    updateAward: (...a: unknown[]) => updateAwardMock(...a),
    deleteAward: (...a: unknown[]) => deleteAwardMock(...a),
    addCertification: (...a: unknown[]) => addCertificationMock(...a),
    updateCertification: (...a: unknown[]) => updateCertificationMock(...a),
    deleteCertification: (...a: unknown[]) => deleteCertificationMock(...a),
    addProject: (...a: unknown[]) => addProjectMock(...a),
    updateProject: (...a: unknown[]) => updateProjectMock(...a),
    deleteProject: (...a: unknown[]) => deleteProjectMock(...a),
    addLanguageSpoken: (...a: unknown[]) => addLanguageSpokenMock(...a),
    updateLanguageSpoken: (...a: unknown[]) => updateLanguageSpokenMock(...a),
    deleteLanguageSpoken: (...a: unknown[]) => deleteLanguageSpokenMock(...a),
  },
  useResumeSectionMutation: () => ({ isSaving: false, save: saveMock }),
}));

import { EducationsSection } from "../EducationsSection";
import { AwardsSection } from "../AwardsSection";
import { CertificationsSection } from "../CertificationsSection";
import { ProjectsSection } from "../ProjectsSection";
import { LanguagesSpokenSection } from "../LanguagesSpokenSection";

interface OneToManyCase {
  name: string;
  Component: ComponentType<{
    resumeUuid: string;
    items: Record<string, unknown>[];
    onChange: (n: Record<string, unknown>[]) => void;
  }>;
  addMock: jest.Mock;
  updateMock: jest.Mock;
  deleteMock: jest.Mock;
  existingItem: Record<string, unknown>;
  itemReadText: RegExp;
  primaryFieldPlaceholder: string;
  primaryFieldValue: string;
  expectedAddPayload: Record<string, unknown>;
  expectedUpdatePayload: Record<string, unknown>;
}

const CASES: OneToManyCase[] = [
  {
    name: "EducationsSection",
    Component: EducationsSection as unknown as OneToManyCase["Component"],
    addMock: addEducationMock,
    updateMock: updateEducationMock,
    deleteMock: deleteEducationMock,
    existingItem: { uuid: "e-1", school: "서울대", degree: "학사", major: "컴공", period: "2018-2022" },
    itemReadText: /서울대/,
    primaryFieldPlaceholder: "학교",
    primaryFieldValue: "한양대",
    expectedAddPayload: { school: "한양대", degree: "", major: "", period: "", displayOrder: 0 },
    expectedUpdatePayload: { school: "한양대", degree: "학사", major: "컴공", period: "2018-2022" },
  },
  {
    name: "AwardsSection",
    Component: AwardsSection as unknown as OneToManyCase["Component"],
    addMock: addAwardMock,
    updateMock: updateAwardMock,
    deleteMock: deleteAwardMock,
    existingItem: { uuid: "a-1", name: "대상", year: "2024", organization: "AI 컨퍼런스", description: "오케스트레이션 부문" },
    itemReadText: /대상/,
    primaryFieldPlaceholder: "수상 이름",
    primaryFieldValue: "최우수상",
    expectedAddPayload: { name: "최우수상", year: "", organization: "", description: "", displayOrder: 0 },
    expectedUpdatePayload: { name: "최우수상", year: "2024", organization: "AI 컨퍼런스", description: "오케스트레이션 부문" },
  },
  {
    name: "CertificationsSection",
    Component: CertificationsSection as unknown as OneToManyCase["Component"],
    addMock: addCertificationMock,
    updateMock: updateCertificationMock,
    deleteMock: deleteCertificationMock,
    existingItem: { uuid: "c-1", name: "정보처리기사", issuer: "한국산업인력공단", date: "2022-09" },
    itemReadText: /정보처리기사/,
    primaryFieldPlaceholder: "이름",
    primaryFieldValue: "AWS SAA",
    expectedAddPayload: { name: "AWS SAA", issuer: "", date: "", displayOrder: 0 },
    expectedUpdatePayload: { name: "AWS SAA", issuer: "한국산업인력공단", date: "2022-09" },
  },
  {
    name: "ProjectsSection",
    Component: ProjectsSection as unknown as OneToManyCase["Component"],
    addMock: addProjectMock,
    updateMock: updateProjectMock,
    deleteMock: deleteProjectMock,
    existingItem: { uuid: "p-1", name: "이력서 분석기", role: "BE", period: "2024", description: "RAG 기반 분석", techStack: ["Django", "Celery"] },
    itemReadText: /이력서 분석기/,
    primaryFieldPlaceholder: "프로젝트명",
    primaryFieldValue: "면접 시뮬레이터",
    expectedAddPayload: { name: "면접 시뮬레이터", role: "", period: "", description: "", techStack: [], displayOrder: 0 },
    expectedUpdatePayload: { name: "면접 시뮬레이터", role: "BE", period: "2024", description: "RAG 기반 분석", techStack: ["Django", "Celery"] },
  },
  {
    name: "LanguagesSpokenSection",
    Component: LanguagesSpokenSection as unknown as OneToManyCase["Component"],
    addMock: addLanguageSpokenMock,
    updateMock: updateLanguageSpokenMock,
    deleteMock: deleteLanguageSpokenMock,
    existingItem: { uuid: "l-1", language: "영어", level: "비즈니스" },
    itemReadText: /영어/,
    primaryFieldPlaceholder: "언어",
    primaryFieldValue: "일본어",
    expectedAddPayload: { language: "일본어", level: "", displayOrder: 0 },
    expectedUpdatePayload: { language: "일본어", level: "비즈니스" },
  },
];

describe.each(CASES)("$name — 1:N 공통 CRUD", ({
  Component,
  addMock,
  updateMock,
  deleteMock,
  existingItem,
  itemReadText,
  primaryFieldPlaceholder,
  primaryFieldValue,
  expectedAddPayload,
  expectedUpdatePayload,
}) => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveMock.mockImplementation(async (args: { mutator: () => Promise<unknown>; onSuccess?: (v: unknown) => void }) => {
      const r = await args.mutator();
      args.onSuccess?.(r);
    });
    addMock.mockImplementation(async (_uuid: string, payload: Record<string, unknown>) => ({ uuid: "new-1", ...payload }));
    updateMock.mockImplementation(async (_uuid: string, _itemUuid: string, payload: Record<string, unknown>) => ({ uuid: existingItem.uuid, ...payload }));
    deleteMock.mockResolvedValue(undefined);
  });

  it("items=[] + 추가 버튼 → 빈 form 노출 (placeholder 로 식별)", async () => {
    render(<Component resumeUuid="r-1" items={[]} onChange={() => {}} />);

    expect(screen.queryByPlaceholderText(primaryFieldPlaceholder)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /추가/ }));
    expect(screen.getByPlaceholderText(primaryFieldPlaceholder)).toBeInTheDocument();
  });

  it("items=[기존 항목] → read view 에 항목 표시 + 편집/삭제 버튼 존재", () => {
    render(<Component resumeUuid="r-1" items={[existingItem]} onChange={() => {}} />);

    expect(screen.getAllByText(itemReadText).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /편집/ })).toBeInTheDocument();
  });

  it("신규 추가 플로우 → add API + displayOrder=items.length + onChange 로 항목 추가", async () => {
    const onChange = jest.fn();
    render(<Component resumeUuid="r-1" items={[]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /추가/ }));
    const input = screen.getByPlaceholderText(primaryFieldPlaceholder) as HTMLInputElement;
    await userEvent.type(input, primaryFieldValue);

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(addMock).toHaveBeenCalledWith("r-1", expectedAddPayload);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.calls[0][0]).toHaveLength(1);
  });

  it("편집 플로우 → update API + 갱신된 payload + onChange 동기화", async () => {
    const onChange = jest.fn();
    render(<Component resumeUuid="r-1" items={[existingItem]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    const input = screen.getByPlaceholderText(primaryFieldPlaceholder) as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, primaryFieldValue);

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(updateMock).toHaveBeenCalledWith("r-1", existingItem.uuid, expectedUpdatePayload);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  });

  it("삭제 버튼 → delete API + 항목 onChange filter", async () => {
    const onChange = jest.fn();
    render(<Component resumeUuid="r-1" items={[existingItem]} onChange={onChange} />);

    const deleteBtn = screen
      .getAllByRole("button")
      .find((b) => b.className.includes("DC2626"))!;
    await act(async () => {
      await userEvent.click(deleteBtn);
    });

    expect(deleteMock).toHaveBeenCalledWith("r-1", existingItem.uuid);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("추가 form 취소 → API 미호출 + form 닫힘", async () => {
    render(<Component resumeUuid="r-1" items={[]} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: /추가/ }));
    expect(screen.getByPlaceholderText(primaryFieldPlaceholder)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));

    expect(screen.queryByPlaceholderText(primaryFieldPlaceholder)).not.toBeInTheDocument();
    expect(addMock).not.toHaveBeenCalled();
  });
});
