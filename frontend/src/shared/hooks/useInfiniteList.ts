/** 페이지네이션 기반 백엔드 API를 무한 스크롤로 소비하기 위한 범용 훅. */
import { useCallback, useEffect, useRef, useState } from "react";

interface PaginatedLike<T> {
  count: number;
  totalPagesCount: number;
  nextPage: number | null;
  previousPage: number | null;
  results: T[];
}

interface UseInfiniteListOptions<T> {
  fetchPage: (page: number) => Promise<PaginatedLike<T>>;
  /** IntersectionObserver rootMargin. 기본 200px 전에 미리 로드. */
  rootMargin?: string;
  /** 초기 로드 여부 (기본 true). */
  autoStart?: boolean;
}

interface UseInfiniteListReturn<T> {
  items: T[];
  totalCount: number;
  isLoading: boolean;
  hasNext: boolean;
  error: Error | null;
  /** 마지막 요소에 붙여 IntersectionObserver 등록. */
  sentinelRef: (node: HTMLElement | null) => void;
  /** 처음부터 다시 로드. */
  reset: () => void;
  /** 수동으로 다음 페이지 로드. */
  loadMore: () => void;
  /** items 조작 (낙관적 업데이트 등). */
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
}

export function useInfiniteList<T>({
  fetchPage,
  rootMargin = "200px",
  autoStart = true,
}: UseInfiniteListOptions<T>): UseInfiniteListReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const pageRef = useRef(1);
  const hasNextRef = useRef(true);
  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasNextRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPage(pageRef.current);
      const results = Array.isArray(data?.results) ? data.results : [];
      setItems((prev) => (pageRef.current === 1 ? results : [...prev, ...results]));
      setTotalCount(typeof data?.count === "number" ? data.count : results.length);
      const next = data?.nextPage != null;
      setHasNext(next);
      hasNextRef.current = next;
      if (next) pageRef.current += 1;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [fetchPage]);

  const reset = useCallback(() => {
    pageRef.current = 1;
    hasNextRef.current = true;
    setHasNext(true);
    setItems([]);
    setTotalCount(0);
    setError(null);
    loadMore();
  }, [loadMore]);

  // 초기 로드
  useEffect(() => {
    if (autoStart) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver 기반 sentinel
  const sentinelRef = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin },
    );
    observerRef.current.observe(node);
  }, [loadMore, rootMargin]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { items, totalCount, isLoading, hasNext, error, sentinelRef, reset, loadMore, setItems };
}
