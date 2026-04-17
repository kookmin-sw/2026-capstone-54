import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useAchievementsStore } from "@/features/achievements";
import { AchievementCard } from "@/features/achievements";
import { refreshAchievementsApi } from "@/features/achievements/api/achievementsApi";

export function AchievementsPage() {
  const { data, loading, error, fetchAchievements, claimAchievement, claimingCodes } =
    useAchievementsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    const res = await refreshAchievementsApi();
    if (res.success) {
      setRefreshMsg(
        res.data && res.data.created_achievements_count > 0
          ? `${res.data.created_achievements_count}개의 새 도전과제가 추가됐습니다.`
          : "이미 최신 상태입니다."
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
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.4px] uppercase text-[#0991B2] bg-[#E6F7FA] py-1 px-3 rounded-full mb-2.5">
              🏆 도전과제
            </div>
            <h1 className="text-[clamp(24px,3vw,36px)] font-black tracking-[-0.8px] text-[#0A0A0A] leading-[1.1]">
              내 도전과제
            </h1>
            <p className="text-sm text-[#6B7280] mt-1.5">달성한 업적을 확인하고 보상을 수령하세요.</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
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
            {refreshMsg && (
              <span className="text-xs text-[#6B7280]">{refreshMsg}</span>
            )}
          </div>
        </div>

        {/* 컨텐츠 */}
        {loading && !data ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#0991B2]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-5">⚠️</span>
            <p className="text-[15px] font-extrabold text-[#0A0A0A] mb-2">불러오기 실패</p>
            <p className="text-sm text-[#9CA3AF]">{error}</p>
          </div>
        ) : data && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-5">🏆</span>
            <p className="text-[15px] font-extrabold text-[#0A0A0A] mb-2">아직 달성한 도전과제가 없어요</p>
            <p className="text-sm text-[#9CA3AF]">면접 연습을 통해 도전과제를 달성해 보세요</p>
          </div>
        ) : data ? (
          <div
            className="grid gap-[18px]"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}
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
        ) : null}
      </div>
    </div>
  );
}
