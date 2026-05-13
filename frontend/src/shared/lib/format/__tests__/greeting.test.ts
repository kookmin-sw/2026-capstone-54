import { getTimeBasedGreeting } from "../greeting";

function dateAt(hour: number): Date {
  const d = new Date("2025-05-12T00:00:00Z");
  d.setHours(hour, 0, 0, 0);
  return d;
}

describe("getTimeBasedGreeting", () => {
  it("05:00 ~ 11:59 → 'Good morning ☀️'", () => {
    expect(getTimeBasedGreeting(dateAt(5))).toBe("Good morning ☀️");
    expect(getTimeBasedGreeting(dateAt(8))).toBe("Good morning ☀️");
    expect(getTimeBasedGreeting(dateAt(11))).toBe("Good morning ☀️");
  });

  it("12:00 ~ 17:59 → 'Good afternoon 🌤️'", () => {
    expect(getTimeBasedGreeting(dateAt(12))).toBe("Good afternoon 🌤️");
    expect(getTimeBasedGreeting(dateAt(14))).toBe("Good afternoon 🌤️");
    expect(getTimeBasedGreeting(dateAt(17))).toBe("Good afternoon 🌤️");
  });

  it("18:00 ~ 20:59 → 'Good evening 🌆'", () => {
    expect(getTimeBasedGreeting(dateAt(18))).toBe("Good evening 🌆");
    expect(getTimeBasedGreeting(dateAt(20))).toBe("Good evening 🌆");
  });

  it("21:00 ~ 04:59 → 'Good night 🌙'", () => {
    expect(getTimeBasedGreeting(dateAt(21))).toBe("Good night 🌙");
    expect(getTimeBasedGreeting(dateAt(23))).toBe("Good night 🌙");
    expect(getTimeBasedGreeting(dateAt(0))).toBe("Good night 🌙");
    expect(getTimeBasedGreeting(dateAt(4))).toBe("Good night 🌙");
  });

  it("argument 미지정 → new Date() 사용 (런타임에 분기 반환)", () => {
    const result = getTimeBasedGreeting();
    expect(["Good morning ☀️", "Good afternoon 🌤️", "Good evening 🌆", "Good night 🌙"]).toContain(result);
  });

  it("경계값 (정시) 검증: 5/12/18/21 시작 시각에 새 분기 진입", () => {
    expect(getTimeBasedGreeting(dateAt(4))).toBe("Good night 🌙");
    expect(getTimeBasedGreeting(dateAt(5))).toBe("Good morning ☀️");
    expect(getTimeBasedGreeting(dateAt(11))).toBe("Good morning ☀️");
    expect(getTimeBasedGreeting(dateAt(12))).toBe("Good afternoon 🌤️");
    expect(getTimeBasedGreeting(dateAt(17))).toBe("Good afternoon 🌤️");
    expect(getTimeBasedGreeting(dateAt(18))).toBe("Good evening 🌆");
    expect(getTimeBasedGreeting(dateAt(20))).toBe("Good evening 🌆");
    expect(getTimeBasedGreeting(dateAt(21))).toBe("Good night 🌙");
  });
});
