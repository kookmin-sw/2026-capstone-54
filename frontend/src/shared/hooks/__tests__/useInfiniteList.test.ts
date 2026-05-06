import { renderHook, act, waitFor } from "@testing-library/react";
import { useInfiniteList } from "../useInfiniteList";

interface Item { id: number; name: string; }

const makePage = (page: number, size: number, totalPages: number) => ({
  count: totalPages * size,
  totalPagesCount: totalPages,
  nextPage: page < totalPages ? page + 1 : null,
  previousPage: page > 1 ? page - 1 : null,
  results: Array.from({ length: size }, (_, i) => ({ id: (page - 1) * size + i, name: `item ${(page - 1) * size + i}` })) as Item[],
});

describe("useInfiniteList", () => {
  beforeEach(() => {
    // Stub IntersectionObserver (not used in explicit loadMore tests)
    // @ts-expect-error — overriding global
    global.IntersectionObserver = class {
      constructor(_callback: unknown, _options?: unknown) { void _callback; void _options; }
      observe() { /* noop */ }
      unobserve() { /* noop */ }
      disconnect() { /* noop */ }
    };
  });

  it("초기 로드 시 첫 페이지를 가져와서 items에 채운다", async () => {
    const fetchPage = jest.fn(async (page: number) => makePage(page, 2, 2));
    const { result } = renderHook(() => useInfiniteList<Item>({ fetchPage }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(2);
    expect(result.current.totalCount).toBe(4);
    expect(result.current.hasNext).toBe(true);
    expect(fetchPage).toHaveBeenCalledWith(1);
  });

  it("loadMore 호출 시 다음 페이지를 append한다", async () => {
    const fetchPage = jest.fn(async (page: number) => makePage(page, 2, 2));
    const { result } = renderHook(() => useInfiniteList<Item>({ fetchPage }));

    await waitFor(() => expect(result.current.items).toHaveLength(2));

    await act(async () => { await result.current.loadMore(); });

    expect(result.current.items).toHaveLength(4);
    expect(result.current.hasNext).toBe(false);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("hasNext가 false면 loadMore를 무시한다", async () => {
    const fetchPage = jest.fn(async () => makePage(1, 2, 1));
    const { result } = renderHook(() => useInfiniteList<Item>({ fetchPage }));

    await waitFor(() => expect(result.current.hasNext).toBe(false));
    await act(async () => { await result.current.loadMore(); });

    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("reset 호출 시 첫 페이지부터 다시 로드한다", async () => {
    const fetchPage = jest.fn(async (page: number) => makePage(page, 2, 3));
    const { result } = renderHook(() => useInfiniteList<Item>({ fetchPage }));

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    await act(async () => { await result.current.loadMore(); });
    expect(result.current.items).toHaveLength(4);

    await act(async () => { result.current.reset(); });
    await waitFor(() => expect(result.current.items).toHaveLength(2));
  });

  it("results가 없으면 빈 배열로 안전하게 처리한다", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchPage = jest.fn(async () => ({}) as any);
    const { result } = renderHook(() => useInfiniteList<Item>({ fetchPage }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(result.current.hasNext).toBe(false);
  });

  it("fetchPage 에러 시 error 상태로 전환된다", async () => {
    const fetchPage = jest.fn(async () => { throw new Error("boom"); });
    const { result } = renderHook(() => useInfiniteList<Item>({ fetchPage }));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe("boom");
    expect(result.current.items).toEqual([]);
  });

  it("autoStart=false면 초기 로드를 실행하지 않는다", async () => {
    const fetchPage = jest.fn(async () => makePage(1, 2, 1));
    const { result } = renderHook(() =>
      useInfiniteList<Item>({ fetchPage, autoStart: false }),
    );

    // Wait a tick to confirm no fetch happens
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchPage).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
  });
});
