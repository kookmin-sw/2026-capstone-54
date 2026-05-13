const mockApiRequest = jest.fn();

jest.mock("@/shared/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { userJobDescriptionApi } from "../userJobDescriptionApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("userJobDescriptionApi.listPage", () => {
  it("GET ?page=1 + auth=true", async () => {
    mockApiRequest.mockResolvedValue({ results: [], nextPage: null });
    await userJobDescriptionApi.listPage();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/user-job-descriptions/?page=1",
      expect.objectContaining({ auth: true }),
    );
  });

  it("페이지 인자 적용 → ?page=3", async () => {
    mockApiRequest.mockResolvedValue({ results: [], nextPage: null });
    await userJobDescriptionApi.listPage(3);
    expect(mockApiRequest.mock.calls[0][0]).toContain("?page=3");
  });
});

describe("userJobDescriptionApi.list (전체 페이지 순회)", () => {
  it("nextPage null → 1 페이지만 가져오고 종료", async () => {
    mockApiRequest.mockResolvedValueOnce({
      results: [{ uuid: "a" }, { uuid: "b" }],
      nextPage: null,
    });

    const all = await userJobDescriptionApi.list();
    expect(all).toHaveLength(2);
    expect(mockApiRequest).toHaveBeenCalledTimes(1);
  });

  it("nextPage 있음 → 다음 페이지까지 순회 후 합침", async () => {
    mockApiRequest
      .mockResolvedValueOnce({ results: [{ uuid: "a" }], nextPage: 2 })
      .mockResolvedValueOnce({ results: [{ uuid: "b" }, { uuid: "c" }], nextPage: null });

    const all = await userJobDescriptionApi.list();
    expect(all).toHaveLength(3);
    expect(mockApiRequest).toHaveBeenCalledTimes(2);
    expect(mockApiRequest.mock.calls[1][0]).toContain("?page=2");
  });
});

describe("userJobDescriptionApi.retrieve / create / update / remove", () => {
  it("retrieve: GET /{uuid}/ + auth", async () => {
    mockApiRequest.mockResolvedValue({ uuid: "u-1" });
    await userJobDescriptionApi.retrieve("u-1");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/user-job-descriptions/u-1/",
      expect.objectContaining({ auth: true }),
    );
  });

  it("create: POST + body 직렬화 (snake_case + 기본값)", async () => {
    mockApiRequest.mockResolvedValue({ uuid: "new" });

    await userJobDescriptionApi.create({ url: "https://x.com" });

    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({
      url: "https://x.com",
      title: "",
      application_status: "planned",
    });
  });

  it("create: 모든 파라미터 → body 에 그대로 매핑", async () => {
    mockApiRequest.mockResolvedValue({ uuid: "new" });
    await userJobDescriptionApi.create({
      url: "https://x.com",
      title: "프론트엔드",
      applicationStatus: "applied",
    });
    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({
      url: "https://x.com",
      title: "프론트엔드",
      application_status: "applied",
    });
  });

  it("update: PATCH + 선택적 필드만 body 에 포함", async () => {
    mockApiRequest.mockResolvedValue({ uuid: "u-1" });

    await userJobDescriptionApi.update("u-1", { title: "변경", applicationStatus: "saved" });

    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ title: "변경", application_status: "saved" });
  });

  it("update: applicationStatus 만 → title 미포함", async () => {
    mockApiRequest.mockResolvedValue({});
    await userJobDescriptionApi.update("u-1", { applicationStatus: "saved" });
    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ application_status: "saved" });
  });

  it("remove: DELETE /{uuid}/", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    await userJobDescriptionApi.remove("u-1");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/user-job-descriptions/u-1/",
      expect.objectContaining({ method: "DELETE", auth: true }),
    );
  });

  it("getStats: GET stats/count/", async () => {
    mockApiRequest.mockResolvedValue({ total: 5, planned: 2, applied: 2, saved: 1 });
    const result = await userJobDescriptionApi.getStats();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/user-job-descriptions/stats/count/",
      expect.objectContaining({ auth: true }),
    );
    expect(result.total).toBe(5);
  });
});
