// Mock Analyzing API

export type StepStatus = "pending" | "active" | "done";

export interface AnalysisStep {
  key: string;
  label: string;
  status: StepStatus;
}

export interface AnalysisStatusResponse {
  progress: number;
  steps: AnalysisStep[];
  isComplete: boolean;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STEP_SEQUENCE: { key: string; label: string; duration: number }[] = [
  { key: "url",       label: "URL 확인",    duration: 800 },
  { key: "fetch",     label: "페이지 수집",  duration: 1200 },
  { key: "parse",     label: "텍스트 파싱",  duration: 1400 },
  { key: "embed",     label: "임베딩 저장",  duration: 1100 },
  { key: "questions", label: "질문 준비",    duration: 1000 },
];

// 분석 진행 시뮬레이션 — 콜백으로 단계별 상태 전달
export async function runAnalysisApi(
  onStep: (steps: AnalysisStep[], progress: number) => void,
  onComplete: () => void
): Promise<void> {
  const steps: AnalysisStep[] = STEP_SEQUENCE.map((s) => ({
    key: s.key,
    label: s.label,
    status: "pending",
  }));

  for (let i = 0; i < STEP_SEQUENCE.length; i++) {
    // 현재 단계 active
    steps[i] = { ...steps[i], status: "active" };
    const progress = Math.round((i / STEP_SEQUENCE.length) * 85) + 5;
    onStep([...steps], progress);

    await delay(STEP_SEQUENCE[i].duration);

    // 현재 단계 done
    steps[i] = { ...steps[i], status: "done" };
    const afterProgress = Math.round(((i + 1) / STEP_SEQUENCE.length) * 90) + 5;
    onStep([...steps], afterProgress);
  }

  onStep([...steps], 100);
  await delay(400);
  onComplete();
}
