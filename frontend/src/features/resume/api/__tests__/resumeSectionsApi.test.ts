jest.mock("@/shared/api/client", () => ({
  apiRequest: jest.fn(),
  BASE_URL: "https://api.test.example",
  getAccessToken: jest.fn(() => null),
}));

import { apiRequest } from "@/shared/api/client";
import { resumeSectionsApi } from "../resumeSectionsApi";
import { lastApiBody, lastApiCall } from "@/test-utils";

const mockApiRequest = apiRequest as jest.Mock;

const R_UUID = "r-uuid";
const ITEM_UUID = "item-uuid";

function lastUrl(): string {
  const call = lastApiCall(mockApiRequest);
  if (!call) throw new Error("apiRequest 미호출");
  return call[0] as string;
}

function lastMethod(): string | undefined {
  const call = lastApiCall(mockApiRequest);
  if (!call) throw new Error("apiRequest 미호출");
  return (call[1] as { method?: string } | undefined)?.method;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockApiRequest.mockResolvedValue({});
});

describe("resumeSectionsApi — 1:1 sections", () => {
  it("putBasicInfo: PUT /sections/basic-info/ + body 그대로 전달", () => {
    resumeSectionsApi.putBasicInfo(R_UUID, {
      name: "홍길동",
      email: "h@e.com",
      phone: "010",
      location: "Seoul",
    });
    expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/basic-info/`);
    expect(lastMethod()).toBe("PUT");
    expect(lastApiBody(mockApiRequest)).toEqual({
      name: "홍길동",
      email: "h@e.com",
      phone: "010",
      location: "Seoul",
    });
  });

  it("putSummary: PUT /summary/ + { text } 래핑", () => {
    resumeSectionsApi.putSummary(R_UUID, "한 줄 소개");
    expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/summary/`);
    expect(lastApiBody(mockApiRequest)).toEqual({ text: "한 줄 소개" });
  });

  it("putCareerMeta: PUT /career-meta/ + snake_case keys", () => {
    resumeSectionsApi.putCareerMeta(R_UUID, 5, 8);
    expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/career-meta/`);
    expect(lastApiBody(mockApiRequest)).toEqual({
      total_experience_years: 5,
      total_experience_months: 8,
    });
  });

  it("putCareerMeta: null 값도 명시적으로 전송", () => {
    resumeSectionsApi.putCareerMeta(R_UUID, null, null);
    expect(lastApiBody(mockApiRequest)).toEqual({
      total_experience_years: null,
      total_experience_months: null,
    });
  });

  it("putJobCategory: PUT /job-category/ + { name } 직렬화", () => {
    resumeSectionsApi.putJobCategory(R_UUID, "백엔드 개발");
    expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/job-category/`);
    expect(lastApiBody(mockApiRequest)).toEqual({ name: "백엔드 개발" });
  });
});

describe("resumeSectionsApi — 1:N CRUD (Experiences 대표 검증)", () => {
  it("list: GET /experiences/", () => {
    resumeSectionsApi.listExperiences(R_UUID);
    expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/experiences/`);
    expect(lastMethod()).toBeUndefined();
    expect(lastApiCall(mockApiRequest)?.[1]).toEqual({ auth: true });
  });

  it("add: POST /experiences/ + snake_case body 변환", () => {
    resumeSectionsApi.addExperience(R_UUID, {
      company: "A",
      role: "BE",
      period: "2020-2023",
      responsibilities: ["api 개발"],
      highlights: ["P99 50ms"],
      displayOrder: 0,
    });
    expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/experiences/`);
    expect(lastMethod()).toBe("POST");
    const body = lastApiBody(mockApiRequest);
    expect(body).toMatchObject({
      company: "A",
      role: "BE",
      period: "2020-2023",
      responsibilities: ["api 개발"],
      highlights: ["P99 50ms"],
      display_order: 0,
    });
    expect(body).not.toHaveProperty("displayOrder");
  });

  it("update: PUT /experiences/{uuid}/ + 부분 필드 + snake 변환", () => {
    resumeSectionsApi.updateExperience(R_UUID, ITEM_UUID, {
      role: "Tech Lead",
      displayOrder: 3,
    });
    expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/experiences/${ITEM_UUID}/`);
    expect(lastMethod()).toBe("PUT");
    expect(lastApiBody(mockApiRequest)).toEqual({
      role: "Tech Lead",
      display_order: 3,
    });
  });

  it("delete: DELETE /experiences/{uuid}/", () => {
    resumeSectionsApi.deleteExperience(R_UUID, ITEM_UUID);
    expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/experiences/${ITEM_UUID}/`);
    expect(lastMethod()).toBe("DELETE");
  });
});

describe("resumeSectionsApi — Educations / Certifications / Awards / Projects / LanguagesSpoken (URL + method 검증)", () => {
  const cases: Array<{
    name: string;
    list: (uuid: string) => unknown;
    add: (uuid: string) => unknown;
    update: (uuid: string, item: string) => unknown;
    remove: (uuid: string, item: string) => unknown;
    urlSegment: string;
  }> = [
    {
      name: "Educations",
      list: (uuid) => resumeSectionsApi.listEducations(uuid),
      add: (uuid) => resumeSectionsApi.addEducation(uuid, {
        school: "S", degree: "BS", major: "CS", period: "2018-2022", displayOrder: 0,
      }),
      update: (uuid, item) => resumeSectionsApi.updateEducation(uuid, item, { major: "AI" }),
      remove: (uuid, item) => resumeSectionsApi.deleteEducation(uuid, item),
      urlSegment: "educations",
    },
    {
      name: "Certifications",
      list: (uuid) => resumeSectionsApi.listCertifications(uuid),
      add: (uuid) => resumeSectionsApi.addCertification(uuid, {
        name: "AWS", issuer: "Amazon", date: "2023", displayOrder: 0,
      }),
      update: (uuid, item) => resumeSectionsApi.updateCertification(uuid, item, { date: "2024" }),
      remove: (uuid, item) => resumeSectionsApi.deleteCertification(uuid, item),
      urlSegment: "certifications",
    },
    {
      name: "Awards",
      list: (uuid) => resumeSectionsApi.listAwards(uuid),
      add: (uuid) => resumeSectionsApi.addAward(uuid, {
        name: "Gold", year: "2024", organization: "X", description: "", displayOrder: 0,
      }),
      update: (uuid, item) => resumeSectionsApi.updateAward(uuid, item, { year: "2025" }),
      remove: (uuid, item) => resumeSectionsApi.deleteAward(uuid, item),
      urlSegment: "awards",
    },
    {
      name: "Projects",
      list: (uuid) => resumeSectionsApi.listProjects(uuid),
      add: (uuid) => resumeSectionsApi.addProject(uuid, {
        name: "P", role: "lead", period: "", description: "", techStack: ["TS"], displayOrder: 0,
      }),
      update: (uuid, item) => resumeSectionsApi.updateProject(uuid, item, { role: "PM" }),
      remove: (uuid, item) => resumeSectionsApi.deleteProject(uuid, item),
      urlSegment: "projects",
    },
    {
      name: "LanguagesSpoken",
      list: (uuid) => resumeSectionsApi.listLanguagesSpoken(uuid),
      add: (uuid) => resumeSectionsApi.addLanguageSpoken(uuid, {
        language: "English", level: "Fluent", displayOrder: 0,
      }),
      update: (uuid, item) => resumeSectionsApi.updateLanguageSpoken(uuid, item, { level: "Native" }),
      remove: (uuid, item) => resumeSectionsApi.deleteLanguageSpoken(uuid, item),
      urlSegment: "languages-spoken",
    },
  ];

  for (const c of cases) {
    describe(c.name, () => {
      it("list — GET", () => {
        c.list(R_UUID);
        expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/${c.urlSegment}/`);
        expect(lastMethod()).toBeUndefined();
      });

      it("add — POST + snake_case body", () => {
        c.add(R_UUID);
        expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/${c.urlSegment}/`);
        expect(lastMethod()).toBe("POST");
        const body = lastApiBody(mockApiRequest);
        expect(body.display_order).toBe(0);
      });

      it("update — PUT {uuid}/ + snake_case", () => {
        c.update(R_UUID, ITEM_UUID);
        expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/${c.urlSegment}/${ITEM_UUID}/`);
        expect(lastMethod()).toBe("PUT");
      });

      it("delete — DELETE {uuid}/", () => {
        c.remove(R_UUID, ITEM_UUID);
        expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/${c.urlSegment}/${ITEM_UUID}/`);
        expect(lastMethod()).toBe("DELETE");
      });
    });
  }
});

describe("resumeSectionsApi — N:M sections (skills / industry-domains / keywords)", () => {
  it("putSkills: PUT /skills/ + { skills } 래핑", () => {
    resumeSectionsApi.putSkills(R_UUID, {
      technical: ["TS"],
      soft: ["Communication"],
      tools: ["Git"],
      languages: [],
    });
    expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/skills/`);
    expect(lastMethod()).toBe("PUT");
    expect(lastApiBody(mockApiRequest)).toEqual({
      skills: {
        technical: ["TS"],
        soft: ["Communication"],
        tools: ["Git"],
        languages: [],
      },
    });
  });

  it("putIndustryDomains: PUT /industry-domains/ + snake_case wrapper", () => {
    resumeSectionsApi.putIndustryDomains(R_UUID, ["E-commerce", "FinTech"]);
    expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/industry-domains/`);
    expect(lastApiBody(mockApiRequest)).toEqual({
      industry_domains: ["E-commerce", "FinTech"],
    });
  });

  it("putKeywords: PUT /keywords/", () => {
    resumeSectionsApi.putKeywords(R_UUID, ["React", "DevOps"]);
    expect(lastUrl()).toBe(`/api/v1/resumes/${R_UUID}/sections/keywords/`);
    expect(lastApiBody(mockApiRequest)).toEqual({
      keywords: ["React", "DevOps"],
    });
  });

  it("빈 배열도 명시적으로 전송", () => {
    resumeSectionsApi.putKeywords(R_UUID, []);
    expect(lastApiBody(mockApiRequest)).toEqual({ keywords: [] });
  });
});

describe("resumeSectionsApi — snakeKeys 변환 (camelCase → snake_case 간접 검증)", () => {
  it("camelCase 키 변환: displayOrder → display_order, techStack → tech_stack", () => {
    resumeSectionsApi.addProject(R_UUID, {
      name: "X",
      role: "Y",
      period: "",
      description: "",
      techStack: ["React"],
      displayOrder: 2,
    });
    const body = lastApiBody(mockApiRequest);
    expect(body.display_order).toBe(2);
    expect(body.tech_stack).toEqual(["React"]);
    expect(body).not.toHaveProperty("displayOrder");
    expect(body).not.toHaveProperty("techStack");
  });
});
