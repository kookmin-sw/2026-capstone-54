import { apiRequest } from "@/shared/api/client";
import { resumeTemplatesApi } from "../resumeTemplatesApi";

jest.mock("@/shared/api/client", () => ({
  apiRequest: jest.fn(async () => ({})),
  BASE_URL: "http://test.local",
  getAccessToken: jest.fn(() => "test-token"),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe("resumeTemplatesApi", () => {
  beforeEach(() => mockApiRequest.mockClear());

  it("필터 없이 list 호출 시 기본 URL", async () => {
    await resumeTemplatesApi.list();
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/templates/", { auth: true });
  });

  it("job 필터가 URL 쿼리에 포함된다", async () => {
    await resumeTemplatesApi.list({ job: "job-uuid" });
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/templates/?job=job-uuid", { auth: true });
  });

  it("category 필터가 URL 쿼리에 포함된다", async () => {
    await resumeTemplatesApi.list({ category: "IT/개발" });
    const firstCall = mockApiRequest.mock.calls[0][0] as string;
    expect(firstCall).toMatch(/^\/api\/v1\/resumes\/templates\/\?category=/);
  });

  it("search 필터가 URL 쿼리에 포함된다", async () => {
    await resumeTemplatesApi.list({ search: "백엔드" });
    const firstCall = mockApiRequest.mock.calls[0][0] as string;
    expect(firstCall).toMatch(/^\/api\/v1\/resumes\/templates\/\?search=/);
    expect(decodeURIComponent(firstCall)).toContain("search=백엔드");
  });

  it("retrieve 호출 시 detail URL", async () => {
    await resumeTemplatesApi.retrieve("tpl-uuid");
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/templates/tpl-uuid/", { auth: true });
  });
});
