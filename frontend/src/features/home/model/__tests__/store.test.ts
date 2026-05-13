import { act } from "@testing-library/react";

jest.mock("../../api/homeApi", () => ({
  fetchHomeDataApi: jest.fn(),
}));

import { fetchHomeDataApi } from "../../api/homeApi";
import { useHomeStore } from "../store";

const mockFetch = fetchHomeDataApi as jest.Mock;

const FAKE_DATA = {
  userName: "테스트",
  recentInterviews: [],
  ticketSummary: { followupBalance: 5, fullProcessBalance: 3 },
};

function resetStore() {
  act(() => {
    useHomeStore.setState({ data: null, loading: false, error: null });
  });
}

describe("useHomeStore — 초기 상태", () => {
  beforeEach(resetStore);

  it("data=null, loading=false, error=null", () => {
    const state = useHomeStore.getState();
    expect(state.data).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe("useHomeStore — fetchHome", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 data 저장 + error=null", async () => {
    mockFetch.mockResolvedValue({ success: true, data: FAKE_DATA });

    await act(async () => useHomeStore.getState().fetchHome());

    const state = useHomeStore.getState();
    expect(state.data).toEqual(FAKE_DATA);
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
  });

  it("success=false 이지만 data 있으면 data 저장 + error 메시지", async () => {
    mockFetch.mockResolvedValue({ success: false, data: FAKE_DATA, error: "부분 실패" });

    await act(async () => useHomeStore.getState().fetchHome());

    const state = useHomeStore.getState();
    expect(state.data).toEqual(FAKE_DATA);
    expect(state.error).toBe("부분 실패");
  });

  it("data 없으면 error 만 저장", async () => {
    mockFetch.mockResolvedValue({ success: false, error: "권한 없음" });

    await act(async () => useHomeStore.getState().fetchHome());

    expect(useHomeStore.getState().error).toBe("권한 없음");
    expect(useHomeStore.getState().data).toBeNull();
  });

  it("error 메시지 없으면 기본 메시지", async () => {
    mockFetch.mockResolvedValue({ success: false });

    await act(async () => useHomeStore.getState().fetchHome());

    expect(useHomeStore.getState().error).toMatch(/불러오지 못했습니다/);
  });

  it("fetchHomeDataApi throw 시 네트워크 오류 메시지", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation();
    mockFetch.mockRejectedValue(new Error("network"));

    await act(async () => useHomeStore.getState().fetchHome());

    expect(useHomeStore.getState().error).toMatch(/네트워크 오류/);
    expect(useHomeStore.getState().loading).toBe(false);
    errorSpy.mockRestore();
  });
});
