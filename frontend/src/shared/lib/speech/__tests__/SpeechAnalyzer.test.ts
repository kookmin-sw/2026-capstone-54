import { SpeechAnalyzer } from "../SpeechAnalyzer";

describe("SpeechAnalyzer — isListening=false 초기 상태", () => {
  it("isListening=false → 모든 메트릭 0 / state 리셋", () => {
    const a = new SpeechAnalyzer();
    a.analyze("이전 데이터", "ko-KR", true);
    const m = a.analyze("", "ko-KR", false);

    expect(m).toEqual({
      wpm: 0,
      fillerCount: 0,
      badWordCount: 0,
      pauseWarnings: 0,
      highlightedHtml: "",
      speechRateSps: 0,
      pillarWordCounts: {},
      syllableCount: 0,
      durationSeconds: 0,
    });
  });

  it("isListening=false 의 highlightedHtml 는 입력 transcript 그대로", () => {
    const a = new SpeechAnalyzer();
    const m = a.analyze("입력 텍스트", "ko-KR", false);
    expect(m.highlightedHtml).toBe("입력 텍스트");
  });
});

describe("SpeechAnalyzer — 한국어 분석", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-05-15T10:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("한국어 syllableCount = 공백 제외 글자 수", () => {
    const a = new SpeechAnalyzer();
    const m = a.analyze("안녕 하세요", "ko-KR", true);
    expect(m.syllableCount).toBe(5);
  });

  it("filler '음', '어' → fillerCount + filler-word HTML span", () => {
    const a = new SpeechAnalyzer();
    const m = a.analyze("음 어 좋은 질문", "ko-KR", true);
    expect(m.fillerCount).toBe(2);
    expect(m.highlightedHtml).toContain('<span class="filler-word">음</span>');
    expect(m.highlightedHtml).toContain('<span class="filler-word">어</span>');
  });

  it("filler stretched '어어' / habitual '근데' → fillerCount 증가", () => {
    const a = new SpeechAnalyzer();
    const m = a.analyze("어어 근데 약간 그러니까", "ko-KR", true);
    expect(m.fillerCount).toBeGreaterThanOrEqual(4);
    expect(m.pillarWordCounts["근데"]).toBe(1);
    expect(m.pillarWordCounts["약간"]).toBe(1);
  });

  it("한국어 욕설 → badWordCount + bad-word HTML span", () => {
    const a = new SpeechAnalyzer();
    const m = a.analyze("씨발 별로네", "ko-KR", true);
    expect(m.badWordCount).toBe(1);
    expect(m.highlightedHtml).toContain('<span class="bad-word">씨발</span>');
  });

  it("filler 가 한글로 둘러싸이면 lookbehind/lookahead 로 제외", () => {
    const a = new SpeechAnalyzer();
    const m = a.analyze("음표가 좋아요", "ko-KR", true);
    expect(m.fillerCount).toBe(0);
  });
});

describe("SpeechAnalyzer — 영어 분석", () => {
  it("영어 syllableCount = 단어 수 (split by whitespace)", () => {
    const a = new SpeechAnalyzer();
    const m = a.analyze("Hello world here", "en-US", true);
    expect(m.syllableCount).toBe(3);
  });

  it("영어 filler 'um', 'you know' → 매칭", () => {
    const a = new SpeechAnalyzer();
    const m = a.analyze("Um, you know, this is good", "en-US", true);
    expect(m.fillerCount).toBeGreaterThanOrEqual(2);
  });

  it("영어 욕설 → badWordCount 증가", () => {
    const a = new SpeechAnalyzer();
    const m = a.analyze("This is shit", "en-US", true);
    expect(m.badWordCount).toBe(1);
  });
});

describe("SpeechAnalyzer — wpm / pause 측정", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-05-15T10:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("60 초 동안 60 음절 → 약 60 wpm + speechRateSps=1", () => {
    const a = new SpeechAnalyzer();
    a.analyze("a", "ko-KR", true);

    jest.setSystemTime(new Date("2025-05-15T10:01:00Z"));
    const m = a.analyze("a".repeat(60), "ko-KR", true);

    expect(m.wpm).toBe(60);
    expect(m.speechRateSps).toBeCloseTo(1);
    expect(m.durationSeconds).toBeCloseTo(60);
  });

  it("같은 transcript + 2 초 경과 → pauseCount 증가", () => {
    const a = new SpeechAnalyzer();
    a.analyze("hello", "ko-KR", true);

    jest.setSystemTime(new Date("2025-05-15T10:00:03Z"));
    const m = a.analyze("hello", "ko-KR", true);

    expect(m.pauseWarnings).toBe(1);
  });

  it("transcript 변경 시 isCurrentlyPaused=false 로 리셋", () => {
    const a = new SpeechAnalyzer();
    a.analyze("hello", "ko-KR", true);

    jest.setSystemTime(new Date("2025-05-15T10:00:03Z"));
    a.analyze("hello", "ko-KR", true);

    jest.setSystemTime(new Date("2025-05-15T10:00:05Z"));
    a.analyze("hello world", "ko-KR", true);

    jest.setSystemTime(new Date("2025-05-15T10:00:08Z"));
    const m = a.analyze("hello world", "ko-KR", true);

    expect(m.pauseWarnings).toBe(2);
  });
});

describe("SpeechAnalyzer — reset", () => {
  it("reset() → 다음 analyze 가 새 startTime 으로 시작", () => {
    const a = new SpeechAnalyzer();
    a.analyze("hello", "ko-KR", true);
    a.reset();

    const m = a.analyze("a", "ko-KR", true);
    expect(m.durationSeconds).toBeCloseTo(0);
  });
});
