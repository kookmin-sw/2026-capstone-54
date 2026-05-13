import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, Trophy } from "lucide-react";
import { useAchievementsStore, AchievementCard } from "@/features/achievements";
import { FilterUI } from "@/features/achievements/ui/FilterUI";
import { refreshAchievementsApi } from "@/features/achievements/api/achievementsApi";

export function AchievementsPage() {
  const {
    data,
    loading,
    loadingMore,
    error,
    claimError,
    hasMore,
    total,
    fetchAchievements,
    loadMore,
    claimAchievement,
    claimingCodes,
    filters,
  } = useAchievementsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 초기 데이터 로딩 및 URL 파라미터 동기화
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const status = params.get("status");
    const rewardClaim = params.get("reward_claim");

    if (category || status || rewardClaim) {
      useAchievementsStore.getState().setFilters({
        category: category || null,
        status: status || null,
        rewardClaim: rewardClaim || null,
      });
    } else {
      fetchAchievements();
    }
  }, [fetchAchievements]);

  // 필터 변경 시 URL 쿼리 파라미터 동기화
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status", filters.status);
    if (filters.rewardClaim) params.set("reward_claim", filters.rewardClaim);
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [filters]);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
        loadMore();
      }
    },
    [hasMore, loading, loadingMore, loadMore],
  );

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    const res = await refreshAchievementsApi();
    if (res.success) {
      setRefreshMsg(
        res.data && res.data.createdAchievementsCount > 0
          ? `${res.data.createdAchievementsCount}개의 새 도전과제가 추가됐습니다.`
          : "이미 최신 상태입니다.",
      );
      await fetchAchievements();
    } else {
      setRefreshMsg(res.error ?? "잠시 후 다시 시도해주세요.");
    }
    setRefreshing(false);
  };

  return (
    <div>
      <div className="w-full px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        {/* 페이지 타이틀 */}
        <div className="flex items-start justify-between mb-8 gap-4 max-sm:flex-col">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.4px] uppercase text-[#0991B2] bg-[#E6F7FA] py-1 px-3 rounded-full mb-2.5">
              <Trophy size={12} /> 도전과제
            </div>
            <h1 className="text-[clamp(24px,3vw,36px)] font-black tracking-[-0.8px] text-[#0A0A0A] leading-[1.1]">
              내 도전과제
            </h1>
            <p className="text-sm text-[#6B7280] mt-1.5">
              달성한 업적을 확인하고 보상을 수령하세요.
              {data && <span className="ml-1">({total}개)</span>}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0 max-sm:items-start">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] border-none cursor-pointer py-3.5 px-6 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-85 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              평가 새로고침
            </button>
            {refreshMsg && <span className="text-xs text-[#6B7280]">{refreshMsg}</span>}
          </div>
        </div>

        {/* 필터 UI */}
        <FilterUI />

        {/* 컨텐츠 */}
        {loading && !data ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#0991B2]" />
          </div>
        ) : !data && error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle size={48} className="text-[#F59E0B] mb-5" />
            <p className="text-[15px] font-extrabold text-[#0A0A0A] mb-2">불러오기 실패</p>
            <p className="text-sm text-[#9CA3AF]">{error}</p>
            <button
              onClick={fetchAchievements}
              className="mt-4 text-sm font-bold text-[#0991B2] hover:underline"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <>
            {(error || claimError) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error ?? claimError}
              </div>
            )}
            {data && data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-[40px] mb-4">🏆</div>
                <p className="text-[15px] font-extrabold text-[#0A0A0A] mb-2">
                  {filters.category || filters.status || filters.rewardClaim
                    ? "조건에 맞는 도전과제가 없어요"
                    : "아직 달성한 도전과제가 없어요"}
                </p>
                <p className="text-sm text-[#9CA3AF]">
                  {filters.category || filters.status || filters.rewardClaim
                    ? "필터를 변경해 보세요"
                    : "면접 연습을 통해 도전과제를 달성해 보세요"}
                </p>
              </div>
            ) : data ? (
              <>
                <div
                  className="grid gap-[18px]"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))" }}
                >
                  {data.map((achievement) => (
                    <AchievementCard
                      key={achievement.code}
                      achievement={achievement}
                      isClaiming={claimingCodes.has(achievement.code)}
                      onClaim={claimAchievement}
                    />
                  ))}
                </div>

                {/* 무한 스크롤 로딩 */}
                {loadingMore && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0991B2]" />
                  </div>
                )}

                {/* Intersection Observer 타겟 */}
                <div ref={observerTarget} className="h-4" />

                {/* 모든 데이터 로드 완료 */}
                {!hasMore && data.length > 0 && (
                  <p className="text-center text-sm text-[#9CA3AF] py-6">
                    모든 도전과제를 불러왔습니다.
                  </p>
                )}
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
