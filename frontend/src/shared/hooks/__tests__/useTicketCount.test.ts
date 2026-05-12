const mockRefetch = jest.fn();
const ticketState: {
  tickets: { dailyCount: number; purchasedCount: number; totalCount: number } | null;
  loading: boolean;
  error: string | null;
} = { tickets: null, loading: false, error: null };

jest.mock("@/shared/store/ticketStore", () => ({
  useTicketStore: () => ({
    tickets: ticketState.tickets,
    loading: ticketState.loading,
    error: ticketState.error,
    refetch: mockRefetch,
  }),
}));

import { renderHook } from "@testing-library/react";
import { useTicketCount } from "../useTicketCount";

beforeEach(() => {
  jest.clearAllMocks();
  ticketState.tickets = null;
  ticketState.loading = false;
  ticketState.error = null;
});

describe("useTicketCount", () => {
  it("tickets=null → mount 시 refetch 호출 (자동 로드)", () => {
    renderHook(() => useTicketCount());
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("tickets 이미 있음 → refetch 호출 안 함 (skip)", () => {
    ticketState.tickets = { dailyCount: 3, purchasedCount: 5, totalCount: 8 };
    renderHook(() => useTicketCount());
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it("store 값 그대로 전달 (tickets, loading, error)", () => {
    ticketState.tickets = { dailyCount: 1, purchasedCount: 2, totalCount: 3 };
    ticketState.loading = true;
    ticketState.error = "test err";

    const { result } = renderHook(() => useTicketCount());
    expect(result.current.tickets).toEqual({ dailyCount: 1, purchasedCount: 2, totalCount: 3 });
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe("test err");
  });

  it("refetch 함수 expose", () => {
    const { result } = renderHook(() => useTicketCount());
    expect(typeof result.current.refetch).toBe("function");
  });
});
