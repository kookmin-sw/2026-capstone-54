import { buildSummary } from "../buildSummary";

const JD_LIST = [
  { uuid: "j1", company: "Acme", role: "Backend", stage: "1차" },
  { uuid: "j2", company: "Toss", role: "Frontend", stage: "최종" },
];

describe("buildSummary", () => {
  it("selectedJdId=null → 모든 jd 필드 '—'", () => {
    const summary = buildSummary({
      jdList: JD_LIST,
      selectedJdId: null,
      interviewMode: "tail",
      practiceMode: "practice",
      interviewDifficultyLevel: "normal",
    });
    expect(summary.company).toBe("—");
    expect(summary.role).toBe("—");
    expect(summary.stage).toBe("—");
  });

  it("selectedJdId 매칭 → company/role/stage 채움", () => {
    const summary = buildSummary({
      jdList: JD_LIST,
      selectedJdId: "j2",
      interviewMode: "tail",
      practiceMode: "practice",
      interviewDifficultyLevel: "normal",
    });
    expect(summary.company).toBe("Toss");
    expect(summary.role).toBe("Frontend");
    expect(summary.stage).toBe("최종");
  });

  it("selectedJdId 가 jdList 에 없음 → '—' fallback", () => {
    const summary = buildSummary({
      jdList: JD_LIST,
      selectedJdId: "missing",
      interviewMode: "tail",
      practiceMode: "practice",
      interviewDifficultyLevel: "normal",
    });
    expect(summary.company).toBe("—");
  });

  it("interviewMode='tail' → '꼬리질문 방식', 'full' → '전체 프로세스'", () => {
    expect(
      buildSummary({
        jdList: [],
        selectedJdId: null,
        interviewMode: "tail",
        practiceMode: "practice",
        interviewDifficultyLevel: "normal",
      }).interviewModeLabel,
    ).toBe("꼬리질문 방식");

    expect(
      buildSummary({
        jdList: [],
        selectedJdId: null,
        interviewMode: "full" as unknown as Parameters<typeof buildSummary>[0]["interviewMode"],
        practiceMode: "practice",
        interviewDifficultyLevel: "normal",
      }).interviewModeLabel,
    ).toBe("전체 프로세스");
  });

  it("practiceMode='practice' → '연습 모드', 'real' → '실전 모드'", () => {
    expect(
      buildSummary({
        jdList: [],
        selectedJdId: null,
        interviewMode: "tail",
        practiceMode: "practice",
        interviewDifficultyLevel: "normal",
      }).practiceModeLabel,
    ).toBe("연습 모드");

    expect(
      buildSummary({
        jdList: [],
        selectedJdId: null,
        interviewMode: "tail",
        practiceMode: "real" as unknown as Parameters<typeof buildSummary>[0]["practiceMode"],
        interviewDifficultyLevel: "normal",
      }).practiceModeLabel,
    ).toBe("실전 모드");
  });

  it("DIFFICULTY_LABELS 3종 매핑 (friendly/normal/pressure)", () => {
    const make = (lvl: string) =>
      buildSummary({
        jdList: [],
        selectedJdId: null,
        interviewMode: "tail",
        practiceMode: "practice",
        interviewDifficultyLevel: lvl as Parameters<typeof buildSummary>[0]["interviewDifficultyLevel"],
      }).difficultyLabel;

    expect(make("friendly")).toBe("친근한 면접관");
    expect(make("normal")).toBe("일반 면접관");
    expect(make("pressure")).toBe("압박 면접관");
  });

  it("알 수 없는 difficulty → '일반 면접관' fallback", () => {
    expect(
      buildSummary({
        jdList: [],
        selectedJdId: null,
        interviewMode: "tail",
        practiceMode: "practice",
        interviewDifficultyLevel: "unknown" as Parameters<typeof buildSummary>[0]["interviewDifficultyLevel"],
      }).difficultyLabel,
    ).toBe("일반 면접관");
  });
});
