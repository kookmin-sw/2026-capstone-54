import { act } from "@testing-library/react";

jest.mock("../../api/streakApi", () => ({
  fetchStreakApi: jest.fn(),
}));

import { fetchStreakApi } from "../../api/streakApi";
import { useStreakStore } from "../store";

const mockFetch = fetchStreakApi as jest.Mock;

const FAKE_DATA = {
  currentStreak: 7,
  longestStreak: 30,
  participations: [],
};

function resetStore() {
  act(() => {
    useStreakStore.setState({ data: null, loading: false, error: null });
  });
}

describe("useStreakStore — 초기 상태", () => {
  beforeEach(resetStore);

  it("data=null, loading=false, error=null", () => {
    const state = useStreakStore.getState();
    expect(state.data).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(typeof state.fetchStreak).toBe("function");
  });
});

describe("useStreakStore — fetchStreak", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 data 저장 + loading=false + error=null", async () => {
    mockFetch.mockResolvedValue({ success: true, data: FAKE_DATA });

    await act(async () => useStreakStore.getState().fetchStreak());

    const state = useStreakStore.getState();
    expect(state.data).toEqual(FAKE_DATA);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("실패 시 error 설정 + loading=false", async () => {
    mockFetch.mockResolvedValue({ success: false, error: "스트릭 조회 실패" });

    await act(async () => useStreakStore.getState().fetchStreak());

    expect(useStreakStore.getState().error).toBe("스트릭 조회 실패");
    expect(useStreakStore.getState().loading).toBe(false);
  });

  it("error 없으면 기본 메시지", async () => {
    mockFetch.mockResolvedValue({ success: false });

    await act(async () => useStreakStore.getState().fetchStreak());

    expect(useStreakStore.getState().error).toMatch(/불러오지 못했습니다/);
  });

  it("success=true 지만 data=null 이면 error 처리", async () => {
    mockFetch.mockResolvedValue({ success: true, data: null });

    await act(async () => useStreakStore.getState().fetchStreak());

    expect(useStreakStore.getState().error).toMatch(/불러오지 못했습니다/);
  });

  it("fetchStreak 시작 시 loading=true + 이전 error clear", async () => {
    act(() => useStreakStore.setState({ error: "이전 에러" }));
    let resolvePromise: (value: { success: boolean; data?: typeof FAKE_DATA }) => void;
    mockFetch.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));

    act(() => { void useStreakStore.getState().fetchStreak(); });

    expect(useStreakStore.getState().loading).toBe(true);
    expect(useStreakStore.getState().error).toBeNull();

    await act(async () => {
      resolvePromise!({ success: true, data: FAKE_DATA });
    });
  });
});
