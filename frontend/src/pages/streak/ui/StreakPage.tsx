import { useEffect, useMemo, useState } from "react";
import { useStreakStore } from "@/features/streak";
import { StreakHero } from "./components/StreakHero";
import { StreakCalendar } from "./components/StreakCalendar";
import { NextReward } from "./components/NextReward";
import { Milestones } from "@/features/milestones";
import { RewardHistory } from "./components/RewardHistory";

export function StreakPage() {
  const { data, loading, fetchStreak } = useStreakStore();

  const { todayY, todayM, todayD } = useMemo(() => {
    const now = new Date();
    return {
      todayY: now.getFullYear(),
      todayM: now.getMonth() + 1,
      todayD: now.getDate(),
    };
  }, []);

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(t);
  }, [data]);

  return (
    <div className="bg-[#F9FAFB] min-h-[calc(100vh-60px)] p-7 w-full max-sm:p-4">
      {loading && !data ? (
        <div className="flex flex-col gap-4">
          <div className="skeleton-gray rounded-xl" style={{ height: 160 }} />
          <div className="skeleton-gray rounded-xl" style={{ height: 200 }} />
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="skeleton-gray rounded-xl" style={{ height: 240 }} />
            <div className="skeleton-gray rounded-xl" style={{ height: 240 }} />
          </div>
        </div>
      ) : data ? (
        <div>
          {/* Hero: streak count + stats + progress */}
          <StreakHero
            currentStreak={data.currentStreak}
            bestStreak={data.bestStreak}
            totalDays={data.totalDays}
            rewardsCount={data.rewardsCount}
            todayCompleted={data.todayCompleted}
            nextReward={data.nextReward}
          />

          {/* Calendar: full width */}
          <StreakCalendar
            calendarDoneMap={data.calendarDoneMap}
            revealed={revealed}
            todayYear={todayY}
            todayMonth={todayM}
            todayDay={todayD}
          />

          {/* Bottom grid: 3 columns on desktop, 1 on mobile */}
          <div className="grid grid-cols-3 gap-4 mt-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <NextReward
              nextReward={data.nextReward}
              currentStreak={data.currentStreak}
              revealed={revealed}
            />

            <Milestones fallbackData={data.milestones} revealed={revealed} />

            <RewardHistory rewardHistory={data.rewardHistory} revealed={revealed} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
