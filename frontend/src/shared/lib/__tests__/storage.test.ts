import {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
  getCookie,
  setCookie,
  removeCookie,
  shouldShowCoachMarks,
  markCoachMarksShown,
  clearAllCoachMarks,
} from "../storage";

beforeEach(() => {
  window.localStorage.clear();
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
});

describe("getLocalStorageItem", () => {
  it("키 없음 → default 반환", () => {
    expect(getLocalStorageItem("missing", { fallback: true })).toEqual({ fallback: true });
    expect(getLocalStorageItem("missing", 42)).toBe(42);
  });

  it("JSON 직렬화된 객체 → parse 후 반환", () => {
    window.localStorage.setItem("k", JSON.stringify({ a: 1, b: "x" }));
    expect(getLocalStorageItem("k", null)).toEqual({ a: 1, b: "x" });
  });

  it("JSON 파싱 실패 (원본 문자열) → 원본 그대로 반환", () => {
    window.localStorage.setItem("k", "not-json {");
    expect(getLocalStorageItem<string>("k", "default")).toBe("not-json {");
  });

  it("localStorage.getItem 자체가 throw → default + console.warn", () => {
    const spy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    expect(getLocalStorageItem("k", "fallback")).toBe("fallback");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Failed to read"), expect.any(Error));

    spy.mockRestore();
    warn.mockRestore();
  });
});

describe("setLocalStorageItem / removeLocalStorageItem", () => {
  it("string value → 그대로 저장 (JSON.stringify 안 함)", () => {
    setLocalStorageItem("k", "raw-text");
    expect(window.localStorage.getItem("k")).toBe("raw-text");
  });

  it("객체 value → JSON.stringify 후 저장", () => {
    setLocalStorageItem("k", { a: 1 });
    expect(window.localStorage.getItem("k")).toBe('{"a":1}');
  });

  it("number / boolean → JSON 직렬화", () => {
    setLocalStorageItem("n", 42);
    setLocalStorageItem("b", true);
    expect(window.localStorage.getItem("n")).toBe("42");
    expect(window.localStorage.getItem("b")).toBe("true");
  });

  it("setItem throw → console.warn + 예외 외부 전파 안 됨", () => {
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => setLocalStorageItem("k", { x: 1 })).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Failed to write"), expect.any(Error));

    spy.mockRestore();
    warn.mockRestore();
  });

  it("removeLocalStorageItem → 해당 키 제거", () => {
    setLocalStorageItem("k", "v");
    removeLocalStorageItem("k");
    expect(window.localStorage.getItem("k")).toBeNull();
  });
});

describe("getCookie / setCookie / removeCookie", () => {
  it("setCookie + getCookie → 값 round-trip", () => {
    setCookie("session", "abc123");
    expect(getCookie("session")).toBe("abc123");
  });

  it("getCookie: 없는 키 → null", () => {
    expect(getCookie("no-such")).toBeNull();
  });

  it("setCookie + days 지정 → expires 헤더 포함", () => {
    setCookie("token", "x", 7);
    expect(document.cookie).toContain("token=x");
  });

  it("setCookie + days=null → expires 없음 (세션 쿠키)", () => {
    setCookie("session-only", "v", null);
    expect(getCookie("session-only")).toBe("v");
  });

  it("removeCookie → 동일 이름 cookie 가 빈 값 + 과거 expires 로 무효화", () => {
    setCookie("a", "1");
    expect(getCookie("a")).toBe("1");
    removeCookie("a");
    expect(getCookie("a")).toBeNull();
  });

  it("여러 쿠키 중에서 정확한 이름 매칭 (prefix 충돌 방지)", () => {
    setCookie("token", "real");
    setCookie("token-suffix", "other");
    expect(getCookie("token")).toBe("real");
    expect(getCookie("token-suffix")).toBe("other");
  });
});

describe("coachMarks 표시 관리", () => {
  it("lastShown 없음 → shouldShowCoachMarks=true", () => {
    expect(shouldShowCoachMarks("welcome")).toBe(true);
  });

  it("markCoachMarksShown 직후 → shouldShowCoachMarks=false (만료 전)", () => {
    markCoachMarksShown("welcome");
    expect(shouldShowCoachMarks("welcome", 30)).toBe(false);
  });

  it("expirationDays 경과 후 → shouldShowCoachMarks=true", () => {
    const past = Date.now() - 31 * 24 * 60 * 60 * 1000;
    setLocalStorageItem("coachMarks:welcome:lastShown", past);
    expect(shouldShowCoachMarks("welcome", 30)).toBe(true);
  });

  it("clearAllCoachMarks → coachMarks:* prefix 키만 제거, 다른 키 유지", () => {
    setLocalStorageItem("coachMarks:a:lastShown", 1);
    setLocalStorageItem("coachMarks:b:lastShown", 2);
    setLocalStorageItem("other-key", "keep");

    clearAllCoachMarks();

    expect(window.localStorage.getItem("coachMarks:a:lastShown")).toBeNull();
    expect(window.localStorage.getItem("coachMarks:b:lastShown")).toBeNull();
    expect(window.localStorage.getItem("other-key")).toBe("keep");
  });
});
