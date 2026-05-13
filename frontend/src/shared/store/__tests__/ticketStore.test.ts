import { act } from "@testing-library/react";

jest.mock("@/shared/api", () => ({
  fetchUserTicketApi: jest.fn(),
}));

import { fetchUserTicketApi, type UserTicket } from "@/shared/api";
import { useTicketStore } from "../ticketStore";

const mockFetch = fetchUserTicketApi as jest.Mock;

const FAKE_TICKETS = {
  followupBalance: 5,
  fullProcessBalance: 3,
  analysisReportBalance: 2,
} as unknown as UserTicket;

function resetStore() {
  act(() => {
    useTicketStore.setState({ tickets: null, loading: false, error: null });
  });
}

describe("useTicketStore — 초기 상태", () => {
  beforeEach(resetStore);

  it("tickets=null, loading=false, error=null", () => {
    const state = useTicketStore.getState();
    expect(state.tickets).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("refetch 함수 노출", () => {
    expect(typeof useTicketStore.getState().refetch).toBe("function");
  });
});

describe("useTicketStore — refetch", () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it("성공 시 tickets 저장 + loading=false + error=null", async () => {
    mockFetch.mockResolvedValue({ success: true, data: FAKE_TICKETS });

    await act(async () => useTicketStore.getState().refetch());

    const state = useTicketStore.getState();
    expect(state.tickets).toEqual(FAKE_TICKETS);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("실패 (success=false) 시 error 설정 + tickets 유지 + loading=false", async () => {
    act(() => useTicketStore.setState({ tickets: FAKE_TICKETS }));
    mockFetch.mockResolvedValue({ success: false, error: "권한 없음" });

    await act(async () => useTicketStore.getState().refetch());

    const state = useTicketStore.getState();
    expect(state.error).toBe("권한 없음");
    expect(state.loading).toBe(false);
    expect(state.tickets).toEqual(FAKE_TICKETS);
  });

  it("실패 시 error 메시지 없으면 기본 메시지 사용", async () => {
    mockFetch.mockResolvedValue({ success: false });

    await act(async () => useTicketStore.getState().refetch());

    expect(useTicketStore.getState().error).toBe("티켓 조회 실패");
  });

  it("성공이지만 data 없으면 error 처리 (success=true, data=null)", async () => {
    mockFetch.mockResolvedValue({ success: true, data: null });

    await act(async () => useTicketStore.getState().refetch());

    expect(useTicketStore.getState().error).toBe("티켓 조회 실패");
  });

  it("refetch 시작 시 loading=true + 이전 error clear", async () => {
    act(() => useTicketStore.setState({ error: "이전 에러" }));
    let resolvePromise: (value: { success: boolean; data?: typeof FAKE_TICKETS }) => void;
    mockFetch.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));

    act(() => { void useTicketStore.getState().refetch(); });

    expect(useTicketStore.getState().loading).toBe(true);
    expect(useTicketStore.getState().error).toBeNull();

    await act(async () => {
      resolvePromise!({ success: true, data: FAKE_TICKETS });
    });
  });
});
