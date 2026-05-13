import { apiRequest } from "@/shared/api/client";
import { resumeStatsApi } from "../resumeStatsApi";

jest.mock("@/shared/api/client", () => ({
  apiRequest: jest.fn(async () => ({})),
  BASE_URL: "http://test.local",
  getAccessToken: jest.fn(() => "test-token"),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe("resumeStatsApi", () => {
  beforeEach(() => mockApiRequest.mockClear());

  it("count 엔드포인트 URL", async () => {
    await resumeStatsApi.count();
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/stats/count/", { auth: true });
  });

  it("type 엔드포인트 URL", async () => {
    await resumeStatsApi.type();
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/stats/type/", { auth: true });
  });

  it("topSkills limit 쿼리 포함", async () => {
    await resumeStatsApi.topSkills(10);
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/stats/top-skills/?limit=10", { auth: true });
  });

  it("recentActivity days 쿼리 포함", async () => {
    await resumeStatsApi.recentActivity(14);
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/resumes/stats/recent-activity/?days=14", { auth: true });
  });
});
