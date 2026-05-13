import { validatePassword, PASSWORD_CHECKS } from "../validatePassword";

describe("validatePassword", () => {
  it("8자 미만 → '8자 이상이어야 합니다.'", () => {
    expect(validatePassword("")).toBe("비밀번호는 8자 이상이어야 합니다.");
    expect(validatePassword("Aa1!")).toBe("비밀번호는 8자 이상이어야 합니다.");
  });

  it("8자 이상 + 대문자 없음 → '대문자를 포함해야'", () => {
    expect(validatePassword("abcd1234!")).toBe("비밀번호에 대문자를 포함해야 합니다.");
  });

  it("대문자 있음 + 소문자 없음 → '소문자를 포함해야'", () => {
    expect(validatePassword("ABCD1234!")).toBe("비밀번호에 소문자를 포함해야 합니다.");
  });

  it("대/소문자 있음 + 숫자 없음 → '숫자를 포함해야'", () => {
    expect(validatePassword("Abcdefgh!")).toBe("비밀번호에 숫자를 포함해야 합니다.");
  });

  it("대/소문자 + 숫자 있음 + 특수문자 없음 → '특수문자를 포함해야'", () => {
    expect(validatePassword("Abcd1234")).toBe("비밀번호에 특수문자를 포함해야 합니다.");
  });

  it("모든 조건 만족 → null", () => {
    expect(validatePassword("Abcd1234!")).toBeNull();
    expect(validatePassword("Strong-Pass1?")).toBeNull();
  });

  it("위반 우선순위: 길이 → 대문자 → 소문자 → 숫자 → 특수문자 순서 적용", () => {
    expect(validatePassword("abc")).toMatch(/8자 이상/);
    expect(validatePassword("abcdefgh")).toMatch(/대문자/);
    expect(validatePassword("ABCDEFGH")).toMatch(/소문자/);
    expect(validatePassword("Abcdefgh")).toMatch(/숫자/);
    expect(validatePassword("Abcdefg1")).toMatch(/특수문자/);
  });
});

describe("PASSWORD_CHECKS — UI checklist 동기화", () => {
  it("5 개 체크 항목 + 각 test 함수 동작", () => {
    expect(PASSWORD_CHECKS).toHaveLength(5);

    const goodPw = "Abcd1234!";
    PASSWORD_CHECKS.forEach((check) => {
      expect(check.test(goodPw)).toBe(true);
    });

    const badPw = "";
    PASSWORD_CHECKS.forEach((check) => {
      expect(check.test(badPw)).toBe(false);
    });
  });

  it("각 check.label 이 정의되어 있음 (UI 렌더 안전)", () => {
    PASSWORD_CHECKS.forEach((check) => {
      expect(check.label).toBeTruthy();
      expect(typeof check.test).toBe("function");
    });
  });
});
