/** 채용공고 목록 store. 실제 backend `/api/v1/user-job-descriptions/` 를 사용한다.
 *
 * 사용자 상태(`status`: planned / applied / saved) 와 태그는 아직 backend 에 저장되지
 * 않는다. UI 는 계속 유지하되, 기본값은 "planned" 로 둔다. 추후 backend 에 컬럼이
 * 생기면 여기서 매핑만 바꾸면 된다.
 *
 * 수집이 진행 중(backend `collection_status === pending|processing`) 이면
 * status 는 "analyzing" 으로 표시해 카드에 "분석 중" 오버레이가 뜨도록 한다.
 */

import { create } from "zustand";
import { userJobDescriptionApi, type JobDescriptionCollectionStatus, type UserJobDescription, type UserJobDescriptionStats } from "@/features/user-job-description";
import {
  getCompanyColor,
  getCompanyInitial,
  getRelativeTime,
  getTagColor,
} from "../api/jdListHelpers";
import { inferCategoryId } from "@/shared/ui/inferCategoryId";

/** 사용자 상태 (프론트 placeholder — 추후 backend 에 저장). */
export type JdStatus = "planned" | "applied" | "saved";

/** 카드에 표시되는 통합 상태 — 수집 중이면 `analyzing`, 끝나면 사용자 상태. */
export type JdListStatus = JdStatus | "analyzing";

export interface JdTag {
  label: string;
  color: "default" | "green" | "blue" | "pink";
}

export interface JdListItem {
  uuid: string; // UserJobDescription.uuid (route param 으로 사용)
  company: string;
  companyInitial: string;
  companyColor: string;
  categoryId: number;
  title: string;
  categoryId: number;
  status: JdListStatus;
  tags: JdTag[];
  registeredAt: string;
  analyzed: boolean;
  /** backend 원본 수집 상태. failed 표시 등에 사용. */
  collectionStatus: JobDescriptionCollectionStatus;
  raw: UserJobDescription;
}

export type FilterKey = "all" | "planned" | "applied" | "saved";

export type JdListStats = UserJobDescriptionStats;

interface JdListState {
  items: JdListItem[];
  stats: JdListStats;
  searchQuery: string;
  activeFilter: FilterKey;
  isLoading: boolean;
   isLoadingMore: boolean;
   hasNext: boolean;
   nextPage: number | null;
  error: string | null;
  filtered: JdListItem[];

  fetchList: () => Promise<void>;
   loadMore: () => Promise<void>;
  setSearch: (q: string) => void;
  setFilter: (f: FilterKey) => void;
}

function transform(item: UserJobDescription): JdListItem {
  const jd = item.jobDescription;
  const company = jd.company || "수집 중";
  const title = item.title || jd.title || "채용공고";

  // 수집 중이면 "분석 중" 으로 보여주고, 끝나면 기본 사용자 상태("planned") 로 둔다.
  const isAnalyzing = jd.collectionStatus === "pending" || jd.collectionStatus === "in_progress";
  const status: JdListStatus = isAnalyzing ? "analyzing" : (item.applicationStatus || "planned") as JdStatus;

  // 태그 자리 — backend 에 아직 없으니 platform / location 을 임시로 태그로 노출
  const tags: JdTag[] = [];
  if (jd.platform) tags.push({ label: jd.platform, color: getTagColor(jd.platform) });
  if (jd.location) tags.push({ label: jd.location, color: getTagColor(jd.location) });

  return {
    uuid: item.uuid,
    company,
    companyInitial: getCompanyInitial(company),
    companyColor: getCompanyColor(company),
    categoryId: inferCategoryId(jd.platform || "", title),
    title,
    categoryId: inferCategoryId(jd.platform || "", title),
    status,
    tags,
    registeredAt: getRelativeTime(item.createdAt),
    analyzed: jd.collectionStatus === "done",
    collectionStatus: jd.collectionStatus,
    raw: item,
  };
}

function applyFilter(items: JdListItem[], query: string, filter: FilterKey): JdListItem[] {
  let result = items;

  if (filter !== "all") {
    result = result.filter((i) => i.status === filter);
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (i) =>
        i.company.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.tags.some((t) => t.label.toLowerCase().includes(q)),
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
   isLoadingMore: false,
   hasNext: false,
   nextPage: null,
  error: null,
  filtered: [],

  fetchList: async () => {
    set({ isLoading: true, error: null });
    try {
      const [page1, statsData] = await Promise.all([
        userJobDescriptionApi.listPage(1),
        userJobDescriptionApi.getStats(),
      ]);
      const raw = page1.results;
      const items = raw.map(transform);
      const { searchQuery, activeFilter } = get();
      set({
        isLoading: false,
        items,
        stats: statsData,
        filtered: applyFilter(items, searchQuery, activeFilter),
        nextPage: page1.nextPage,
        hasNext: page1.nextPage != null,
      });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : "목록을 불러오지 못했습니다.",
      });
    }
  },

   loadMore: async () => {
    const { nextPage, isLoading, isLoadingMore, hasNext } = get();
    if (isLoading || isLoadingMore || !hasNext || nextPage == null) {
      return;
    }

    set({ isLoadingMore: true, error: null });
    try {
      const page = await userJobDescriptionApi.listPage(nextPage);
      const newItems = page.results.map(transform);

      set((state) => {
        const mergedItems = [...state.items, ...newItems];
        return {
          isLoadingMore: false,
          items: mergedItems,
          filtered: applyFilter(mergedItems, state.searchQuery, state.activeFilter),
          nextPage: page.nextPage,
          hasNext: page.nextPage != null,
        };
      });
    } catch (e) {
      set({
        isLoadingMore: false,
        error: e instanceof Error ? e.message : "다음 목록을 불러오지 못했습니다.",
      });
    }
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
