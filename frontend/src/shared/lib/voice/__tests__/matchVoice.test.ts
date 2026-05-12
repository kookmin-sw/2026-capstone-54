import { checkSttMatch } from "../matchVoice";

describe("checkSttMatch", () => {
  it("빈 문자열 → 'empty'", () => {
    expect(checkSttMatch("")).toBe("empty");
  });

  it("공백/구두점만 → normalize 후 빈 문자열 → 'empty'", () => {
    expect(checkSttMatch(" , . ")).toBe("empty");
  });

  it("기대 문장 정확히 발화 → 'match'", () => {
    expect(checkSttMatch("안녕하세요 저는 지원자입니다")).toBe("match");
  });

  it("기대 문장 구두점 포함 → 'match' (normalize 가 ,/./공백 제거)", () => {
    expect(checkSttMatch("안녕하세요, 저는, 지원자입니다.")).toBe("match");
  });

  it("절반 이상 일치 → 'match' (threshold 50%)", () => {
    expect(checkSttMatch("안녕하세요 저는")).toBe("match");
  });

  it("일부만 일치 (50% 미만) → 'mismatch'", () => {
    expect(checkSttMatch("안녕")).toBe("mismatch");
  });

  it("완전히 다른 문장 → 'mismatch'", () => {
    expect(checkSttMatch("오늘 날씨가 좋네요")).toBe("mismatch");
  });

  it("대문자 영문 (case-insensitive 적용) → normalize 후 비교", () => {
    expect(checkSttMatch("HELLO")).toBe("mismatch");
  });
});
