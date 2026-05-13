const mockListPage = jest.fn();
const mockGetStats = jest.fn();

jest.mock("@/features/user-job-description", () => ({
  userJobDescriptionApi: {
    listPage: (...args: unknown[]) => mockListPage(...args),
    getStats: (...args: unknown[]) => mockGetStats(...args),
  },
}));

import { useJdListStore } from "../listStore";

function makeItem(overrides?: Partial<{
  uuid: string;
  title: string;
  applicationStatus: "planned" | "applied" | "saved";
  collectionStatus: "pending" | "in_progress" | "done" | "error";
  company: string;
  platform: string;
  location: string;
  createdAt: string;
}>) {
  const o = { uuid: "u-1", title: "Backend Engineer", applicationStatus: "planned" as const,
    collectionStatus: "done" as const, company: "Acme", platform: "remoteok", location: "Seoul",
    createdAt: new Date(Date.now() - 86400000).toISOString(), ...overrides };
  return {
    uuid: o.uuid,
    title: o.title,
    applicationStatus: o.applicationStatus,
    createdAt: o.createdAt,
    jobDescription: {
      company: o.company,
      title: o.title,
      platform: o.platform,
      location: o.location,
      collectionStatus: o.collectionStatus,
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useJdListStore.setState({
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
  });
});

describe("useJdListStore — fetchList / transform", () => {
  it("fetchList 성공 → items + stats + filtered 채워짐", async () => {
    mockListPage.mockResolvedValue({
      results: [makeItem({ uuid: "j1" }), makeItem({ uuid: "j2", applicationStatus: "applied" })],
      nextPage: 2,
    });
    mockGetStats.mockResolvedValue({ total: 2, planned: 1, applied: 1, saved: 0 });

    await useJdListStore.getState().fetchList();
    const s = useJdListStore.getState();

    expect(s.isLoading).toBe(false);
    expect(s.items).toHaveLength(2);
    expect(s.filtered).toHaveLength(2);
    expect(s.stats.total).toBe(2);
    expect(s.hasNext).toBe(true);
    expect(s.nextPage).toBe(2);
  });

  it("transform: collection 'in_progress' → status='analyzing'", async () => {
    mockListPage.mockResolvedValue({
      results: [makeItem({ uuid: "j1", collectionStatus: "in_progress" })],
      nextPage: null,
    });
    mockGetStats.mockResolvedValue({ total: 1, planned: 0, applied: 0, saved: 0 });

    await useJdListStore.getState().fetchList();
    expect(useJdListStore.getState().items[0].status).toBe("analyzing");
  });

  it("transform: tags 에 platform + location 포함", async () => {
    mockListPage.mockResolvedValue({
      results: [makeItem({ platform: "remoteok", location: "Seoul" })],
      nextPage: null,
    });
    mockGetStats.mockResolvedValue({ total: 1, planned: 0, applied: 0, saved: 0 });

    await useJdListStore.getState().fetchList();
    const tags = useJdListStore.getState().items[0].tags;
    expect(tags.map((t) => t.label)).toEqual(["remoteok", "Seoul"]);
  });

  it("fetchList 실패 → error 설정", async () => {
    mockListPage.mockRejectedValue(new Error("server fail"));
    mockGetStats.mockResolvedValue({ total: 0, planned: 0, applied: 0, saved: 0 });

    await useJdListStore.getState().fetchList();
    expect(useJdListStore.getState().error).toBe("server fail");
    expect(useJdListStore.getState().isLoading).toBe(false);
  });
});

describe("useJdListStore — setSearch / setFilter / loadMore", () => {
  beforeEach(async () => {
    mockListPage.mockResolvedValue({
      results: [
        makeItem({ uuid: "j1", company: "Acme", title: "Backend", applicationStatus: "planned" }),
        makeItem({ uuid: "j2", company: "Toss", title: "Frontend", applicationStatus: "applied" }),
        makeItem({ uuid: "j3", company: "Naver", title: "Mobile", applicationStatus: "saved" }),
      ],
      nextPage: null,
    });
    mockGetStats.mockResolvedValue({ total: 3, planned: 1, applied: 1, saved: 1 });
    await useJdListStore.getState().fetchList();
  });

  it("setFilter='applied' → filtered 1 개만 (applied 상태)", () => {
    useJdListStore.getState().setFilter("applied");
    const f = useJdListStore.getState().filtered;
    expect(f).toHaveLength(1);
    expect(f[0].uuid).toBe("j2");
  });

  it("setSearch='backend' → company/title 매칭 1 개만", () => {
    useJdListStore.getState().setSearch("backend");
    expect(useJdListStore.getState().filtered).toHaveLength(1);
    expect(useJdListStore.getState().filtered[0].uuid).toBe("j1");
  });

  it("setSearch + setFilter 동시 적용", () => {
    useJdListStore.getState().setFilter("saved");
    useJdListStore.getState().setSearch("acme");
    expect(useJdListStore.getState().filtered).toHaveLength(0);
  });

  it("loadMore: hasNext=false → 호출 안 됨", async () => {
    await useJdListStore.getState().loadMore();
    expect(mockListPage).toHaveBeenCalledTimes(1);
  });

  it("loadMore: nextPage 있음 → items 누적", async () => {
    useJdListStore.setState({ nextPage: 2, hasNext: true });
    mockListPage.mockResolvedValueOnce({
      results: [makeItem({ uuid: "j4", company: "New" })],
      nextPage: null,
    });

    await useJdListStore.getState().loadMore();
    const s = useJdListStore.getState();
    expect(s.items).toHaveLength(4);
    expect(s.hasNext).toBe(false);
    expect(s.isLoadingMore).toBe(false);
  });

  it("loadMore 실패 → error 설정", async () => {
    useJdListStore.setState({ nextPage: 2, hasNext: true });
    mockListPage.mockRejectedValueOnce(new Error("next fail"));

    await useJdListStore.getState().loadMore();
    expect(useJdListStore.getState().error).toBe("next fail");
  });
});
