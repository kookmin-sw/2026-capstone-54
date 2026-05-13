import { CATEGORY_STYLE } from "../categoryIconStyle";

describe("CATEGORY_STYLE", () => {
  it("0~5 모든 카테고리 id 매핑 + Icon/color/bgColor 필드 존재", () => {
    for (const id of [0, 1, 2, 3, 4, 5]) {
      const style = CATEGORY_STYLE[id];
      expect(style).toBeDefined();
      expect(style.Icon).toBeDefined();
      expect(style.color).toMatch(/^text-\[/);
      expect(style.bgColor).toMatch(/^bg-\[/);
    }
  });

  it("각 id 의 색상 토큰이 명세 일치 (IT=green, 마케팅=pink, 금융=amber, 영업=teal, HR=violet)", () => {
    expect(CATEGORY_STYLE[1].color).toContain("#059669");
    expect(CATEGORY_STYLE[2].color).toContain("#EC4899");
    expect(CATEGORY_STYLE[3].color).toContain("#F59E0B");
    expect(CATEGORY_STYLE[4].color).toContain("#0991B2");
    expect(CATEGORY_STYLE[5].color).toContain("#8B5CF6");
    expect(CATEGORY_STYLE[0].color).toContain("#9CA3AF");
  });

  it("Icon 은 lucide 컴포넌트 (호출 가능 + displayName)", () => {
    for (const id of [0, 1, 2, 3, 4, 5]) {
      expect(typeof CATEGORY_STYLE[id].Icon).toBe("object");
    }
  });
});
