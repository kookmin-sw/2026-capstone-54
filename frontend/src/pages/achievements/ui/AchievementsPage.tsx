import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAchievementsStore } from "@/features/achievements";
import { AchievementCard } from "@/features/achievements";
import { refreshAchievementsApi } from "@/features/achievements/api/achievementsApi";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { Button } from "@/shared/ui/Button";

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
    <div className="bg-[#F9FAFB] min-h-[calc(100vh-60px)] p-7 w-full max-sm:p-4">
      <SectionHeader
        icon="🏆"
        title="도전과제"
        description="달성한 업적을 확인하고 보상을 수령하세요."
        gradient="linear-gradient(135deg, #fbbf24, #f59e0b)"
      >
        <div className="flex items-center gap-3 mt-3">
          <Button
            variant="outline"
            size="sm"
            loading={refreshing}
            disabled={refreshing}
            onClick={handleRefresh}
          >
            <RefreshCw size={14} />
            평가 새로고침
          </Button>
          {refreshMsg && (
            <span className="text-xs text-mefit-gray-500">{refreshMsg}</span>
          )}
        </div>
      </SectionHeader>

      {loading && !data ? (
        <div className="flex justify-center items-center py-20">
          <Spinner />
        </div>
      ) : error ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-mefit-danger">{error}</p>
        </div>
      ) : data && data.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-mefit-gray-400">도전과제가 없습니다.</p>
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
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
  );
}
