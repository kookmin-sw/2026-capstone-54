import { apiRequest } from "@/shared/api/client";
import { resumeApi } from "../resumeApi";

jest.mock("@/shared/api/client", () => ({
  apiRequest: jest.fn(async () => ({})),
  BASE_URL: "http://test.local",
  getAccessToken: jest.fn(() => "test-token"),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe("resumeApi", () => {
  beforeEach(() => {
    mockApiRequest.mockClear();
  });

  it("list(page) 호출 시 쿼리파라미터 포함 URL 생성", async () => {
    await resumeApi.list(3);
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/?page=3", { auth: true });
  });

  it("retrieve(uuid) 호출 시 상세 URL 사용", async () => {
    await resumeApi.retrieve("abc-123");
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/abc-123/", { auth: true });
  });

  it("createText 호출 시 POST + type:text 페이로드", async () => {
    await resumeApi.createText("제목", "내용");
    const [url, opts] = mockApiRequest.mock.calls[0] as [string, RequestInit & { auth?: boolean }];
    expect(url).toBe("/api/v1/resumes/");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body as string)).toEqual({ type: "text", title: "제목", content: "내용" });
  });

  it("updateText 호출 시 PATCH + 주어진 필드만 포함", async () => {
    await resumeApi.updateText("uuid-1", { title: "새 제목" });
    const [url, opts] = mockApiRequest.mock.calls[0] as [string, RequestInit & { auth?: boolean }];
    expect(url).toBe("/api/v1/resumes/uuid-1/");
    expect(opts.method).toBe("PATCH");
    expect(JSON.parse(opts.body as string)).toEqual({ title: "새 제목" });
  });

  it("remove(uuid) 호출 시 DELETE 메서드", async () => {
    await resumeApi.remove("uuid-del");
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/uuid-del/", { method: "DELETE", auth: true });
  });

  it("activate/deactivate 는 올바른 액션 URL로 POST", async () => {
    await resumeApi.activate("u1");
    await resumeApi.deactivate("u1");
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/u1/activate/", { method: "POST", auth: true });
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/u1/deactivate/", { method: "POST", auth: true });
  });
});
