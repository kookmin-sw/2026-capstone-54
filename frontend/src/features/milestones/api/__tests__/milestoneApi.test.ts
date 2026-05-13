const mockApiRequest = jest.fn();

jest.mock("@/shared/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { fetchMilestonesApi } from "../milestoneApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchMilestonesApi", () => {
  it("성공 → success=true + data 반환 + auth=true 요청", async () => {
    const milestones = [{ id: 1, title: "M1" }];
    mockApiRequest.mockResolvedValue(milestones);

    const result = await fetchMilestonesApi();

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/achievements/milestones/",
      expect.objectContaining({ auth: true }),
    );
    expect(result.success).toBe(true);
    expect(result.data).toEqual(milestones);
  });

  it("실패 → success=false + 에러 메시지 + data 없음", async () => {
    mockApiRequest.mockRejectedValue(new Error("fail"));
    const result = await fetchMilestonesApi();

    expect(result.success).toBe(false);
    expect(result.error).toBe("마일스톤을 불러오지 못했습니다.");
    expect(result.data).toBeUndefined();
  });

  it("빈 배열 응답도 success=true", async () => {
    mockApiRequest.mockResolvedValue([]);
    const result = await fetchMilestonesApi();
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});
