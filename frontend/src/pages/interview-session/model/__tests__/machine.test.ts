import {
  initialMachineState,
  machineReducer,
  type MachineEvent,
  type MachinePhase,
  type MachineState,
} from "../machine";

function withPhase(phase: MachinePhase, overrides: Partial<MachineState> = {}): MachineState {
  return { ...initialMachineState, phase, ...overrides };
}

describe("machineReducer — initial state", () => {
  it("초기 상태는 idle + 모든 nullable 필드 null", () => {
    expect(initialMachineState).toEqual({
      phase: "idle",
      isRealMode: false,
      turnId: null,
      question: null,
      countdown: null,
      error: null,
    });
  });
});

describe("machineReducer — 글로벌 이벤트 (모든 phase 에서 동작)", () => {
  const PHASES: MachinePhase[] = [
    "idle", "ready", "starting", "tts_playing", "preparing_record",
    "countdown", "awaiting_start", "speaking", "submitting",
  ];

  it.each(PHASES)("%s 에서 ERROR → error phase + error message", (phase) => {
    const state = withPhase(phase);
    const next = machineReducer(state, { type: "ERROR", message: "권한 거부" });
    expect(next.phase).toBe("error");
    expect(next.error).toBe("권한 거부");
  });

  it.each(PHASES)("%s 에서 FINISH → finished phase + countdown=null", (phase) => {
    const state = withPhase(phase, { countdown: 7 });
    const next = machineReducer(state, { type: "FINISH" });
    expect(next.phase).toBe("finished");
    expect(next.countdown).toBeNull();
  });

  it.each(PHASES)("%s 에서 SET_REAL_MODE → isRealMode 만 업데이트, phase 불변", (phase) => {
    const state = withPhase(phase);
    const next = machineReducer(state, { type: "SET_REAL_MODE", isRealMode: true });
    expect(next.phase).toBe(phase);
    expect(next.isRealMode).toBe(true);
  });
});

describe("machineReducer — idle phase", () => {
  it("MEDIA_READY → ready", () => {
    const next = machineReducer(withPhase("idle"), { type: "MEDIA_READY" });
    expect(next.phase).toBe("ready");
  });

  it("RESUME → tts_playing + turnId/question 설정 (끊긴 세션 복구)", () => {
    const next = machineReducer(withPhase("idle"), {
      type: "RESUME",
      turnId: 42,
      question: "자기소개 부탁드립니다",
    });
    expect(next.phase).toBe("tts_playing");
    expect(next.turnId).toBe(42);
    expect(next.question).toBe("자기소개 부탁드립니다");
  });

  it("관계없는 이벤트는 no-op", () => {
    const state = withPhase("idle");
    const next = machineReducer(state, { type: "SUBMIT" });
    expect(next).toBe(state);
  });
});

describe("machineReducer — ready phase", () => {
  it("START → starting", () => {
    const next = machineReducer(withPhase("ready"), { type: "START" });
    expect(next.phase).toBe("starting");
  });

  it("관계없는 이벤트는 no-op", () => {
    const state = withPhase("ready");
    expect(machineReducer(state, { type: "TTS_DONE" })).toBe(state);
  });
});

describe("machineReducer — starting phase", () => {
  it("QUESTION_ARRIVED → tts_playing + turnId/question", () => {
    const next = machineReducer(withPhase("starting"), {
      type: "QUESTION_ARRIVED",
      turnId: 1,
      question: "첫 질문",
    });
    expect(next.phase).toBe("tts_playing");
    expect(next.turnId).toBe(1);
    expect(next.question).toBe("첫 질문");
  });

  it("관계없는 이벤트는 no-op", () => {
    const state = withPhase("starting");
    expect(machineReducer(state, { type: "TTS_DONE" })).toBe(state);
  });
});

describe("machineReducer — tts_playing phase", () => {
  it("TTS_DONE → preparing_record (turnId/question 유지)", () => {
    const state = withPhase("tts_playing", { turnId: 7, question: "Q" });
    const next = machineReducer(state, { type: "TTS_DONE" });
    expect(next.phase).toBe("preparing_record");
    expect(next.turnId).toBe(7);
    expect(next.question).toBe("Q");
  });

  it("관계없는 이벤트는 no-op", () => {
    const state = withPhase("tts_playing");
    expect(machineReducer(state, { type: "SUBMIT" })).toBe(state);
  });
});

describe("machineReducer — preparing_record phase", () => {
  it("RECORDING_READY (isRealMode=true) → countdown + 5~30 사이 정수", () => {
    let randomCalls = 0;
    const mathRandomSpy = jest.spyOn(Math, "random").mockImplementation(() => {
      randomCalls++;
      return 0.5;
    });

    try {
      const state = withPhase("preparing_record", { isRealMode: true });
      const next = machineReducer(state, { type: "RECORDING_READY" });
      expect(next.phase).toBe("countdown");
      expect(next.countdown).toBe(18);
      expect(randomCalls).toBe(1);
    } finally {
      mathRandomSpy.mockRestore();
    }
  });

  it("countdown 범위는 5~30 사이 정수 (Math.random=0)", () => {
    const spy = jest.spyOn(Math, "random").mockReturnValue(0);
    try {
      const next = machineReducer(
        withPhase("preparing_record", { isRealMode: true }),
        { type: "RECORDING_READY" },
      );
      expect(next.countdown).toBe(5);
    } finally {
      spy.mockRestore();
    }
  });

  it("countdown 범위는 5~30 사이 정수 (Math.random≈1)", () => {
    const spy = jest.spyOn(Math, "random").mockReturnValue(0.9999);
    try {
      const next = machineReducer(
        withPhase("preparing_record", { isRealMode: true }),
        { type: "RECORDING_READY" },
      );
      expect(next.countdown).toBe(30);
    } finally {
      spy.mockRestore();
    }
  });

  it("RECORDING_READY (isRealMode=false) → awaiting_start (countdown 미설정)", () => {
    const state = withPhase("preparing_record", { isRealMode: false });
    const next = machineReducer(state, { type: "RECORDING_READY" });
    expect(next.phase).toBe("awaiting_start");
    expect(next.countdown).toBeNull();
  });

  it("관계없는 이벤트는 no-op", () => {
    const state = withPhase("preparing_record");
    expect(machineReducer(state, { type: "SUBMIT" })).toBe(state);
  });
});

describe("machineReducer — countdown phase", () => {
  it("COUNTDOWN_TICK (next > 0) → decrement, phase 유지", () => {
    const state = withPhase("countdown", { countdown: 5 });
    const next = machineReducer(state, { type: "COUNTDOWN_TICK" });
    expect(next.phase).toBe("countdown");
    expect(next.countdown).toBe(4);
  });

  it("COUNTDOWN_TICK (countdown=1) → speaking + countdown=null", () => {
    const state = withPhase("countdown", { countdown: 1 });
    const next = machineReducer(state, { type: "COUNTDOWN_TICK" });
    expect(next.phase).toBe("speaking");
    expect(next.countdown).toBeNull();
  });

  it("COUNTDOWN_TICK (countdown=null fallback 처리) → speaking", () => {
    const state = withPhase("countdown", { countdown: null });
    const next = machineReducer(state, { type: "COUNTDOWN_TICK" });
    expect(next.phase).toBe("speaking");
  });

  it("관계없는 이벤트는 no-op", () => {
    const state = withPhase("countdown", { countdown: 10 });
    expect(machineReducer(state, { type: "TTS_DONE" })).toBe(state);
  });
});

describe("machineReducer — awaiting_start phase", () => {
  it("PRACTICE_START → speaking", () => {
    const next = machineReducer(withPhase("awaiting_start"), { type: "PRACTICE_START" });
    expect(next.phase).toBe("speaking");
  });

  it("관계없는 이벤트는 no-op", () => {
    const state = withPhase("awaiting_start");
    expect(machineReducer(state, { type: "COUNTDOWN_TICK" })).toBe(state);
  });
});

describe("machineReducer — speaking phase", () => {
  it("SUBMIT → submitting", () => {
    const next = machineReducer(withPhase("speaking"), { type: "SUBMIT" });
    expect(next.phase).toBe("submitting");
  });

  it("관계없는 이벤트는 no-op", () => {
    const state = withPhase("speaking");
    expect(machineReducer(state, { type: "TTS_DONE" })).toBe(state);
  });
});

describe("machineReducer — submitting phase", () => {
  it("ANSWER_ACCEPTED → tts_playing + 다음 turn 정보", () => {
    const state = withPhase("submitting", { turnId: 1, question: "이전 질문" });
    const next = machineReducer(state, {
      type: "ANSWER_ACCEPTED",
      nextTurnId: 2,
      nextQuestion: "다음 질문",
    });
    expect(next.phase).toBe("tts_playing");
    expect(next.turnId).toBe(2);
    expect(next.question).toBe("다음 질문");
  });

  it("관계없는 이벤트는 no-op", () => {
    const state = withPhase("submitting");
    expect(machineReducer(state, { type: "SUBMIT" })).toBe(state);
  });
});

describe("machineReducer — terminal phases (finished / error)", () => {
  it("finished 에서는 모든 이벤트가 no-op (FINISH/ERROR/SET_REAL_MODE 제외)", () => {
    const state = withPhase("finished");
    expect(machineReducer(state, { type: "SUBMIT" })).toBe(state);
    expect(machineReducer(state, { type: "MEDIA_READY" })).toBe(state);
    expect(machineReducer(state, { type: "START" })).toBe(state);
  });

  it("error 에서는 모든 이벤트가 no-op (FINISH/ERROR/SET_REAL_MODE 제외)", () => {
    const state = withPhase("error", { error: "previous error" });
    expect(machineReducer(state, { type: "SUBMIT" })).toBe(state);
    expect(machineReducer(state, { type: "START" })).toBe(state);
  });

  it("error 에서 또 다른 ERROR → 새 메시지로 덮어쓰기", () => {
    const state = withPhase("error", { error: "old" });
    const next = machineReducer(state, { type: "ERROR", message: "new" });
    expect(next.error).toBe("new");
  });
});

describe("machineReducer — 전체 happy path 시나리오", () => {
  it("FOLLOWUP PRACTICE 모드: idle → ready → starting → tts_playing → preparing_record → awaiting_start → speaking → submitting → tts_playing (loop) → finished", () => {
    let state = initialMachineState;

    state = machineReducer(state, { type: "MEDIA_READY" });
    expect(state.phase).toBe("ready");

    state = machineReducer(state, { type: "START" });
    expect(state.phase).toBe("starting");

    state = machineReducer(state, { type: "QUESTION_ARRIVED", turnId: 1, question: "Q1" });
    expect(state.phase).toBe("tts_playing");

    state = machineReducer(state, { type: "TTS_DONE" });
    expect(state.phase).toBe("preparing_record");

    state = machineReducer(state, { type: "RECORDING_READY" });
    expect(state.phase).toBe("awaiting_start");

    state = machineReducer(state, { type: "PRACTICE_START" });
    expect(state.phase).toBe("speaking");

    state = machineReducer(state, { type: "SUBMIT" });
    expect(state.phase).toBe("submitting");

    state = machineReducer(state, { type: "ANSWER_ACCEPTED", nextTurnId: 2, nextQuestion: "Q2" });
    expect(state.phase).toBe("tts_playing");
    expect(state.turnId).toBe(2);

    state = machineReducer(state, { type: "FINISH" });
    expect(state.phase).toBe("finished");
  });

  it("REAL 모드: preparing_record → countdown → 카운트다운 감소 → speaking", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.1);
    try {
      let state = withPhase("preparing_record", { isRealMode: true });

      state = machineReducer(state, { type: "RECORDING_READY" });
      expect(state.phase).toBe("countdown");
      expect(state.countdown).toBe(7);

      for (let i = 0; i < 6; i++) {
        state = machineReducer(state, { type: "COUNTDOWN_TICK" });
        expect(state.phase).toBe("countdown");
      }
      expect(state.countdown).toBe(1);

      state = machineReducer(state, { type: "COUNTDOWN_TICK" });
      expect(state.phase).toBe("speaking");
      expect(state.countdown).toBeNull();
    } finally {
      jest.spyOn(Math, "random").mockRestore();
    }
  });

  it("끊긴 세션 복구: idle + RESUME → tts_playing 직행 (ready 단계 건너뜀)", () => {
    let state = initialMachineState;
    state = machineReducer(state, { type: "RESUME", turnId: 5, question: "복구된 질문" });
    expect(state.phase).toBe("tts_playing");
    expect(state.turnId).toBe(5);

    state = machineReducer(state, { type: "TTS_DONE" });
    expect(state.phase).toBe("preparing_record");
  });

  it("에러 발생 시 어떤 phase 에서도 error 로 전이", () => {
    const phases: MachinePhase[] = ["speaking", "submitting", "countdown", "tts_playing"];
    phases.forEach((phase) => {
      const next = machineReducer(withPhase(phase), { type: "ERROR", message: "치명적" });
      expect(next.phase).toBe("error");
      expect(next.error).toBe("치명적");
    });
  });
});

describe("machineReducer — immutability + identity", () => {
  it("no-op 이벤트는 reference equality 유지 (=== 비교 가능)", () => {
    const state = withPhase("ready");
    const next = machineReducer(state, { type: "TTS_DONE" });
    expect(next).toBe(state);
  });

  it("실제 전이는 새 객체 생성 (reference 다름)", () => {
    const state = withPhase("ready");
    const next = machineReducer(state, { type: "START" });
    expect(next).not.toBe(state);
  });

  it("SET_REAL_MODE 는 phase 미변경이지만 새 객체 생성", () => {
    const state = withPhase("ready", { isRealMode: false });
    const next = machineReducer(state, { type: "SET_REAL_MODE", isRealMode: true });
    expect(next).not.toBe(state);
    expect(next.phase).toBe(state.phase);
    expect(next.isRealMode).toBe(true);
  });
});

describe("machineReducer — event 데이터 보존", () => {
  it("RESUME 시 기존 isRealMode 유지", () => {
    const state = withPhase("idle", { isRealMode: true });
    const next = machineReducer(state, { type: "RESUME", turnId: 1, question: "q" });
    expect(next.isRealMode).toBe(true);
  });

  it("ANSWER_ACCEPTED 시 isRealMode 유지", () => {
    const state = withPhase("submitting", { isRealMode: true });
    const next = machineReducer(state, { type: "ANSWER_ACCEPTED", nextTurnId: 2, nextQuestion: "q2" });
    expect(next.isRealMode).toBe(true);
  });

  it("ERROR 시 turnId / question 유지 (디버깅용)", () => {
    const state = withPhase("speaking", { turnId: 3, question: "Q" });
    const next = machineReducer(state, { type: "ERROR", message: "err" });
    expect(next.turnId).toBe(3);
    expect(next.question).toBe("Q");
  });
});

function _typeCheck(event: MachineEvent): void {
  void event;
}
_typeCheck({ type: "MEDIA_READY" });
