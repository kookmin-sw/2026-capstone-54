const mockFetch = jest.fn();

jest.mock("../../api/milestoneApi", () => ({
  fetchMilestonesApi: (...args: unknown[]) => mockFetch(...args),
}));

import { useMilestoneStore } from "../milestoneStore";

beforeEach(() => {
  jest.clearAllMocks();
  useMilestoneStore.setState({ data: null, loading: false, error: null });
});

describe("useMilestoneStore", () => {
  it("초기 상태: data=null, loading=false, error=null", () => {
    const s = useMilestoneStore.getState();
    expect(s.data).toBeNull();
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
  });

  it("fetchMilestones 성공 → data 설정 + loading=false", async () => {
    mockFetch.mockResolvedValue({ success: true, data: [{ id: 1, title: "M1" }] });
    await useMilestoneStore.getState().fetchMilestones();

    const s = useMilestoneStore.getState();
    expect(s.data).toEqual([{ id: 1, title: "M1" }]);
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
  });

  it("fetchMilestones 실패 → error 메시지 설정", async () => {
    mockFetch.mockResolvedValue({ success: false, error: "서버 오류" });
    await useMilestoneStore.getState().fetchMilestones();

    expect(useMilestoneStore.getState().error).toBe("서버 오류");
    expect(useMilestoneStore.getState().loading).toBe(false);
  });

  it("fetchMilestones 실패 + error 없음 → 기본 메시지 fallback", async () => {
    mockFetch.mockResolvedValue({ success: false });
    await useMilestoneStore.getState().fetchMilestones();

    expect(useMilestoneStore.getState().error).toContain("마일스톤");
  });

  it("loading 중 호출 → 무시 (중복 fetch 방지)", async () => {
    useMilestoneStore.setState({ loading: true });
    await useMilestoneStore.getState().fetchMilestones();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("setFallbackData → data 직접 설정", () => {
    const fallback = [{ id: 99, title: "fallback" }];
    useMilestoneStore.getState().setFallbackData(fallback as never);
    expect(useMilestoneStore.getState().data).toEqual(fallback);
  });
});
