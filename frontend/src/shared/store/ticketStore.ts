import { create } from "zustand";
import { fetchUserTicketApi } from "@/shared/api";
import type { UserTicket } from "@/shared/api";

interface TicketState {
  tickets: UserTicket | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Internal method to force refresh from outside
  _forceRefresh: () => Promise<void>;
}

export const useTicketStore = create<TicketState>()((set) => ({
  tickets: null,
  loading: false,
  error: null,

  refetch: async () => {
    set({ loading: true, error: null });
    const res = await fetchUserTicketApi();
    if (res.success && res.data) {
      set({ tickets: res.data, loading: false });
    } else {
      set({ error: res.error ?? "티켓 조회 실패", loading: false });
    }
  },

  _forceRefresh: async () => {
    set({ loading: true, error: null });
    const res = await fetchUserTicketApi();
    if (res.success && res.data) {
      set({ tickets: res.data, loading: false });
    } else {
      set({ error: res.error ?? "티켓 조회 실패", loading: false });
    }
  },
}));

// Initialize the store on first use
useTicketStore.getState().refetch();
