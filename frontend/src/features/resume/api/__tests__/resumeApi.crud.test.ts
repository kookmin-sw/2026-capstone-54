jest.mock("@/shared/api/client", () => ({
  apiRequest: jest.fn(),
  BASE_URL: "https://api.test.example",
  getAccessToken: jest.fn(() => null),
}));

import { apiRequest } from "@/shared/api/client";
import { resumeApi } from "../resumeApi";
import type { ParsedData } from "../types";

const mockApiRequest = apiRequest as jest.Mock;

const FAKE_DETAIL = { uuid: "r-1", title: "내 이력서" };

function partial(p: Record<string, unknown>): Partial<ParsedData> {
  return p as unknown as Partial<ParsedData>;
}

describe("resumeApi — list / retrieve / remove", () => {
  beforeEach(() => jest.clearAllMocks());

  it("list() — 기본 page=1 + auth=true", () => {
    mockApiRequest.mockResolvedValue({ results: [], count: 0 });
    resumeApi.list();
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/?page=1", { auth: true });
  });

  it("list(3) — page 변수 전달", () => {
    mockApiRequest.mockResolvedValue({ results: [], count: 0 });
    resumeApi.list(3);
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/?page=3", { auth: true });
  });

  it("retrieve(uuid) — 단건 조회", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.retrieve("r-1");
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/r-1/", { auth: true });
  });

  it("remove(uuid) — DELETE method", () => {
    mockApiRequest.mockResolvedValue(undefined);
    resumeApi.remove("r-1");
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/r-1/", {
      method: "DELETE",
      auth: true,
    });
  });
});

describe("resumeApi — createText / updateText / finalize", () => {
  beforeEach(() => jest.clearAllMocks());

  it("createText — POST + body 에 type=text 포함", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createText("제목", "내용");
    const [url, opts] = mockApiRequest.mock.calls[0];
    expect(url).toBe("/api/v1/resumes/");
    expect(opts.method).toBe("POST");
    expect(opts.auth).toBe(true);
    expect(JSON.parse(opts.body)).toEqual({ type: "text", title: "제목", content: "내용" });
  });

  it("updateText — PATCH + 부분 필드 (title)", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.updateText("r-1", { title: "새 제목" });
    const [url, opts] = mockApiRequest.mock.calls[0];
    expect(url).toBe("/api/v1/resumes/r-1/");
    expect(opts.method).toBe("PATCH");
    expect(JSON.parse(opts.body)).toEqual({ title: "새 제목" });
  });

  it("updateText — content 만 patch", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.updateText("r-1", { content: "수정된 내용" });
    expect(JSON.parse(mockApiRequest.mock.calls[0][1].body)).toEqual({ content: "수정된 내용" });
  });

  it("finalize — POST to /finalize/", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.finalize("r-1");
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/r-1/finalize/", {
      method: "POST",
      auth: true,
    });
  });
});

describe("resumeApi — createStructured (buildStructuredCreatePayload 통합)", () => {
  beforeEach(() => jest.clearAllMocks());

  function captureBody(): Record<string, unknown> {
    return JSON.parse(mockApiRequest.mock.calls[0][1].body);
  }

  it("빈 parsed 면 type+title 만 포함", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured("Empty", partial({}));
    expect(captureBody()).toEqual({ type: "structured", title: "Empty" });
  });

  it("basicInfo: 값이 있을 때만 직렬화", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured(
      "T",
      partial({ basicInfo: { name: "홍길동", email: "h@e.com", phone: "", location: "" } }),
    );
    expect(captureBody().basic_info).toEqual({
      name: "홍길동",
      email: "h@e.com",
      phone: "",
      location: "",
    });
  });

  it("basicInfo 모든 필드 falsy 면 생략", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured(
      "T",
      partial({ basicInfo: { name: "", email: "", phone: "", location: "" } }),
    );
    expect(captureBody().basic_info).toBeUndefined();
  });

  it("summary 있을 때 {text} 래핑", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured("T", partial({ summary: "한 줄 소개" }));
    expect(captureBody().summary).toEqual({ text: "한 줄 소개" });
  });

  it("totalExperienceYears 만 있어도 career_meta 직렬화", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured("T", partial({ totalExperienceYears: 5 }));
    expect(captureBody().career_meta).toEqual({
      total_experience_years: 5,
      total_experience_months: undefined,
    });
  });

  it("totalExperienceMonths 만 있어도 career_meta 직렬화", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured("T", partial({ totalExperienceMonths: 8 }));
    expect(captureBody().career_meta).toEqual({
      total_experience_years: undefined,
      total_experience_months: 8,
    });
  });

  it("experiences: display_order 자동 할당 + 누락 필드 기본값", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured(
      "T",
      partial({
        experiences: [
          { company: "A", role: "BE", period: "2020-2023", responsibilities: ["x"], highlights: [] },
          { company: "B", role: "FE" },
        ],
      }),
    );
    expect(captureBody().experiences).toEqual([
      {
        company: "A",
        role: "BE",
        period: "2020-2023",
        responsibilities: ["x"],
        highlights: [],
        display_order: 0,
      },
      {
        company: "B",
        role: "FE",
        period: "",
        responsibilities: [],
        highlights: [],
        display_order: 1,
      },
    ]);
  });

  it("educations / certifications / awards: display_order 부여", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured(
      "T",
      partial({
        educations: [{ school: "S", degree: "BS", major: "CS", period: "" }],
        certifications: [{ name: "AWS", issuer: "Amazon", date: "2023" }],
        awards: [{ name: "Gold", year: "2024", organization: "X", description: "" }],
      }),
    );
    const body = captureBody();
    expect((body.educations as { display_order: number }[])[0].display_order).toBe(0);
    expect((body.certifications as { display_order: number }[])[0].display_order).toBe(0);
    expect((body.awards as { display_order: number }[])[0].display_order).toBe(0);
  });

  it("projects: techStack → tech_stack snake_case 변환", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured(
      "T",
      partial({
        projects: [
          { name: "P", role: "lead", period: "", description: "", techStack: ["React", "TS"] },
        ],
      }),
    );
    expect((captureBody().projects as { tech_stack: string[] }[])[0].tech_stack).toEqual(["React", "TS"]);
  });

  it("languagesSpoken → languages_spoken snake_case", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured(
      "T",
      partial({ languagesSpoken: [{ language: "English", level: "Fluent" }] }),
    );
    expect(captureBody().languages_spoken).toEqual([
      { language: "English", level: "Fluent", display_order: 0 },
    ]);
  });

  it("skills: 누락 카테고리에 [] fallback", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured(
      "T",
      partial({ skills: { technical: ["TS"], soft: [], tools: ["Git"] } }),
    );
    expect(captureBody().skills).toEqual({
      technical: ["TS"],
      soft: [],
      tools: ["Git"],
      languages: [],
    });
  });

  it("industryDomains / keywords / jobCategory (FK lookup)", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured(
      "T",
      partial({
        industryDomains: ["E-commerce"],
        keywords: ["React", "DevOps"],
        jobCategory: "백엔드 개발",
      }),
    );
    const body = captureBody();
    expect(body.industry_domains).toEqual(["E-commerce"]);
    expect(body.keywords).toEqual(["React", "DevOps"]);
    expect(body.resume_job_category_name).toBe("백엔드 개발");
  });

  it("빈 배열은 직렬화 생략 (empty list short-circuit)", () => {
    mockApiRequest.mockResolvedValue(FAKE_DETAIL);
    resumeApi.createStructured(
      "T",
      partial({ experiences: [], educations: [], industryDomains: [], keywords: [] }),
    );
    const body = captureBody();
    expect(body.experiences).toBeUndefined();
    expect(body.educations).toBeUndefined();
    expect(body.industry_domains).toBeUndefined();
    expect(body.keywords).toBeUndefined();
  });
});
