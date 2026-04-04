import { create } from "zustand";
import {
  fetchSubscriptionApi,
  createCheckoutApi,
  cancelSubscriptionApi,
} from "../api/subscriptionApi";
import type { SubscriptionStatus, BillingCycle } from "../api/subscriptionApi";

interface SubscriptionState {
  status: SubscriptionStatus | null;
  loading: boolean;
  processing: boolean;
  error: string | null;
  successMessage: string | null;

  /** UI state */
  billingCycle: BillingCycle;
  openFaqIndex: number | null;

  /* Actions */
  fetchStatus: () => Promise<void>;
  setBillingCycle: (cycle: BillingCycle) => void;
  toggleBilling: () => void;
  checkout: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  toggleFaq: (index: number) => void;
  clearMessages: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()((set, get) => ({
  status: null,
  loading: false,
  processing: false,
  error: null,
  successMessage: null,

  billingCycle: "monthly",
  openFaqIndex: null,

  fetchStatus: async () => {
    set({ loading: true, error: null });
    const res = await fetchSubscriptionApi();
    if (res.success && res.data) {
      set({ status: res.data, loading: false });
    } else {
      set({ error: res.error ?? "요금제 정보를 불러오지 못했습니다.", loading: false });
    }
  },

  setBillingCycle: (cycle) => set({ billingCycle: cycle }),

  toggleBilling: () =>
    set((s) => ({ billingCycle: s.billingCycle === "monthly" ? "yearly" : "monthly" })),

  checkout: async () => {
    const { billingCycle } = get();
    set({ processing: true, error: null, successMessage: null });
    const res = await createCheckoutApi({ plan: "pro", billingCycle });
    if (res.success) {
      set({ processing: false, successMessage: res.message });
      if (res.redirectUrl && res.redirectUrl !== "#") {
        window.location.href = res.redirectUrl;
      }
    } else {
      set({ processing: false, error: res.message });
    }
  },

  cancelSubscription: async () => {
    set({ processing: true, error: null });
    const res = await cancelSubscriptionApi();
    if (res.success) {
      set((s) => ({
        processing: false,
        successMessage: res.message,
        status: s.status
          ? { ...s.status, currentPlan: "free", billingCycle: null, nextBillingDate: null }
          : s.status,
      }));
    } else {
      set({ processing: false, error: res.message });
    }
  },

  toggleFaq: (index) =>
    set((s) => ({ openFaqIndex: s.openFaqIndex === index ? null : index })),

  clearMessages: () => set({ error: null, successMessage: null }),
}));
