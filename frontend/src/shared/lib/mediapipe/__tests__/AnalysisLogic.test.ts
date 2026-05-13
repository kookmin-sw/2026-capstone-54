import { checkBehavioralFlags } from "../AnalysisLogic";
import type { FaceLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

function makeLandmark(x: number, y = 0, z = 0): NormalizedLandmark {
  return { x, y, z } as unknown as NormalizedLandmark;
}

function makeLandmarksAt(rightIrisX: number, leftIrisX: number): NormalizedLandmark[] {
  const arr: NormalizedLandmark[] = Array(500)
    .fill(null)
    .map(() => makeLandmark(0));
  arr[33] = makeLandmark(0);
  arr[133] = makeLandmark(1);
  arr[468] = makeLandmark(rightIrisX);
  arr[362] = makeLandmark(0);
  arr[263] = makeLandmark(1);
  arr[473] = makeLandmark(leftIrisX);
  return arr;
}

function identityMatrix(): number[] {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function makeResult(opts: { landmarks?: NormalizedLandmark[]; matrix?: number[] } = {}): FaceLandmarkerResult {
  return {
    faceLandmarks: opts.landmarks ? [opts.landmarks] : [],
    facialTransformationMatrixes: opts.matrix
      ? [{ data: opts.matrix, columns: 4, rows: 4 } as unknown as { data: number[]; columns: number; rows: number }]
      : [],
  } as unknown as FaceLandmarkerResult;
}

describe("checkBehavioralFlags", () => {
  it("얼굴 미감지 → 모든 flag false + details=null", () => {
    expect(checkBehavioralFlags(makeResult())).toEqual({
      lookingAway: false,
      headTurned: false,
      details: null,
    });
  });

  it("정면 시선 (iris 0.5) + identity 매트릭스 → lookingAway/headTurned=false", () => {
    const result = checkBehavioralFlags(
      makeResult({ landmarks: makeLandmarksAt(0.5, 0.5), matrix: identityMatrix() }),
    );
    expect(result.lookingAway).toBe(false);
    expect(result.headTurned).toBe(false);
    expect(result.details).toEqual({ gazeDetails: "", headDetails: "" });
  });

  it("right eye iris < 0.35 → lookingAway=true + gazeDetails 메시지", () => {
    const result = checkBehavioralFlags(
      makeResult({ landmarks: makeLandmarksAt(0.2, 0.5), matrix: identityMatrix() }),
    );
    expect(result.lookingAway).toBe(true);
    expect(result.details?.gazeDetails).toContain("시선 이탈");
  });

  it("left eye iris > 0.65 → lookingAway=true", () => {
    const result = checkBehavioralFlags(
      makeResult({ landmarks: makeLandmarksAt(0.5, 0.8), matrix: identityMatrix() }),
    );
    expect(result.lookingAway).toBe(true);
  });

  it("fullDist=0 (inner==outer) → ratio=0.5 fallback → 정상 처리", () => {
    const arr = makeLandmarksAt(0.5, 0.5);
    arr[33] = makeLandmark(0.5);
    arr[133] = makeLandmark(0.5);
    arr[468] = makeLandmark(0.5);
    const result = checkBehavioralFlags(makeResult({ landmarks: arr, matrix: identityMatrix() }));
    expect(result.lookingAway).toBe(false);
  });

  it("yaw 큰 회전 매트릭스 → headTurned=true + headDetails 메시지", () => {
    const yawMatrix = [
      0, 0, 1, 0,
      0, 1, 0, 0,
      -1, 0, 0, 0,
      0, 0, 0, 1,
    ];
    const result = checkBehavioralFlags(
      makeResult({ landmarks: makeLandmarksAt(0.5, 0.5), matrix: yawMatrix }),
    );
    expect(result.headTurned).toBe(true);
    expect(result.details?.headDetails).toContain("Yaw");
  });

  it("matrix length !== 16 → headTurned=false (가드)", () => {
    const result = checkBehavioralFlags(
      makeResult({ landmarks: makeLandmarksAt(0.5, 0.5), matrix: [1, 0] }),
    );
    expect(result.headTurned).toBe(false);
  });

  it("matrix 없음 (matrices 빈 배열) → headTurned=false", () => {
    const result = checkBehavioralFlags(
      makeResult({ landmarks: makeLandmarksAt(0.5, 0.5) }),
    );
    expect(result.headTurned).toBe(false);
  });
});
