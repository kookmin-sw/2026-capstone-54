import { create } from "zustand";
import { fetchJdListApi, calcStats, type JdListItem, type JdListStats } from "../api/jdListApi";

type FilterKey = "all" | "planned" | "applied" | "saved";

interface JdListState {
  items: JdListItem[];
  stats: JdListStats;
  searchQuery: string;
  activeFilter: FilterKey;
  isLoading: boolean;
  error: string | null;

  filtered: JdListItem[];

  fetchList: () => Promise<void>;
  setSearch: (q: string) => void;
  setFilter: (f: FilterKey) => void;
}

function applyFilter(
  items: JdListItem[],
  query: string,
  filter: FilterKey
): JdListItem[] {
  let result = items;

  if (filter !== "all") {
    result = result.filter((item) => {
      if (filter === "planned") return item.status === "planned";
      if (filter === "applied") return item.status === "applied";
      if (filter === "saved") return item.status === "saved";
      return true;
    });
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (item) =>
        item.company.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.tags.some((t) => t.label.toLowerCase().includes(q))
    );
  }

  return result;
}

export const useJdListStore = create<JdListState>()((set, get) => ({
  items: [],
  stats: { total: 0, planned: 0, applied: 0, saved: 0 },
  searchQuery: "",
  activeFilter: "all",
  isLoading: false,
  error: null,
  filtered: [],

  fetchList: async () => {
    set({ isLoading: true, error: null });
    const res = await fetchJdListApi();
    if (!res.success) {
      set({ isLoading: false, error: "목록을 불러오지 못했습니다." });
      return;
    }
    const { searchQuery, activeFilter } = get();
    set({
      isLoading: false,
      items: res.data,
      stats: calcStats(res.data),
      filtered: applyFilter(res.data, searchQuery, activeFilter),
    });
  },

  setSearch: (searchQuery) => {
    const { items, activeFilter } = get();
    set({ searchQuery, filtered: applyFilter(items, searchQuery, activeFilter) });
  },

  setFilter: (activeFilter) => {
    const { items, searchQuery } = get();
    set({ activeFilter, filtered: applyFilter(items, searchQuery, activeFilter) });
  },
}));
