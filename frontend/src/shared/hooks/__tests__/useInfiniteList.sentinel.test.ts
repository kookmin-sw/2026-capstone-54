import { renderHook, act, waitFor } from "@testing-library/react";
import { useInfiniteList } from "../useInfiniteList";

interface Item { id: number; name: string; }

const makePage = (page: number, size: number, totalPages: number) => ({
  count: totalPages * size,
  totalPagesCount: totalPages,
  nextPage: page < totalPages ? page + 1 : null,
  previousPage: page > 1 ? page - 1 : null,
  results: Array.from({ length: size }, (_, i) => ({
    id: (page - 1) * size + i,
    name: `item ${(page - 1) * size + i}`,
  })) as Item[],
});

class FakeObserver {
  static instances: FakeObserver[] = [];
  callback: (entries: Array<{ isIntersecting: boolean }>) => void;
  options: unknown;
  observed: HTMLElement[] = [];
  disconnected = false;

  constructor(
    callback: (entries: Array<{ isIntersecting: boolean }>) => void,
    options?: unknown,
  ) {
    this.callback = callback;
    this.options = options;
    FakeObserver.instances.push(this);
  }

  observe(node: HTMLElement) { this.observed.push(node); }
  unobserve() {}
  disconnect() { this.disconnected = true; }

  trigger(isIntersecting = true) {
    this.callback([{ isIntersecting }]);
  }
}

describe("useInfiniteList — sentinelRef + IntersectionObserver", () => {
  beforeEach(() => {
    FakeObserver.instances = [];
    (globalThis as unknown as { IntersectionObserver: typeof FakeObserver }).IntersectionObserver = FakeObserver;
  });

  it("sentinelRef(node) 호출 시 IntersectionObserver 생성 + observe", async () => {
    const fetchPage = jest.fn(async (page: number) => makePage(page, 2, 3));
    const { result } = renderHook(() => useInfiniteList<Item>({ fetchPage }));
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    const node = document.createElement("div");
    act(() => result.current.sentinelRef(node));

    expect(FakeObserver.instances).toHaveLength(1);
    expect(FakeObserver.instances[0].observed).toContain(node);
  });

  it("rootMargin 옵션이 IntersectionObserver 에 전달됨", async () => {
    const fetchPage = jest.fn(async (page: number) => makePage(page, 2, 3));
    const { result } = renderHook(() =>
      useInfiniteList<Item>({ fetchPage, rootMargin: "500px" })
    );
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    const node = document.createElement("div");
    act(() => result.current.sentinelRef(node));

    expect((FakeObserver.instances[0].options as { rootMargin: string }).rootMargin).toBe("500px");
  });

  it("isIntersecting=true 시 loadMore 호출", async () => {
    const fetchPage = jest.fn(async (page: number) => makePage(page, 2, 3));
    const { result } = renderHook(() => useInfiniteList<Item>({ fetchPage }));
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    const node = document.createElement("div");
    act(() => result.current.sentinelRef(node));

    await act(async () => {
      FakeObserver.instances[0].trigger(true);
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => expect(fetchPage).toHaveBeenCalledWith(2));
  });

  it("isIntersecting=false 시 loadMore 호출 안 함", async () => {
    const fetchPage = jest.fn(async (page: number) => makePage(page, 2, 3));
    const { result } = renderHook(() => useInfiniteList<Item>({ fetchPage }));
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    const node = document.createElement("div");
    act(() => result.current.sentinelRef(node));

    act(() => FakeObserver.instances[0].trigger(false));

    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("sentinelRef(null) 호출 시 기존 observer disconnect", async () => {
    const fetchPage = jest.fn(async (page: number) => makePage(page, 2, 3));
    const { result } = renderHook(() => useInfiniteList<Item>({ fetchPage }));
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    const node = document.createElement("div");
    act(() => result.current.sentinelRef(node));

    const observer = FakeObserver.instances[0];
    expect(observer.disconnected).toBe(false);

    act(() => result.current.sentinelRef(null));
    expect(observer.disconnected).toBe(true);
  });

  it("새 노드로 sentinelRef 호출 시 이전 observer disconnect + 새 observer 생성", async () => {
    const fetchPage = jest.fn(async (page: number) => makePage(page, 2, 3));
    const { result } = renderHook(() => useInfiniteList<Item>({ fetchPage }));
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    const node1 = document.createElement("div");
    const node2 = document.createElement("div");

    act(() => result.current.sentinelRef(node1));
    act(() => result.current.sentinelRef(node2));

    expect(FakeObserver.instances).toHaveLength(2);
    expect(FakeObserver.instances[0].disconnected).toBe(true);
    expect(FakeObserver.instances[1].observed).toContain(node2);
  });
});
