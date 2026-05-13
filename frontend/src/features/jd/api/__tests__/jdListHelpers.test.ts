import {
  getCompanyInitial,
  getCompanyColor,
  getTagColor,
  getRelativeTime,
} from "../jdListHelpers";

describe("getCompanyInitial", () => {
  it("회사 이름의 첫 글자 반환", () => {
    expect(getCompanyInitial("카카오")).toBe("카");
    expect(getCompanyInitial("Toss")).toBe("T");
  });

  it("빈 문자열 → 빈 문자열 반환", () => {
    expect(getCompanyInitial("")).toBe("");
  });
});

describe("getCompanyColor", () => {
  it("같은 이름 → 동일한 그라데이션 반환 (해시 결정성)", () => {
    expect(getCompanyColor("Acme")).toBe(getCompanyColor("Acme"));
  });

  it("결과는 항상 linear-gradient 형식", () => {
    expect(getCompanyColor("Acme")).toMatch(/^linear-gradient\(135deg,/);
  });

  it("여러 회사 이름 → 8 팔레트 안에서 다양한 결과", () => {
    const palettes = new Set<string>();
    for (let i = 0; i < 30; i++) {
      palettes.add(getCompanyColor(`회사-${i}`));
    }
    expect(palettes.size).toBeGreaterThan(1);
  });

  it("빈 문자열 → 0 인덱스 팔레트 반환 (안전)", () => {
    expect(getCompanyColor("")).toMatch(/^linear-gradient/);
  });
});

describe("getTagColor", () => {
  it("'spring' / 'python' / 'airflow' → green", () => {
    expect(getTagColor("Spring Boot")).toBe("green");
    expect(getTagColor("Python")).toBe("green");
    expect(getTagColor("Airflow")).toBe("green");
  });

  it("'java' / 'typescript' / 'spark' / 'aws' → blue", () => {
    expect(getTagColor("Java")).toBe("blue");
    expect(getTagColor("TypeScript")).toBe("blue");
    expect(getTagColor("Spark")).toBe("blue");
    expect(getTagColor("AWS")).toBe("blue");
  });

  it("'android' / 'ios' → pink", () => {
    expect(getTagColor("Android")).toBe("pink");
    expect(getTagColor("iOS")).toBe("pink");
  });

  it("매칭 안 되는 태그 → default", () => {
    expect(getTagColor("rust")).toBe("default");
    expect(getTagColor("")).toBe("default");
  });

  it("대소문자 무시 (toLowerCase 적용)", () => {
    expect(getTagColor("PYTHON")).toBe("green");
    expect(getTagColor("Aws")).toBe("blue");
  });

  it("substring 매칭: 'springframework' → green", () => {
    expect(getTagColor("springframework")).toBe("green");
  });
});

describe("getRelativeTime", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-05-15T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("잘못된 날짜 문자열 → '날짜 정보 없음'", () => {
    expect(getRelativeTime("not-a-date")).toBe("날짜 정보 없음");
  });

  it("1 분 미만 → '방금 전 등록'", () => {
    const now = new Date("2025-05-15T11:59:30Z").toISOString();
    expect(getRelativeTime(now)).toBe("방금 전 등록");
  });

  it("1 분 이상 1 시간 미만 → '0시간 전' (TIME_UNITS 분 단위 분기 실제 동작)", () => {
    const fiveMinAgo = new Date("2025-05-15T11:55:00Z").toISOString();
    expect(getRelativeTime(fiveMinAgo)).toBe("0시간 전");
  });

  it("1 시간 이상 1 일 미만 → '0일 전' (TIME_UNITS 시간 단위 분기 실제 동작)", () => {
    const twoHoursAgo = new Date("2025-05-15T10:00:00Z").toISOString();
    expect(getRelativeTime(twoHoursAgo)).toBe("0일 전");
  });

  it("25 시간 이상 7 일 미만 → '<N>일 전'", () => {
    const threeDaysAgo = new Date("2025-05-12T12:00:00Z").toISOString();
    expect(getRelativeTime(threeDaysAgo)).toBe("3일 전");
  });

  it("1 ~ 3 주 → '<N>주 전'", () => {
    const twoWeeksAgo = new Date("2025-05-01T12:00:00Z").toISOString();
    expect(getRelativeTime(twoWeeksAgo)).toBe("2주 전");
  });

  it("28 일 이상 → '<N>개월 전'", () => {
    const twoMonthsAgo = new Date("2025-03-15T12:00:00Z").toISOString();
    expect(getRelativeTime(twoMonthsAgo)).toBe("2개월 전");
  });
});
