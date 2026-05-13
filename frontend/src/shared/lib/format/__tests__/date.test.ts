import {
  formatDateShort,
  formatDateTime,
  formatDateTimeFull,
  formatMonthDay,
  formatDateKorean,
  formatRelativeTime,
} from "../date";

const FIXED_DATE = new Date(2024, 2, 5, 14, 30, 9);

describe("formatDateShort", () => {
  it("Date 객체를 'YYYY.MM.DD' 형식으로 변환", () => {
    expect(formatDateShort(FIXED_DATE)).toBe("2024.03.05");
  });

  it("ISO 문자열 입력 지원", () => {
    expect(formatDateShort("2024-03-05T14:30:09")).toMatch(/^2024\.03\.05$/);
  });

  it("Unix timestamp (ms) 입력 지원", () => {
    expect(formatDateShort(FIXED_DATE.getTime())).toBe("2024.03.05");
  });

  it("월/일 < 10 일 때 zero-padding", () => {
    const d = new Date(2025, 0, 1);
    expect(formatDateShort(d)).toBe("2025.01.01");
  });
});

describe("formatDateTime", () => {
  it("'YYYY.MM.DD HH:MM' 형식 반환", () => {
    expect(formatDateTime(FIXED_DATE)).toBe("2024.03.05 14:30");
  });

  it("0시/0분 zero-padding", () => {
    const d = new Date(2024, 2, 5, 0, 5);
    expect(formatDateTime(d)).toBe("2024.03.05 00:05");
  });
});

describe("formatDateTimeFull", () => {
  it("'YYYY.MM.DD HH:MM:SS' 형식 반환", () => {
    expect(formatDateTimeFull(FIXED_DATE)).toBe("2024.03.05 14:30:09");
  });

  it("초 단위 zero-padding", () => {
    const d = new Date(2024, 2, 5, 14, 30, 0);
    expect(formatDateTimeFull(d)).toBe("2024.03.05 14:30:00");
  });
});

describe("formatMonthDay", () => {
  it("'M월 D일' 한국어 형식", () => {
    expect(formatMonthDay(FIXED_DATE)).toBe("3월 5일");
  });

  it("padding 없이 그대로 표시", () => {
    const d = new Date(2024, 0, 1);
    expect(formatMonthDay(d)).toBe("1월 1일");
  });
});

describe("formatDateKorean", () => {
  it("'YYYY년 M월 D일' 한국어 풀 형식", () => {
    expect(formatDateKorean(FIXED_DATE)).toBe("2024년 3월 5일");
  });
});

describe("formatRelativeTime", () => {
  let nowSpy: jest.SpyInstance;
  const FAKE_NOW = new Date(2024, 2, 5, 14, 30, 0).getTime();

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, "now").mockReturnValue(FAKE_NOW);
  });

  afterEach(() => nowSpy.mockRestore());

  it("60초 이내 → '방금 전'", () => {
    expect(formatRelativeTime(FAKE_NOW - 30_000)).toBe("방금 전");
    expect(formatRelativeTime(FAKE_NOW)).toBe("방금 전");
  });

  it("60초~59분 → 'N분 전'", () => {
    expect(formatRelativeTime(FAKE_NOW - 60_000)).toBe("1분 전");
    expect(formatRelativeTime(FAKE_NOW - 30 * 60_000)).toBe("30분 전");
    expect(formatRelativeTime(FAKE_NOW - 59 * 60_000)).toBe("59분 전");
  });

  it("1시간~23시간 → 'N시간 전'", () => {
    expect(formatRelativeTime(FAKE_NOW - 60 * 60_000)).toBe("1시간 전");
    expect(formatRelativeTime(FAKE_NOW - 23 * 60 * 60_000)).toBe("23시간 전");
  });

  it("정확히 24시간 (1일) → '어제'", () => {
    expect(formatRelativeTime(FAKE_NOW - 24 * 60 * 60_000)).toBe("어제");
    expect(formatRelativeTime(FAKE_NOW - 47 * 60 * 60_000)).toBe("어제");
  });

  it("2~29일 → 'N일 전'", () => {
    expect(formatRelativeTime(FAKE_NOW - 2 * 24 * 60 * 60_000)).toBe("2일 전");
    expect(formatRelativeTime(FAKE_NOW - 29 * 24 * 60 * 60_000)).toBe("29일 전");
  });

  it("30일 이상 → formatDateShort 폴백", () => {
    const longAgo = FAKE_NOW - 31 * 24 * 60 * 60_000;
    const result = formatRelativeTime(longAgo);
    expect(result).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
  });
});
