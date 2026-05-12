import { act } from "@testing-library/react";

jest.mock("../../api/achievementsApi", () => ({
  fetchAchievementsApi: jest.fn(),
  claimAchievementApi: jest.fn(),
}));

jest.mock("@/shared/store/ticketStore", () => ({
  useTicketStore: {
    getState: jest.fn(() => ({ refetch: jest.fn() })),
  },
}));

import { fetchAchievementsApi, claimAchievementApi } from "../../api/achievementsApi";
import { useAchievementsStore } from "../store";
import type { Achievement } from "../types";

const mockFetch = fetchAchievementsApi as jest.Mock;
const mockClaim = claimAchievementApi as jest.Mock;

const ACHIEVEMENT_A = {
  code: "FIRST_INTERVIEW",
  name: "첫 면접",
  category: "interview",
  status: "completed",
  rewardClaimedAt: null,
  canClaimReward: true,
} as unknown as Achievement;
const ACHIEVEMENT_B = {
  code: "STREAK_7",
  name: "7일 연속",
  category: "streak",
  status: "in_progress",
  rewardClaimedAt: null,
  canClaimReward: false,
} as unknown as Achievement;

function resetStore() {
  act(() => {
    useAchievementsStore.setState({
      data: null,
      total: 0,
      offset: 0,
      limit: 20,
      hasMore: true,
      loading: false,
      loadingMore: false,
      error: null,
      claimError: null,
      claimingCodes: new Set(),
      filters: { category: null, status: null, rewardClaim: null },
    });
  });
}

describe("useAchievementsStore — 초기 상태", () => {
  beforeEach(resetStore);

  it("data=null, total=0, offset=0, limit=20, hasMore=true, claimingCodes=빈 Set, 기본 필터", () => {
    const state = useAchievementsStore.getState();
    expect(state.data).toBeNull();
    expect(state.total).toBe(0);
    expect(state.offset).toBe(0);
    expect(state.limit).toBe(20);
    expect(state.hasMore).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.loadingMore).toBe(false);
    expect(state.error).toBeNull();
    expect(state.claimingCodes.size).toBe(0);
    expect(state.filters).toEqual({ category: null, status: null, rewardClaim: null });
  });
});

describe("useAchievementsStore — fetchAchievements", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 results 저장 + total/offset/hasMore 계산", async () => {
    mockFetch.mockResolvedValue({
      success: true,
      data: { results: [ACHIEVEMENT_A, ACHIEVEMENT_B], total: 5 },
    });

    await act(async () => useAchievementsStore.getState().fetchAchievements());

    const state = useAchievementsStore.getState();
    expect(state.data).toEqual([ACHIEVEMENT_A, ACHIEVEMENT_B]);
    expect(state.total).toBe(5);
    expect(state.offset).toBe(2);
    expect(state.hasMore).toBe(true);
    expect(state.loading).toBe(false);
  });

  it("results.length === total 면 hasMore=false", async () => {
    mockFetch.mockResolvedValue({
      success: true,
      data: { results: [ACHIEVEMENT_A, ACHIEVEMENT_B], total: 2 },
    });

    await act(async () => useAchievementsStore.getState().fetchAchievements());

    expect(useAchievementsStore.getState().hasMore).toBe(false);
  });

  it("실패 시 error 설정 + loading=false", async () => {
    mockFetch.mockResolvedValue({ success: false, error: "권한 없음" });

    await act(async () => useAchievementsStore.getState().fetchAchievements());

    expect(useAchievementsStore.getState().error).toBe("권한 없음");
    expect(useAchievementsStore.getState().loading).toBe(false);
  });

  it("이미 loading 중이면 early return (중복 호출 방지)", async () => {
    act(() => useAchievementsStore.setState({ loading: true }));

    await act(async () => useAchievementsStore.getState().fetchAchievements());

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("호출 시 데이터 초기화 (data=null, offset=0)", async () => {
    act(() => useAchievementsStore.setState({
      data: [ACHIEVEMENT_A],
      offset: 1,
      hasMore: false,
    }));
    let resolvePromise: (v: { success: boolean; data: { results: typeof ACHIEVEMENT_A[]; total: number } }) => void;
    mockFetch.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));

    act(() => { void useAchievementsStore.getState().fetchAchievements(); });

    expect(useAchievementsStore.getState().data).toBeNull();
    expect(useAchievementsStore.getState().offset).toBe(0);
    expect(useAchievementsStore.getState().hasMore).toBe(true);
    expect(useAchievementsStore.getState().loading).toBe(true);

    await act(async () => {
      resolvePromise!({ success: true, data: { results: [], total: 0 } });
    });
  });
});

describe("useAchievementsStore — loadMore", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("기존 data 에 새 results 추가 + offset/hasMore 갱신", async () => {
    act(() => useAchievementsStore.setState({
      data: [ACHIEVEMENT_A],
      total: 3,
      offset: 1,
      hasMore: true,
    }));
    mockFetch.mockResolvedValue({
      success: true,
      data: { results: [ACHIEVEMENT_B], total: 3 },
    });

    await act(async () => useAchievementsStore.getState().loadMore());

    const state = useAchievementsStore.getState();
    expect(state.data).toEqual([ACHIEVEMENT_A, ACHIEVEMENT_B]);
    expect(state.offset).toBe(2);
    expect(state.hasMore).toBe(true);
  });

  it("hasMore=false 면 early return", async () => {
    act(() => useAchievementsStore.setState({ hasMore: false }));

    await act(async () => useAchievementsStore.getState().loadMore());

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("loadingMore=true 중복 호출 방지", async () => {
    act(() => useAchievementsStore.setState({ loadingMore: true }));

    await act(async () => useAchievementsStore.getState().loadMore());

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("실패 시 error 설정 + loadingMore=false", async () => {
    act(() => useAchievementsStore.setState({ data: [ACHIEVEMENT_A], total: 3 }));
    mockFetch.mockResolvedValue({ success: false, error: "오류" });

    await act(async () => useAchievementsStore.getState().loadMore());

    expect(useAchievementsStore.getState().error).toBe("오류");
    expect(useAchievementsStore.getState().loadingMore).toBe(false);
  });
});

describe("useAchievementsStore — setFilters / clearFilters", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ success: true, data: { results: [], total: 0 } });
  });

  it("setFilters 가 필터 머지 + fetchAchievements 자동 호출", async () => {
    await act(async () => {
      useAchievementsStore.getState().setFilters({ category: "interview" });
    });

    expect(useAchievementsStore.getState().filters.category).toBe("interview");
    expect(useAchievementsStore.getState().filters.status).toBeNull();
    expect(mockFetch).toHaveBeenCalled();
  });

  it("clearFilters 가 기본값 + 자동 재조회", async () => {
    act(() => useAchievementsStore.setState({
      filters: { category: "streak", status: "completed", rewardClaim: "claimed" },
    }));

    await act(async () => {
      useAchievementsStore.getState().clearFilters();
    });

    expect(useAchievementsStore.getState().filters).toEqual({
      category: null,
      status: null,
      rewardClaim: null,
    });
    expect(mockFetch).toHaveBeenCalled();
  });
});

describe("useAchievementsStore — claimAchievement", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 해당 achievement 의 rewardClaimedAt 업데이트 + canClaimReward=false", async () => {
    act(() => useAchievementsStore.setState({
      data: [{ ...ACHIEVEMENT_A }],
    }));
    mockClaim.mockResolvedValue({
      success: true,
      data: { rewardClaimedAt: "2026-05-10T00:00:00Z" },
    });

    await act(async () => useAchievementsStore.getState().claimAchievement("FIRST_INTERVIEW"));

    const state = useAchievementsStore.getState();
    expect(state.data![0].rewardClaimedAt).toBe("2026-05-10T00:00:00Z");
    expect(state.data![0].canClaimReward).toBe(false);
    expect(state.claimingCodes.has("FIRST_INTERVIEW")).toBe(false);
  });

  it("실패 시 claimError 설정 + claimingCodes 정리", async () => {
    act(() => useAchievementsStore.setState({ data: [{ ...ACHIEVEMENT_A }] }));
    mockClaim.mockResolvedValue({ success: false, error: "이미 수령함" });

    await act(async () => useAchievementsStore.getState().claimAchievement("FIRST_INTERVIEW"));

    expect(useAchievementsStore.getState().claimError).toBe("이미 수령함");
    expect(useAchievementsStore.getState().claimingCodes.has("FIRST_INTERVIEW")).toBe(false);
  });

  it("이미 claiming 중인 code 면 중복 호출 차단", async () => {
    act(() => useAchievementsStore.setState({
      data: [{ ...ACHIEVEMENT_A }],
      claimingCodes: new Set(["FIRST_INTERVIEW"]),
    }));

    await act(async () => useAchievementsStore.getState().claimAchievement("FIRST_INTERVIEW"));

    expect(mockClaim).not.toHaveBeenCalled();
  });

  it("claim 진행 중 claimingCodes 에 code 추가", async () => {
    act(() => useAchievementsStore.setState({ data: [{ ...ACHIEVEMENT_A }] }));
    let resolvePromise: (v: { success: boolean; data: { rewardClaimedAt: string } }) => void;
    mockClaim.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));

    act(() => { void useAchievementsStore.getState().claimAchievement("FIRST_INTERVIEW"); });

    expect(useAchievementsStore.getState().claimingCodes.has("FIRST_INTERVIEW")).toBe(true);

    await act(async () => {
      resolvePromise!({ success: true, data: { rewardClaimedAt: "x" } });
    });
  });
});
