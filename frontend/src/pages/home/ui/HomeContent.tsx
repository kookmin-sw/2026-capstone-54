import { useEffect, useMemo, useState } from "react";
import { useHomeStore } from "@/features/home";
import { useStreakStore } from "@/features/streak";
import { StreakCalendar } from "@/pages/streak/ui/components/StreakCalendar";
import {
  HomeHeader,
  QuickStartHero,
  StatsGrid,
  RecentSessions,
  JobStatus,
  LoadingSkeleton,
} from "./components";
import "./HomePage.css";

export function HomeContent() {
  const { data, loading, fetchHome } = useHomeStore();
  const { data: streakData, fetchStreak } = useStreakStore();
  const [revealed, setRevealed] = useState(false);

  const { todayY, todayM, todayD } = useMemo(() => {
    const now = new Date();
    return {
      todayY: now.getFullYear(),
      todayM: now.getMonth() + 1,
      todayD: now.getDate(),
    };
  }, []);

  useEffect(() => {
    fetchHome();
    fetchStreak();
  }, [fetchHome, fetchStreak]);

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => setRevealed(true), 50);
    return () => clearTimeout(t);
  }, [data]);

  return (
    <div className="hp-main">
      {loading && !data ? (
        <LoadingSkeleton />
      ) : data ? (
        <>
          <HomeHeader
            greeting={data.user.greeting}
            userName={data.user.name}
            lastInterviewDaysAgo={data.user.lastInterviewDaysAgo}
          />

          <QuickStartHero revealed={revealed} />

          <StatsGrid stats={data.stats} revealed={revealed} />

          <RecentSessions sessions={data.recentSessions} revealed={revealed} />

          {streakData && (
            <StreakCalendar
              calendarDoneMap={streakData.calendarDoneMap}
              revealed={revealed}
              todayYear={todayY}
              todayMonth={todayM}
              todayDay={todayD}
            />
          )}

          <div className="hp-bottom" style={{ gridTemplateColumns: "1fr" }}>
            <JobStatus jobs={data.jobs} revealed={revealed} />
          </div>
        </>
      ) : null}
    </div>
  );
}
