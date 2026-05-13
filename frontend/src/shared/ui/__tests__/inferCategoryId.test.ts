import { inferCategoryId } from "../inferCategoryId";

describe("inferCategoryId — PLATFORM_MAP 매칭 (우선순위)", () => {
  it("platform 에 'IT' / '개발' 포함 → 1 (IT/개발)", () => {
    expect(inferCategoryId("IT 회사", "")).toBe(1);
    expect(inferCategoryId("개발팀", "")).toBe(1);
  });

  it("platform 에 '마케팅' / '광고' → 2 (마케팅)", () => {
    expect(inferCategoryId("디지털 마케팅", "")).toBe(2);
    expect(inferCategoryId("광고대행사", "")).toBe(2);
  });

  it("platform 에 '금융' / '회계' → 3 (금융/회계)", () => {
    expect(inferCategoryId("금융권", "")).toBe(3);
    expect(inferCategoryId("회계법인", "")).toBe(3);
  });

  it("platform 에 '영업' / '서비스' → 4 (영업/서비스)", () => {
    expect(inferCategoryId("영업 채용", "")).toBe(4);
    expect(inferCategoryId("고객 서비스", "")).toBe(4);
  });

  it("platform 에 '인사' / 'HR' → 5 (인사/HR)", () => {
    expect(inferCategoryId("인사담당자", "")).toBe(5);
    expect(inferCategoryId("HR Manager", "")).toBe(5);
  });
});

describe("inferCategoryId — KEYWORD_MAP 매칭 (platform 매칭 실패 시)", () => {
  it("title 에 'frontend' / 'backend' / 'engineer' → 1", () => {
    expect(inferCategoryId("회사", "Frontend Engineer")).toBe(1);
    expect(inferCategoryId("회사", "Backend Developer")).toBe(1);
  });

  it("title 에 'brand' / '콘텐츠' / '디자인' → 2", () => {
    expect(inferCategoryId("회사", "Brand Manager")).toBe(2);
    expect(inferCategoryId("회사", "콘텐츠 디자이너")).toBe(2);
  });

  it("title 에 'toss' / '결제' / 'pay' → 3", () => {
    expect(inferCategoryId("회사", "Toss Pay")).toBe(3);
    expect(inferCategoryId("회사", "결제 시스템")).toBe(3);
  });

  it("title 에 '배달' / '쇼핑' / 'commerce' → 4", () => {
    expect(inferCategoryId("회사", "배달 플랫폼")).toBe(4);
    expect(inferCategoryId("회사", "E-commerce")).toBe(4);
  });

  it("title 에 '채용' / '인사' → 5 (영문 'recruit' 는 'it' substring 충돌로 1 매칭됨)", () => {
    expect(inferCategoryId("기업", "채용 담당")).toBe(5);
    expect(inferCategoryId("기업", "인사 매니저")).toBe(5);
  });

  it("어떤 매핑에도 안 맞으면 0 (기타)", () => {
    expect(inferCategoryId("미스터리", "랜덤한 제목")).toBe(0);
    expect(inferCategoryId("", "")).toBe(0);
  });

  it("대소문자 무시 — toLowerCase 적용 후 매칭", () => {
    expect(inferCategoryId("IT", "")).toBe(1);
    expect(inferCategoryId("회사", "AI ENGINEER")).toBe(1);
  });

  it("platform 매칭이 keyword 매칭보다 우선", () => {
    expect(inferCategoryId("인사", "Frontend Developer")).toBe(5);
  });
});
